import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const getFormattedFrom = () => {
  if (process.env.SMTP_FROM) {
    // Remove surrounding quotes if present in .env
    const cleaned = process.env.SMTP_FROM.replace(/^["']|["']$/g, "").trim();
    if (cleaned) return cleaned;
  }
  if (SMTP_USER) {
    return `"Project Access" <${SMTP_USER}>`;
  }
  return '"Project Access" <no-reply@projectaccess.com>';
};

export async function sendOtpEmail(email: string, otp: string) {
  console.log("=====================================================");
  console.log(`[MAIL SYSTEM] OTP verification code generated for ${email}:`);
  console.log(`CODE: ${otp}`);
  console.log("=====================================================");

  // If credentials are not set, we skip SMTP and rely on the console output
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.log(
      "[MAIL SYSTEM] SMTP not configured. Logged OTP to console for testing.",
    );
    return { success: true, loggedToConsole: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });

    const fromAddress = getFormattedFrom();

    const mailOptions = {
      from: fromAddress,
      to: email,
      replyTo: SMTP_USER || fromAddress,
      subject: `${otp} is your Project Access security code`,
      text: `Your Project Access security code is: ${otp}\n\nPlease enter this 6-digit code to verify your login or account registration.\nThis code will expire in 10 minutes.\n\nThank you,\nProject Access Team`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Code</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5; padding: 40px 10px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e4e4e7; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden;">
                  <tr>
                    <td style="padding: 28px 32px; background-color: #0f172a; text-align: left;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: -0.5px;">Project Access</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 32px; text-align: left;">
                      <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Your Security Code</h2>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                        Please enter the 6-digit verification code below to complete your login or registration.
                      </p>
                      <div style="margin: 28px 0; text-align: center;">
                        <div style="display: inline-block; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 28px;">
                          <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a; display: block;">
                            ${otp}
                          </span>
                        </div>
                      </div>
                      <p style="margin: 24px 0 0 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                        This code expires in 10 minutes. If you did not request this, please secure your account.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                        © Project Access. Automated authentication service.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      headers: {
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        "Importance": "Normal",
        "X-Auto-Response-Suppress": "OOF, AutoReply",
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[MAIL SYSTEM] Verification OTP email sent to ${email}. Message ID: ${info.messageId}`,
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      "[MAIL SYSTEM] Failed to send verification OTP email through SMTP:",
      error,
    );
    return { success: false, error };
  }
}
