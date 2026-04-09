import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import logger from "../logger/winston.js";
// import redisClient from "../Configs/redisConfig.js";

/**
 * Logout controller
 * - Stores JWT in Redis blacklist
 * - Sets expiration to match JWT's exp claim
 */
export const logOut = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ status: "error", message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.decode(token);
  const expiresIn = decoded?.exp
    ? decoded.exp - Math.floor(Date.now() / 1000)
    : 3600; // fallback 1 hour
  //  Store token in Redis as key, value "blacklisted", with expiration
  // await redisClient.set(token, "blacklisted", {
  //   EX: expiresIn,
  // });
  //  Update refresh token in database
  await db.query("UPDATE refresh_tokens SET revoked = true WHERE token = $1", [
    token,
  ]);
  res.json({ status: "success", message: "Logged out successfully" });
};

const verifyToken = async (req, res, next) => {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Unauthorized access attempt without token");
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
    const token = authHeader.split(" ")[1];

    if (!token) {
      logger.warn("Malformed token");
      return res.status(401).json({ error: "Token required" });
    }

    // const isBlacklisted = await redisClient.get(token);

    // if (isBlacklisted) {
    //   return res.status(401).json({ message: "Token blacklisted" });
    // }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: decoded.id, role: decoded.role };

    next();
  } catch (err) {
    logger.warn("Invalid token");
    return res.status(401).json({ message: err.message });
  }
};

export default verifyToken;
