import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Clean up any quotes that might be in the .env string
const FROM = (process.env.MAIL_FROM || "TrackyJobby <hello@trackyjobby.com>").replace(/"/g, '');
const APP_URL = process.env.APP_URL || 'https://trackyjobby.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ayo@iloveinbox.com";

console.log(`📡 [DEBUG] Email System Initialized. FROM: ${FROM}, ADMIN: ${ADMIN_EMAIL}`);

export async function sendVerificationEmail(toEmail: string, verificationToken: string, name?: string) {
  const verifyUrl = `${APP_URL}/verify/${verificationToken}`;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: 'Verify your TrackyJobby account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0f1117;color:#e1e4e8;border-radius:12px;">
        <div style="font-size:28px;font-weight:700;margin-bottom:8px;">🎯 TrackyJobby</div>
        <h2 style="font-size:22px;margin-bottom:8px;">Verify your email</h2>
        <p style="color:#8b949e;margin-bottom:24px;">
          Hi ${name || 'there'}, thanks for signing up. Click below to verify your email address.
        </p>
        <a href="${verifyUrl}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px;">
          Verify email address
        </a>
        <p style="color:#8b949e;font-size:13px;">
          Or copy this link into your browser:<br/>
          <span style="color:#10b981;">${verifyUrl}</span>
        </p>
        <p style="color:#484f58;font-size:12px;margin-top:32px;">
          This link expires in 24 hours. If you didn't sign up, ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendFeedbackEmail(category: string, message: string, userEmail: string, userName?: string) {
  console.log(`📧 [DEBUG] Attempting to send feedback email to ${ADMIN_EMAIL}...`);
  console.log(`📧 [DEBUG] Category: ${category}, User: ${userName || userEmail}`);

  try {
    const data = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `[Feedback] ${category} from ${userName || userEmail}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0f1117;color:#e1e4e8;border-radius:12px;">
          <div style="font-size:24px;font-weight:700;margin-bottom:20px;color:#10b981;">New Feedback Submitted</div>
          
          <div style="margin-bottom:24px;padding:20px;background:#161b22;border-radius:8px;border:1px solid #30363d;">
            <div style="color:#8b949e;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Category</div>
            <div style="font-size:16px;font-weight:600;margin-bottom:16px;">${category}</div>
            
            <div style="color:#8b949e;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Message</div>
            <div style="font-size:15px;line-height:1.6;white-space:pre-wrap;">${message}</div>
          </div>

          <div style="border-top:1px solid #30363d;padding-top:20px;">
            <div style="color:#8b949e;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Submitted By</div>
            <div style="font-size:14px;">${userName || 'N/A'} (${userEmail})</div>
          </div>
        </div>
      `,
    });
    console.log('✅ [DEBUG] Feedback email sent successfully:', data);
  } catch (err) {
    console.error('❌ [DEBUG] Failed to send feedback email:', err);
    throw err;
  }
}

export async function sendAdminNotification(subject: string, htmlContent: string) {
  console.log(`📧 [DEBUG] Attempting to send admin notification to ${ADMIN_EMAIL}...`);

  try {
    const data = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `[Admin Alert] ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0f1117;color:#e1e4e8;border-radius:12px;">
          <div style="font-size:24px;font-weight:700;margin-bottom:20px;color:#10b981;">Admin Alert</div>
          ${htmlContent}
        </div>
      `,
    });
    console.log('✅ [DEBUG] Admin notification sent successfully:', data);
  } catch (err) {
    console.error('❌ [DEBUG] Failed to send admin notification:', err);
    throw err;
  }
}
