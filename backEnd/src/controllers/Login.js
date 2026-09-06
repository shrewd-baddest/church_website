import dotenv from "dotenv";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db as pool } from "../Configs/dbConfig.js";
import logger from "../logger/winston.js";
import sendMail from "../Configs/emailConfig.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeRefreshToken,
  decodeAccessToken,
} from "../utils/jwtConfig.js";
import {
  validatePasswordPolicy,
  assertNotRecentlyUsed,
  recordPassword,
  MAX_LOGIN_ATTEMPTS,
  LOGIN_LOCK_MINUTES,
} from "../utils/passwordPolicy.js";
dotenv.config();

const logLoginAttempt = async ({ member_id, email, action, req }) => {
  try {
    await pool.query(
      `INSERT INTO login_audit_log (member_id, email, action, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        member_id || null,
        email || null,
        action,
        req?.ip || null,
        req?.get?.("user-agent") || null,
        JSON.stringify({ path: req?.originalUrl || req?.path }),
      ]
    );
  } catch {
    // audit logging must never block the request
  }
};

// The refresh token lives in an httpOnly cookie so injected JS (XSS) can't read
// it. SameSite=None is required because the frontend (Vercel) and API (Render)
// are different sites; Secure is mandatory alongside it. When running over
// plain http (local dev) the cookie is kept non-secure so the browser accepts
// it. `req.secure` honors the X-Forwarded-Proto header via `trust proxy`.
const refreshCookieOptions = (req) => {
  const secure = Boolean(req.secure);
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: 20 * 60 * 60 * 1000,
  };
};

const setRefreshTokenCookie = (res, req, refreshToken) =>
  res.cookie("refreshToken", refreshToken, refreshCookieOptions(req));

const clearRefreshTokenCookie = (res, req) =>
  res.clearCookie("refreshToken", refreshCookieOptions(req));

// Normalize login timing: unknown users return before bcrypt work, which leaks
// account existence via response latency. Burn a comparable amount of time
// (and the same work) for unknown members so timing stays uniform.
const DUMMY_BCRYPT_HASH = "$2b$10$Cw6T9y7qVXgQvZ0N8r9rq.yG8xZ1hV0w3N2mQoKv5yYf8Z6Wk5m7m";
const normalizeLoginTiming = async () => {
  try {
    await bcrypt.compare(crypto.randomUUID(), DUMMY_BCRYPT_HASH);
  } catch {
    // timing normalization is best-effort; never block the response
  }
};

export const Login = async (req, res) => {
  let { userReg, password } = req.body ?? {};

  userReg = userReg?.trim().toUpperCase();

  if (!userReg || !password) {
    console.log("Username and password required");
    logger.error("Username and password required");
    return res.status(400).json({ status: false, message: "Username and password required" });
  }
 try {
    const result = await pool.query(
      `      SELECT 
        m.member_id, 
        m.password, 
        m.jumuiya_id, 
        m.first_name, 
        m.last_name, 
        m.email,
        m.year_of_study,
        m.failed_login_attempts,
        m.locked_until,
        COALESCE(
          ARRAY_AGG(r.role_name) FILTER (WHERE r.role_name IS NOT NULL),
          ARRAY[]::text[]
        ) as roles
      FROM members m 
      LEFT JOIN member_roles mr ON m.member_id = mr.member_id AND mr.status = 'approved'
      LEFT JOIN roles r ON mr.role_id = r.role_id 
      WHERE m.member_id = $1
      GROUP BY m.member_id, m.password, m.jumuiya_id, m.first_name, m.last_name, m.email, m.year_of_study, m.failed_login_attempts, m.locked_until`,
      [userReg],
    );

    if (result.rows.length === 0) {
      logger.error(`Invalid username or password for '${userReg || "<empty>"}'`);
      await logLoginAttempt({ member_id: userReg, action: "login_failed_unknown", req });
      await normalizeLoginTiming();
      return res.status(401).json({ status: false, message: "Invalid username or password" });
    }

    const user = result.rows[0];

    // Account lockout: reject before doing any password work.
    const now = new Date();
    if (user.locked_until && new Date(user.locked_until) > now) {
      const minsLeft = Math.ceil((new Date(user.locked_until) - now) / 60000);
      logger.warn(`Login blocked for locked account '${userReg}'`);
      await logLoginAttempt({ member_id: userReg, action: "login_blocked_locked", req });
      return res.status(429).json({
        status: false,
        message: `Too many failed attempts. Try again in about ${minsLeft} minute${minsLeft === 1 ? "" : "s"}.`,
      });
    }

    const storedHash = typeof user.password === 'string' ? user.password.trim() : user.password;
    let match = await bcrypt.compare(password, storedHash);
    if (!match) {
      // The default password is the member's registration number (stored in
      // uppercase). Users often type it in lowercase — accept the uppercase
      // form too. This only ever succeeds when the stored hash corresponds to
      // an all-uppercase plaintext (i.e. the reg-number default).
      match = await bcrypt.compare(password.toUpperCase(), storedHash);
    }

    if (!match) {
      logger.error(`Invalid username or password for '${userReg}'`);
      await logLoginAttempt({ member_id: userReg, action: "login_failed_wrong_password", req });
      const attempts = (user.failed_login_attempts || 0) + 1;
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        await pool.query(
          `UPDATE members SET failed_login_attempts = 0, locked_until = NOW() + ($2 || ' minutes')::interval WHERE member_id = $1`,
          [userReg, LOGIN_LOCK_MINUTES]
        );
        logger.warn(`Account '${userReg}' locked after ${attempts} failed attempts`);
        await logLoginAttempt({ member_id: userReg, action: "login_account_locked", req });
        return res.status(429).json({
          status: false,
          message: `Too many failed attempts. Try again in ${LOGIN_LOCK_MINUTES} minutes.`,
        });
      }
      await pool.query(
        `UPDATE members SET failed_login_attempts = $2 WHERE member_id = $1`,
        [userReg, attempts]
      );
      return res.status(401).json({
        status: false,
        message: "Invalid username or password"
      });
    }

    // Successful login clears any lockout state.
    await pool.query(
      `UPDATE members SET failed_login_attempts = 0, locked_until = NULL WHERE member_id = $1`,
      [userReg]
    );

    // Detect first login: password matches their reg number, or missing email
    const isDefaultPassword = await bcrypt.compare(userReg, storedHash);
    const forcePasswordChange = isDefaultPassword || !user.email;

    const accessToken = signAccessToken({ id: user.member_id, role: user.roles, firstName: user.first_name, lastName: user.last_name, email: user.email, jumuiya_id: user.jumuiya_id });
    const refreshToken = signRefreshToken({ id: user.member_id, role: user.roles });

    // Save hashed refresh token to database
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 20);

    await pool.query(
      `INSERT INTO refresh_tokens (member_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.member_id, hashedToken, expiresAt]
    );

    // Only the access token is exposed to JS; the refresh token is httpOnly.
    setRefreshTokenCookie(res, req, refreshToken);

    await logLoginAttempt({ member_id: user.member_id, email: user.email, action: "login_success", req });

    res.status(200).json({
      status: "success",
      member_id: user.member_id,
      accessToken,
      role: user.roles,
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      jumuiya_id: user.jumuiya_id,
      year: user.year_of_study || null,
      forcePasswordChange,
      hasEmail: !!user.email,
    });
  } catch (err) {
    logger.error("Server error during login:", err);
    console.error("Login Error Details:", err);
    res.status(500).json({ 
      status: false, 
      message: "Server internal error",
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const generateAccesstoken = (id, role, firstName, lastName, email, jumuiya_id) =>
  signAccessToken({ id, role, firstName, lastName, email, jumuiya_id });

export const generateRefreshtoken = (id, role) => signRefreshToken({ id, role });

export const refreshAccessToken = async (req, res) => {
  const cookieToken = req.cookies?.refreshToken;
  const bodyToken = req.body?.refreshToken;
  const accessToken = req.body?.accessToken;
  const refreshToken = cookieToken || bodyToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    // Verify token
    const decoded = verifyRefreshToken(refreshToken);

    // Tab-session binding: the tab must be refreshing for the SAME member the
    // cookie was issued to. A refresh cookie is shared across tabs; without
    // this check, tab B (kim) would silently become tab A's user (steve) when
    // its access token expires. The binding uses the tab's current access
    // token (already available to JS), compared unverified against the cookie's
    // member so expired access tokens still work here.
    if (typeof accessToken === "string") {
      const payload = decodeAccessToken(accessToken);
      if (payload?.id && payload.id !== decoded.id) {
        return res.status(401).json({ error: "Session does not match the active session" });
      }
    }

    //  Check if any active tokens exist for this user in DB
    const result = await pool.query(
      `SELECT * FROM refresh_tokens WHERE member_id = $1 AND expires_at > NOW()`,
      [decoded.id],
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    let validToken = null;
    let isGraceMatch = false;

    // 1) Match against current tokens (normal path)
    for (const row of result.rows) {
      const isMatch = await bcrypt.compare(refreshToken, row.token);

      if (isMatch) {
        validToken = row;
        break;
      }
    }

    // 2) Grace window: the token was just rotated away by a concurrent tab —
    // accept it briefly so parallel racers re-sync instead of being logged out.
    if (!validToken) {
      const now = new Date();
      for (const row of result.rows) {
        if (
          row.previous_token &&
          row.previous_valid_until &&
          new Date(row.previous_valid_until) > now &&
          (await bcrypt.compare(refreshToken, row.previous_token))
        ) {
          validToken = row;
          isGraceMatch = true;
          break;
        }
      }
    }

    if (!validToken) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }
    //  Generate new access token
    const userResult = await pool.query(
      `SELECT m.member_id, m.jumuiya_id, m.first_name, m.last_name, m.email,
              COALESCE(
                ARRAY_AGG(r.role_name) FILTER (WHERE r.role_name IS NOT NULL),
                ARRAY[]::text[]
              ) as roles
       FROM members m
       LEFT JOIN member_roles mr ON m.member_id = mr.member_id AND mr.status = 'approved'
       LEFT JOIN roles r ON mr.role_id = r.role_id
       WHERE m.member_id = $1
       GROUP BY m.member_id, m.jumuiya_id, m.first_name, m.last_name, m.email`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: "User no longer exists" });
    }

    const user = userResult.rows[0];
    const accessTokenNew = generateAccesstoken(user.member_id, user.roles, user.first_name, user.last_name, user.email, user.jumuiya_id);
    const newRefreshToken = generateRefreshtoken(user.member_id, user.roles);
    // Save new hashed refresh token to database
    const hashedToken = await bcrypt.hash(newRefreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 20);

    // Rotate the matched refresh token record without invalidating other
    // active sessions for the same user. The replaced token is kept in a
    // short grace window (previous_token) so a concurrent tab presenting it
    // rotates cleanly instead of being force-logged-out.
    const GRACE_MS = 90 * 1000;
    const previousValidUntil = new Date(Date.now() + GRACE_MS);

    if (isGraceMatch) {
      // The row was already rotated moments ago by a racer; refresh it in place
      await pool.query(
        `UPDATE refresh_tokens SET token = $1, expires_at = $2,
                previous_token = NULL, previous_valid_until = NULL
         WHERE id = $3`,
        [hashedToken, expiresAt, validToken.id]
      );
    } else {
      // Move the just-used token into the grace slot of the NEW row
      await pool.query(`DELETE FROM refresh_tokens WHERE id = $1`, [validToken.id]);
      await pool.query(
        `INSERT INTO refresh_tokens (member_id, token, expires_at, previous_token, previous_valid_until)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.member_id, hashedToken, expiresAt, validToken.token, previousValidUntil]
      );
    }

    setRefreshTokenCookie(res, req, newRefreshToken);
    res.status(200).json({ accessToken: accessTokenNew });
  } catch (error) {
    logger.error("Refresh error:", error);
    console.error("Refresh Error Details:", error);
    return res.status(error.status || 403).json({ 
      error: error.message,
      detail: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * First-login setup: force password change + email recording.
 *
 * Verifies the current password before allowing any update, then:
 *  - Email already recorded on the member  → change password directly.
 *  - No email recorded but one is provided → stage the new password + email
 *    in `password_resets` (temp_password) and email an OTP. NOTHING is
 *    committed to `members` until the OTP is verified — so a failed OTP can
 *    never record the password or a (possibly wrong) email. The member may
 *    re-submit with a corrected email, which replaces the staged record.
 */
export const firstLoginSetup = async (req, res) => {
  try {
    const { member_id, currentPassword, newPassword, email, firstLogin } = req.body;

    if (!member_id || !currentPassword || !newPassword) {
      return res.status(400).json({ status: false, message: "member_id, currentPassword, and newPassword are required" });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ status: false, message: "New password must be at least 8 characters" });
    }

    // Fetch member
    const member = await pool.query(
      "SELECT member_id, password, email FROM members WHERE member_id = $1",
      [member_id]
    );
    if (member.rows.length === 0) {
      return res.status(404).json({ status: false, message: "Member not found" });
    }

    const storedHash = typeof member.rows[0].password === 'string' ? member.rows[0].password.trim() : member.rows[0].password;
    let valid = await bcrypt.compare(currentPassword, storedHash);
    if (!valid) {
      // Match the login fallback: the default reg-number password may be typed
      // in either case.
      valid = await bcrypt.compare(currentPassword.toUpperCase(), storedHash);
    }
    if (!valid) {
      return res.status(401).json({ status: false, message: "Current password is incorrect" });
    }

    const existingEmail = (member.rows[0].email || "").trim();
    const submittedEmail = (email || "").trim().toLowerCase();

    // Reject anything that isn't a real email address before staging an OTP.
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (submittedEmail && !EMAIL_REGEX.test(submittedEmail)) {
      return res.status(400).json({ status: false, message: "Please enter a valid email address" });
    }

    // Enforce the password policy (complexity, not common, not the reg number).
    const policy = validatePasswordPolicy(newPassword, {
      memberId: member_id,
      email: existingEmail || submittedEmail,
    });
    if (!policy.ok) {
      return res.status(400).json({ status: false, message: policy.message });
    }

    if (existingEmail) {
      try {
        await assertNotRecentlyUsed(pool, member_id, newPassword);
      } catch (historyErr) {
        return res.status(400).json({ status: false, message: historyErr.message });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await recordPassword(pool, member_id, hashed);
      await pool.query(
        "UPDATE members SET password = $1 WHERE member_id = $2",
        [hashed, member_id]
      );
      return res.json({ status: "success", message: "Password updated successfully" });
    }

    // No email on file and none provided.
    if (!submittedEmail) {
      if (firstLogin) {
        return res.status(400).json({ status: false, message: "An email address is required to finish setting up your account" });
      }
      // Authenticated member changing their password from account settings.
      try {
        await assertNotRecentlyUsed(pool, member_id, newPassword);
      } catch (historyErr) {
        return res.status(400).json({ status: false, message: historyErr.message });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await recordPassword(pool, member_id, hashed);
      await pool.query(
        "UPDATE members SET password = $1 WHERE member_id = $2",
        [hashed, member_id]
      );
      return res.json({ status: "success", message: "Password updated successfully" });
    }

    // Reject recently-used passwords up front so the user isn't told at the
    // final OTP step.
    try {
      await assertNotRecentlyUsed(pool, member_id, newPassword);
    } catch (historyErr) {
      return res.status(400).json({ status: false, message: historyErr.message });
    }

    const emailTaken = await pool.query(
      "SELECT 1 FROM members WHERE lower(email) = $1 AND member_id <> $2",
      [submittedEmail, member_id]
    );
    if (emailTaken.rows.length > 0) {
      return res.status(409).json({ status: false, message: "That email is already linked to another account" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const OTP = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash("sha256").update(OTP).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Replace any previous pending setup for this member/email (covers
    // wrong-email correction: re-submitting with a new email swaps the stage).
    await pool.query(
      `DELETE FROM password_resets WHERE email = $1 OR member_id = $2`,
      [submittedEmail, member_id]
    );
    await pool.query(
      `INSERT INTO password_resets (member_id, email, otp, otp_expires, temp_password)
       VALUES ($1, $2, $3, $4, $5)`,
      [member_id, submittedEmail, hashedOtp, expiresAt, hashed]
    );

    try {
      await sendMail(
        "Your verification code — CSA Kirinyaga",
        `Hi ${member_id},\n\nUse the code below to verify your email and activate your account:\n\n${OTP}\n\nThis code expires in 10 minutes.\n\n— CSA Kirinyaga Chapter`,
        submittedEmail
      );
    } catch (mailErr) {
      // If the mail never went out, drop the staged record so nothing lingers.
      await pool.query(`DELETE FROM password_resets WHERE email = $1`, [submittedEmail]);
      logger.error(`Failed to send first-login OTP: ${mailErr.message}`);
      return res.status(500).json({ status: false, message: `Could not send the verification code. (${mailErr.message})` });
    }

    return res.json({
      status: "otp_required",
      message: "A verification code has been sent to your email. Enter it to finish setting up your account.",
      email: submittedEmail,
    });
  } catch (error) {
    logger.error("firstLoginSetup error:", error.message);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token, reg } = req.body;

    if (!token || !reg) {
      return res.status(400).json({ status: false, message: "Token and registration number are required" });
    }

    const result = await pool.query(
      `SELECT member_id, email_verification_token, email_verification_expires
       FROM members WHERE member_id = $1 AND email_verification_token = $2`,
      [reg, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ status: false, message: "Invalid verification token" });
    }

    const member = result.rows[0];
    if (new Date() > member.email_verification_expires) {
      return res.status(400).json({ status: false, message: "Verification token has expired" });
    }

    await pool.query(
      `UPDATE members SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL WHERE member_id = $1`,
      [reg]
    );

    res.json({ status: true, message: "Email verified successfully" });
  } catch (error) {
    logger.error("verifyEmail error:", error.message);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

/**
 * Server-side logout: revoke the member's refresh tokens so a leaked token
 * cannot mint new access tokens after the user signs out.
 *
 * The provided refresh token is verified; if it has already expired, we still
 * decode it to clean up the member's stored sessions. Logging out revokes all
 * sessions for that member (this app has no per-device session ids).
 */
export const logout = async (req, res) => {
  const cookieToken = req.cookies?.refreshToken;
  const { refreshToken } = req.body ?? {};
  const token = cookieToken || refreshToken;

  // Always drop the cookie, even if nothing else can be revoked.
  clearRefreshTokenCookie(res, req);

  if (!token) {
    return res.status(200).json({ message: "Logged out" });
  }

  try {
    let memberId = null;
    try {
      memberId = verifyRefreshToken(token).id;
    } catch {
      memberId = decodeRefreshToken(token)?.id ?? null;
    }

    if (!memberId) {
      return res.status(200).json({ message: "Logged out" });
    }

    await pool.query(`DELETE FROM refresh_tokens WHERE member_id = $1`, [memberId]);
    logger.info(`Logout: revoked refresh tokens for ${memberId}`);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
