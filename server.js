const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: change this in production, and set it via environment variable.
const JWT_SECRET = process.env.JWT_SECRET || 'mythworld-dev-secret-change-me';

const UPLOAD_DIR = process.env.RENDER
  ? '/tmp/uploads'
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const CATEGORIES = ['divine', 'supernatural', 'cryptid', 'myth', 'dream', 'unexplained'];

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Image field must be an image file.'));
    }
    if (file.fieldname === 'video' && !file.mimetype.startsWith('video/')) {
      return cb(new Error('Video field must be a video file.'));
    }
    cb(null, true);
  }
});

/* =========================================================
   AUTH HELPERS
   ========================================================= */
function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
}

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) { req.user = null; return next(); }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    req.user = null;
  }
  next();
}
app.use(authMiddleware);

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'You must be logged in.' });
  next();
}

/* =========================================================
   AUTH ROUTES
   ========================================================= */
app.post('/api/auth/signup', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const data = db.get();
  const existing = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const user = {
    id: data.nextUserId++,
    email,
    passwordHash,
    subscribed: false,
    createdAt: new Date().toISOString()
  };
  data.users.push(user);
  db.persist();

  const token = makeToken(user);
  res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.json({ email: user.email, subscribed: user.subscribed });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const data = db.get();
  const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = makeToken(user);
  res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  res.json({ email: user.email, subscribed: !!user.subscribed });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.json({ user: null });
  const data = db.get();
  const user = data.users.find(u => u.id === req.user.id);
  if (!user) return res.json({ user: null });
  res.json({ user: { email: user.email, subscribed: !!user.subscribed } });
});

/* =========================================================
   LIBRARY SUBSCRIPTION
   ========================================================= */
app.post('/api/library/subscribe', requireAuth, (req, res) => {
  const data = db.get();
  const user = data.users.find(u => u.id === req.user.id);
  user.subscribed = true;
  db.persist();
  res.json({ subscribed: true });
});

app.post('/api/library/unsubscribe', requireAuth, (req, res) => {
  const data = db.get();
  const user = data.users.find(u => u.id === req.user.id);
  user.subscribed = false;
  db.persist();
  res.json({ subscribed: false });
});

/* =========================================================
   POSTS / CASE FILES
   ========================================================= */
app.get('/api/posts', (req, res) => {
  const data = db.get();
  res.json(data.posts);
});

app.get('/api/posts/:id', (req, res) => {
  const data = db.get();
  const post = data.posts.find(p => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  res.json(post);
});

app.post('/api/posts', requireAuth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), (req, res) => {
  const { category, title, name, place, description } = req.body || {};

  if (!category || !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Please select a valid category.' });
  }
  if (!title || !name || !place || !description) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  const data = db.get();

  let image = `https://picsum.photos/seed/myth${data.nextPostId}/600/400`;
  let video = null;

  if (req.files && req.files.image && req.files.image[0]) {
    image = '/uploads/' + req.files.image[0].filename;
  }
  if (req.files && req.files.video && req.files.video[0]) {
    video = '/uploads/' + req.files.video[0].filename;
  }

  const post = {
    id: data.nextPostId++,
    category,
    title: String(title).slice(0, 200),
    name: String(name).slice(0, 100),
    place: String(place).slice(0, 100),
    description: String(description).slice(0, 5000),
    image,
    video,
    comments: [],
    userId: req.user.id,
    createdAt: new Date().toISOString()
  };

  data.posts.push(post);
  db.persist();
  res.status(201).json(post);
});

/* =========================================================
   COMMENTS
   ========================================================= */
app.post('/api/posts/:id/comments', requireAuth, (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'Comment cannot be empty.' });

  const data = db.get();
  const post = data.posts.find(p => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const comment = {
    who: req.user.email.split('@')[0],
    text: String(text).slice(0, 1000),
    createdAt: new Date().toISOString()
  };
  post.comments.push(comment);
  db.persist();
  res.status(201).json(comment);
});

/* =========================================================
   ERROR HANDLING
   ========================================================= */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 25MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Something went wrong.' });
  }
  next();
});

// Fallback to index.html for any non-API route (simple SPA support)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MythWorld running at http://localhost:${PORT}`);
});
