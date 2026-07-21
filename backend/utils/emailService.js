/**
 * Email Service
 * Handles sending verification emails and password reset emails
 */
const nodemailer = require('nodemailer');

let transporter;

/**
 * Initialize email transporter
 * Supports multiple email providers: Gmail, SendGrid, custom SMTP
 */
function initializeEmailService() {
  const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';

  if (emailProvider === 'gmail') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD, // Use App Password for 2FA-enabled accounts
      },
    });
  } else if (emailProvider === 'sendgrid') {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else {
    // Custom SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  console.log(`✅ Email service initialized with provider: ${emailProvider}`);
}

/**
 * Verify transporter connection
 * @returns {Promise<boolean>} - True if connection is valid
 */
async function verifyConnection() {
  try {
    if (!transporter) {
      initializeEmailService();
    }
    await transporter.verify();
    console.log('✅ Email service is ready to send emails');
    return true;
  } catch (error) {
    console.error('❌ Email service verification failed:', error.message);
    return false;
  }
}

/**
 * Send email verification code
 * @param {string} email - Recipient email
 * @param {string} verificationCode - Code to verify
 * @param {string} verificationLink - Link for email verification
 * @returns {Promise<object>} - Email response
 */
async function sendVerificationEmail(email, verificationCode, verificationLink) {
  try {
    if (!transporter) {
      initializeEmailService();
    }

    const appName = process.env.APP_NAME || 'CloudyInSouth';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .code { background: #667eea; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 5px; }
            .link { text-align: center; margin: 20px 0; }
            .link a { background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 10px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 ${appName}</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for signing up at <strong>${appName}</strong>! To complete your registration and verify your email address, please use the verification code below:</p>
              
              <div class="code">${verificationCode}</div>
              
              <p>Or click the link below:</p>
              <div class="link">
                <a href="${verificationLink}">Verify Email Address</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This code will expire in 24 hours. If you didn't create this account, please ignore this email.
              </div>
              
              <p>If the link above doesn't work, copy and paste this URL into your browser:</p>
              <p><small>${verificationLink}</small></p>
              
              <p>Best regards,<br><strong>${appName} Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@cloudyinsouth.com',
      to: email,
      subject: `Verify Your Email Address - ${appName}`,
      html: htmlContent,
      text: `Verification code: ${verificationCode}\n\nExpires in 24 hours.`,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Token for password reset
 * @param {string} resetLink - Full reset link
 * @returns {Promise<object>} - Email response
 */
async function sendPasswordResetEmail(email, resetToken, resetLink) {
  try {
    if (!transporter) {
      initializeEmailService();
    }

    const appName = process.env.APP_NAME || 'CloudyInSouth';
    const expiryHours = 1; // Password reset link expires in 1 hour

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .warning { background: #ffebee; border: 1px solid #f5576c; color: #c62828; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .link { text-align: center; margin: 20px 0; }
            .link a { background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
            .expiry { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 10px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your ${appName} account. Click the button below to reset your password:</p>
              
              <div class="link">
                <a href="${resetLink}">Reset Your Password</a>
              </div>
              
              <div class="expiry">
                ⏱️ This link will expire in ${expiryHours} hour(s). After that, you'll need to request a new password reset.
              </div>
              
              <p>If you didn't request this password reset, please disregard this email. Your password is safe.</p>
              
              <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
              <p><small>${resetLink}</small></p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> Never share your password reset link with anyone. ${appName} staff will never ask for your password or reset link.
              </div>
              
              <p>If you need further assistance, please contact our support team.</p>
              
              <p>Best regards,<br><strong>${appName} Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@cloudyinsouth.com',
      to: email,
      subject: `Reset Your Password - ${appName}`,
      html: htmlContent,
      text: `Click here to reset your password: ${resetLink}\n\nThis link expires in ${expiryHours} hour(s).`,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

/**
 * Send OTP for phone verification
 * @param {string} email - User email
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 * @returns {Promise<object>} - Email response
 */
async function sendOTPEmail(email, phone, otp) {
  try {
    if (!transporter) {
      initializeEmailService();
    }

    const appName = process.env.APP_NAME || 'CloudyInSouth';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .otp { background: #667eea; color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; font-family: monospace; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📱 OTP Verification</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your One-Time Password (OTP) for verifying your phone number <strong>${phone}</strong> is:</p>
              
              <div class="otp">${otp}</div>
              
              <p>This code will expire in 10 minutes. Do not share this code with anyone.</p>
              
              <p>If you didn't request this code, please ignore this email.</p>
              
              <p>Best regards,<br><strong>${appName} Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@cloudyinsouth.com',
      to: email,
      subject: `Your OTP Code - ${appName}`,
      html: htmlContent,
      text: `Your OTP: ${otp}\n\nThis code expires in 10 minutes.`,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

module.exports = {
  initializeEmailService,
  verifyConnection,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOTPEmail,
};
