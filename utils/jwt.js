const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'teammanagement';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}-refresh`;
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || `${JWT_SECRET}-reset`;

const signAccessToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
const signRefreshToken = (payload) => jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
const signResetToken = (payload) => jwt.sign(payload, JWT_RESET_SECRET, { expiresIn: '10m' });

const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, JWT_REFRESH_SECRET);
const verifyResetToken = (token) => jwt.verify(token, JWT_RESET_SECRET);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = {
  signAccessToken,
  signRefreshToken,
  signResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyResetToken,
  hashToken,
};
