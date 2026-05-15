const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'manhole-secret-key-2026';
if (!process.env.JWT_SECRET) {
  console.warn('[auth] WARNING: JWT_SECRET not set, using default (do not use in production)');
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: '权限不足' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly, JWT_SECRET };
