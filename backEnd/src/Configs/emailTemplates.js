export const verificationEmailHTML = ({ name, verifyUrl }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <tr>
            <td style="text-align:center;padding-bottom:24px;">
              <img src="https://cdn-icons-png.flaticon.com/512/3176/3176366.png" alt="CSA" width="56" height="56" style="display:inline-block;border-radius:50%;">
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;text-align:center;">Verify your email</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#64748b;text-align:center;line-height:1.6;">
                Hi <strong style="color:#334155;">${name}</strong>,<br>
                Please verify your email address to activate your account. This link expires in <strong>24 hours</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 32px;">
                    <a href="${verifyUrl}" style="display:inline-block;background-color:#16a34a;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:10px;box-shadow:0 4px 6px rgba(22,163,74,0.2);">✓ Verify Email</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.5;">
                If you didn't request this, you can safely ignore this email.<br>
                &mdash; CSA Kirinyaga Chapter
              </p>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;padding-top:20px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">CSA Kirinyaga Chapter &bull; Catholic University of Eastern Africa</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const verificationEmailText = ({ name, verifyUrl }) =>
  `Hi ${name},\n\nPlease verify your email by clicking the link below:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\n— CSA Kirinyaga Chapter`;
