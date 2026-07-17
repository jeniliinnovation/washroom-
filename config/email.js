const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'jeniliinnovation812@gmail.com',
    pass: process.env.SMTP_PASS || 'wjow aggr nfvt ykmj'
  }
});

async function sendOtpEmail(toEmail, otpCode, userName = 'Citizen') {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #3b82f6;">
        <h1 style="color: #1e3a8a; margin: 0;">Clean Toilet Portal</h1>
        <p style="color: #64748b; margin: 5px 0 0;">Smart Public Washroom Complaint System</p>
      </div>
      <div style="padding: 30px 0; text-align: center;">
        <h2 style="color: #334155; margin-bottom: 10px;">Hello, ${userName}!</h2>
        <p style="color: #475569; font-size: 16px;">Your One-Time Password (OTP) for secure login is:</p>
        <div style="margin: 25px auto; display: inline-block; padding: 15px 35px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 6px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
          ${otpCode}
        </div>
        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
      </div>
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #cbd5e1; color: #94a3b8; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Swatch Washroom Portal - Smart City Civic Initiative</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Clean Toilet Portal" <${process.env.SMTP_USER || 'jeniliinnovation812@gmail.com'}>`,
      to: toEmail,
      subject: `[OTP: ${otpCode}] Your Clean Toilet Portal Login Code`,
      html: htmlContent
    });
    console.log(`📧 OTP email sent to ${toEmail} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Failed to send SMTP email to ${toEmail}:`, err.message);
    console.log(`💡 [CONSOLE FALLBACK] OTP for ${toEmail} is: ${otpCode}`);
    return { success: false, error: err.message, fallbackOtp: otpCode };
  }
}

async function sendNotificationEmail(toEmail, subject, messageHtml) {
  try {
    await transporter.sendMail({
      from: `"Clean Toilet Portal" <${process.env.SMTP_USER || 'jeniliinnovation812@gmail.com'}>`,
      to: toEmail,
      subject,
      html: messageHtml
    });
    console.log(`📧 Notification email sent to ${toEmail}: "${subject}"`);
  } catch (err) {
    console.warn(`⚠️ Could not send notification email to ${toEmail}: ${err.message}`);
  }
}

async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"Clean Toilet Portal" <${process.env.SMTP_USER || 'jeniliinnovation812@gmail.com'}>`,
      to,
      subject,
      html
    });
    console.log(`📧 Email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Failed to send SMTP email to ${to}:`, err.message);
    return { success: false, sent: false, error: err.message };
  }
}

module.exports = { sendOtpEmail, sendNotificationEmail, sendEmail };
