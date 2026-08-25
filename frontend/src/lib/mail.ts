import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || '"Project Access" <no-reply@projectaccess.com>';

export async function sendOtpEmail(email: string, otp: string) {
  console.log('=====================================================');
  console.log(`[MAIL SYSTEM] OTP verification code generated for ${email}:`);
  console.log(`CODE: ${otp}`);
  console.log('=====================================================');

  // If credentials are not set, we skip SMTP and rely on the console output
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.log('[MAIL SYSTEM] SMTP not configured. Logged OTP to console for testing.');
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

    const mailOptions = {
      from: SMTP_FROM,
      to: email,
      subject: 'Verify your Project Access Account — Verification Code',
      text: `Welcome to Project Access. Your verification code is: ${otp}. This code is valid for 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
          <h2 style="color: #09090b; margin-bottom: 16px;">Welcome to Project Access</h2>
          <p style="color: #3f3f46; font-size: 14px; line-height: 20px;">
            Thank you for registering. Please enter the following 6-digit verification code on the website to activate your account.
          </p>
          <div style="margin: 24px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; border: 1px dashed #d4d4d8; border-radius: 8px; background-color: #fafafa; display: inline-block; color: #09090b; font-family: monospace;">
              ${otp}
            </span>
          </div>
          <p style="color: #71717a; font-size: 12px; margin-top: 24px;">
            This verification code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.
          </p>
          <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 11px; text-align: center;">
            Project Access Legal Intelligence AI. All rights reserved.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL SYSTEM] Verification OTP email sent to ${email}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[MAIL SYSTEM] Failed to send verification OTP email through SMTP:', error);
    return { success: false, error };
  }
}
