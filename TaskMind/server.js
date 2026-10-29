const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'taskmind-local-dev-secret-change-before-deployment';
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], tasks: [] }, null, 2));
}
function readDb() {
  ensureDb();
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return { users: [], tasks: [] }; }
}
function writeDb(db) { ensureDb(); fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function safeUser(user) { return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }; }
function tokenFor(user) { return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' }); }
function clean(value, max = 180) { return String(value || '').trim().slice(0, max); }
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
  try { req.userId = jwt.verify(token, JWT_SECRET).id; next(); }
  catch { return res.status(401).json({ error: 'Your session expired. Please sign in again.' }); }
}
app.get('/api/health', (req, res) => res.json({ ok: true, app: 'TaskMind API' }));
app.post('/api/auth/register', async (req, res) => {
  const name = clean(req.body.name, 60), email = clean(req.body.email, 120).toLowerCase(), password = String(req.body.password || '');
  if (name.length < 2) return res.status(400).json({ error: 'Name must have at least 2 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  const db = readDb();
  if (db.users.some(u => u.email === email)) return res.status(409).json({ error: 'That email already has an account. Please sign in.' });
  const user = { id: crypto.randomUUID(), name, email, passwordHash: await bcrypt.hash(password, 10), createdAt: new Date().toISOString(), settings: { dailyGoal: 5, theme: 'light' } };
  db.users.push(user); writeDb(db);
  res.status(201).json({ token: tokenFor(user), user: safeUser(user) });
});
app.post('/api/auth/login', async (req, res) => {
  const email = clean(req.body.email, 120).toLowerCase(), password = String(req.body.password || '');
  const user = readDb().users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: tokenFor(user), user: safeUser(user) });
});
app.get('/api/auth/me', auth, (req, res) => {
  const user = readDb().users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  res.json({ user: safeUser(user), settings: user.settings || { dailyGoal: 5, theme: 'light' } });
});
app.get('/api/tasks', auth, (req, res) => {
  const tasks = readDb().tasks.filter(t => t.userId === req.userId).sort((a,b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  res.json({ tasks });
});
app.post('/api/tasks', auth, (req, res) => {
  const title = clean(req.body.title, 120);
  if (title.length < 2) return res.status(400).json({ error: 'Task title must have at least 2 characters.' });
  const task = { id: crypto.randomUUID(), userId: req.userId, title, description: clean(req.body.description, 500), priority: ['low','medium','high'].includes(req.body.priority) ? req.body.priority : 'medium', dueDate: /^\d{4}-\d{2}-\d{2}$/.test(req.body.dueDate || '') ? req.body.dueDate : '', completed: false, createdAt: new Date().toISOString(), completedAt: null };
  const db = readDb(); db.tasks.push(task); writeDb(db); res.status(201).json({ task });
});
app.patch('/api/tasks/:id', auth, (req, res) => {
  const db = readDb(), task = db.tasks.find(t => t.id === req.params.id && t.userId === req.userId);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  if (typeof req.body.title === 'string') { const title = clean(req.body.title, 120); if (title.length < 2) return res.status(400).json({ error: 'Task title must have at least 2 characters.' }); task.title = title; }
  if (typeof req.body.description === 'string') task.description = clean(req.body.description, 500);
  if (['low','medium','high'].includes(req.body.priority)) task.priority = req.body.priority;
  if (typeof req.body.dueDate === 'string') task.dueDate = /^\d{4}-\d{2}-\d{2}$/.test(req.body.dueDate) ? req.body.dueDate : '';
  if (typeof req.body.completed === 'boolean') { task.completed = req.body.completed; task.completedAt = task.completed ? new Date().toISOString() : null; }
  task.updatedAt = new Date().toISOString(); writeDb(db); res.json({ task });
});
app.delete('/api/tasks/:id', auth, (req, res) => {
  const db = readDb(), oldLength = db.tasks.length;
  db.tasks = db.tasks.filter(t => !(t.id === req.params.id && t.userId === req.userId));
  if (db.tasks.length === oldLength) return res.status(404).json({ error: 'Task not found.' });
  writeDb(db); res.json({ ok: true });
});
app.get('/api/stats', auth, (req, res) => {
  const tasks = readDb().tasks.filter(t => t.userId === req.userId), today = new Date().toISOString().slice(0,10);
  const completed = tasks.filter(t => t.completed).length;
  res.json({ total: tasks.length, completed, pending: tasks.length-completed, overdue: tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today).length, completedToday: tasks.filter(t => t.completedAt && t.completedAt.slice(0,10) === today).length, completionRate: tasks.length ? Math.round(completed/tasks.length*100) : 0 });
});
app.patch('/api/settings', auth, (req, res) => {
  const db = readDb(), user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  user.settings = user.settings || { dailyGoal: 5, theme: 'light' };
  const goal = Number(req.body.dailyGoal);
  if (Number.isInteger(goal) && goal >= 1 && goal <= 50) user.settings.dailyGoal = goal;
  if (['light','dark'].includes(req.body.theme)) user.settings.theme = req.body.theme;
  writeDb(db); res.json({ settings: user.settings });
});
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => { ensureDb(); console.log(`TaskMind is running at http://localhost:${PORT}`); });
