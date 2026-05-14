const { Router } = require('express');
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'manhole-secret-key-2026';

function safeJson(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

// Login
router.post('/login', (req, res) => {
  const db = getDb();
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  if (user.status !== 'active') {
    return res.status(403).json({ error: '账户已被禁用' });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  const { password: _, ...userInfo } = user;
  res.json({ data: { token, user: userInfo } });
});

// Verify token
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    const { password: _, ...userInfo } = user;
    res.json({ data: userInfo });
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
});

// List all users
router.get('/', (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, username, display_name, role, status, email, phone, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ data: users, total: users.length });
});

// Get single user
router.get('/:id', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, display_name, role, status, email, phone, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json({ data: user });
});

// Create user
router.post('/', (req, res) => {
  const db = getDb();
  const id = uuidv4();
  const { username, password, display_name, role, status, email, phone } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: '用户名已存在' });
  }
  db.prepare(
    'INSERT INTO users (id, username, password, display_name, role, status, email, phone) VALUES (?,?,?,?,?,?,?,?)'
  ).run(id, username, password, display_name || '', role || 'operator', status || 'active', email || '', phone || '');
  const created = db.prepare('SELECT id, username, display_name, role, status, email, phone, created_at FROM users WHERE id = ?').get(id);
  res.status(201).json({ data: created });
});

// Update user
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'not found' });
    const fields = ['username', 'password', 'display_name', 'role', 'status', 'email', 'phone'];
    const updates = [];
    const values = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(req.params.id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    const updated = db.prepare('SELECT id, username, display_name, role, status, email, phone, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json({ data: updated });
  } catch (err) {
    console.error('更新用户失败:', err);
    res.status(500).json({ error: '更新用户失败: ' + err.message });
  }
});

// Delete user
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
