const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendEmail } = require('../config/email');
const { uploadImage } = require('../config/cloudinary');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refreshsecret123';

// In-memory OTP store for fast verification
const otpStore = new Map();

function generateTokens(user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, ward: user.ward_name, area: user.assigned_area },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    REFRESH_SECRET,
    { expiresIn: '30d' }
  );
  return { token, refreshToken };
}

// 1. Register User
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role = 'CITIZEN', ward_name = null, assigned_area = null } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      `INSERT INTO users (name, email, phone, password_hash, role, ward_name, assigned_area, civic_points, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 50, 'Active')`,
      [name, email, phone || null, hashedPassword, role, ward_name, assigned_area]
    );

    const newUser = { id: result.lastInsertRowid, name, email, role, ward_name, assigned_area };
    const { token, refreshToken } = generateTokens(newUser);

    await db.run('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, newUser.id]);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      refreshToken,
      user: newUser
    });
  } catch (err) {
    next(err);
  }
};

// 2. Login User
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: `Account is ${user.status}. Contact administrator.` });
    }

    const { token, refreshToken } = generateTokens(user);
    await db.run('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

    await db.run(
      `INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address) 
       VALUES (?, 'USER_LOGIN', 'USER', ?, 'Successful login with email & password', ?)`,
      [user.id, user.id, req.ip || '127.0.0.1']
    );

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward_name: user.ward_name,
        civic_points: user.civic_points,
        profile_image_url: user.profile_image_url
      }
    });
  } catch (err) {
    next(err);
  }
};

// 3. Logout User
exports.logout = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : req.body.user_id;
    if (userId) {
      await db.run('UPDATE users SET refresh_token = NULL WHERE id = ?', [userId]);
      await db.run(`INSERT INTO audit_logs (user_id, action, target_type, target_id, details) VALUES (?, 'USER_LOGOUT', 'USER', ?, 'User logged out')`, [userId, userId]);
    }
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// 4. Refresh Token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await db.get('SELECT * FROM users WHERE id = ? AND refresh_token = ?', [decoded.id, refreshToken]);
    if (!user) {
      return res.status(403).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const tokens = generateTokens(user);
    await db.run('UPDATE users SET refresh_token = ? WHERE id = ?', [tokens.refreshToken, user.id]);

    res.status(200).json({
      success: true,
      token: tokens.token,
      refreshToken: tokens.refreshToken
    });
  } catch (err) {
    res.status(403).json({ success: false, message: 'Refresh token verification failed.' });
  }
};

// 5. Send OTP / Resend OTP
exports.sendOtp = async (req, res, next) => {
  try {
    const email = req.body.email || req.body.email_or_phone || req.body.phone;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address or phone is required.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    const emailResult = await sendEmail({
      to: email,
      subject: 'Your Verification Code - Clean Toilet Portal',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
          <h2 style="color: #0f172a;">Verify Your Account</h2>
          <p>Your one-time verification code is:</p>
          <div style="font-size: 28px; font-weight: bold; color: #3b82f6; padding: 10px; background: #eff6ff; border-radius: 6px; width: fit-content;">${otp}</div>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: emailResult.sent ? 'OTP sent successfully to your email via Nodemailer SMTP!' : 'OTP generated (SMTP unconfigured, logged to console).',
      debug_otp: process.env.NODE_ENV === 'development' || !emailResult.sent ? otp : undefined
    });
  } catch (err) {
    next(err);
  }
};

// 6. Verify OTP
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP required.' });
    }

    const stored = otpStore.get(email);
    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    otpStore.delete(email);
    res.status(200).json({ success: true, message: 'OTP verified successfully!' });
  } catch (err) {
    next(err);
  }
};

// 7. OTP Login
exports.otpLogin = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const stored = otpStore.get(email);
    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
    }
    otpStore.delete(email);

    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      const dummyHash = await bcrypt.hash('otp_login_' + Date.now(), 10);
      const result = await db.run(
        `INSERT INTO users (name, email, password_hash, role, civic_points, status) VALUES (?, ?, ?, 'CITIZEN', 50, 'Active')`,
        [email.split('@')[0], email, dummyHash]
      );
      user = { id: result.lastInsertRowid, name: email.split('@')[0], email, role: 'CITIZEN', ward_name: null };
    }

    const tokens = generateTokens(user);
    await db.run('UPDATE users SET refresh_token = ? WHERE id = ?', [tokens.refreshToken, user.id]);

    res.status(200).json({
      success: true,
      message: 'OTP login successful!',
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user
    });
  } catch (err) {
    next(err);
  }
};

// 8. Forgot & Reset Password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    await exports.sendOtp(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const stored = otpStore.get(email);
    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }
    otpStore.delete(email);

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?', [hashed, email]);
    res.status(200).json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    next(err);
  }
};

// 9. Change Password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashed, req.user.id]);
    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

// 10. Get Me / Profile
exports.getMe = async (req, res, next) => {
  try {
    const user = await db.get('SELECT id, name, email, phone, role, ward_name, assigned_area, civic_points, status, profile_image_url, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = exports.getMe;

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, ward_name, assigned_area } = req.body;
    await db.run(
      `UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), ward_name = COALESCE(?, ward_name), assigned_area = COALESCE(?, assigned_area), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name || null, phone || null, ward_name || null, assigned_area || null, req.user.id]
    );
    res.status(200).json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.updateProfileImage = async (req, res, next) => {
  try {
    let url = req.body.image_url;
    if (req.file) {
      url = await uploadImage(req.file.path || req.file.buffer, req.file.originalname);
    }
    if (!url) {
      return res.status(400).json({ success: false, message: 'No image uploaded.' });
    }
    await db.run('UPDATE users SET profile_image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [url, req.user.id]);
    res.status(200).json({ success: true, message: 'Profile photo updated.', profile_image_url: url });
  } catch (err) {
    next(err);
  }
};

// 11. Delete / Deactivate Account
exports.deleteAccount = async (req, res, next) => {
  try {
    await db.run(`UPDATE users SET status = 'Deactivated', refresh_token = NULL WHERE id = ?`, [req.user.id]);
    res.status(200).json({ success: true, message: 'Account deactivated.' });
  } catch (err) {
    next(err);
  }
};

// 12. Google Login
exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'Google ID token required.' });
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      const dummyHash = await bcrypt.hash('google_' + Date.now(), 10);
      const resIns = await db.run(
        `INSERT INTO users (name, email, password_hash, role, profile_image_url, civic_points) VALUES (?, ?, ?, 'CITIZEN', ?, 50)`,
        [name, email, dummyHash, picture]
      );
      user = { id: resIns.lastInsertRowid, name, email, role: 'CITIZEN', profile_image_url: picture };
    }
    const tokens = generateTokens(user);
    await db.run('UPDATE users SET refresh_token = ? WHERE id = ?', [tokens.refreshToken, user.id]);
    res.status(200).json({ success: true, token: tokens.token, refreshToken: tokens.refreshToken, user });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Google authentication failed.' });
  }
};
