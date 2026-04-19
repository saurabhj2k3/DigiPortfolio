const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;
const secret = 'supersecretkey'; // Use an environment variable in production

app.use(cors());
app.use(express.json());

const db = new Database('database.db');

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT
  );

  CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    portfolio_name TEXT DEFAULT 'My Portfolio',
    name TEXT,
    title TEXT,
    bio TEXT,
    contact_email TEXT,
    phone TEXT,
    location TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    skills TEXT,
    template_id INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 0,
    is_draft INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id INTEGER,
    title TEXT,
    description TEXT,
    tech_stack TEXT,
    url TEXT,
    FOREIGN KEY(portfolio_id) REFERENCES portfolios(id)
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    thumbnail_url TEXT,
    description TEXT,
    primary_color TEXT,
    bg_style TEXT
  );
`);

// Run migrations to add new columns if they don't exist
function migrateTable(tableName, requiredColumns) {
  const currentColumns = db.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);
  for (const col of requiredColumns) {
    if (!currentColumns.includes(col.name)) {
      console.log(`Migrating: Adding missing column ${col.name} to ${tableName}`);
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type}`);
    }
  }
}

migrateTable('portfolios', [
  { name: 'portfolio_name', type: "TEXT DEFAULT 'My Portfolio'" },
  { name: 'title', type: 'TEXT' },
  { name: 'phone', type: 'TEXT' },
  { name: 'location', type: 'TEXT' },
  { name: 'github_url', type: 'TEXT' },
  { name: 'linkedin_url', type: 'TEXT' },
  { name: 'skills', type: 'TEXT' },
  { name: 'is_active', type: 'INTEGER DEFAULT 0' },
  { name: 'is_draft', type: 'INTEGER DEFAULT 1' },
  { name: 'created_at', type: 'TEXT' },
]);

migrateTable('projects', [
  { name: 'tech_stack', type: 'TEXT' },
  { name: 'url', type: 'TEXT' },
]);

migrateTable('templates', [
  { name: 'description', type: 'TEXT' },
  { name: 'primary_color', type: 'TEXT' },
  { name: 'bg_style', type: 'TEXT' },
]);

// Upsert templates — always ensure all 5 exist with correct metadata
const upsertTpl = db.prepare(`
  INSERT INTO templates (id, name, thumbnail_url, description, primary_color, bg_style)
  VALUES (?, ?, '', ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name, description=excluded.description,
    primary_color=excluded.primary_color, bg_style=excluded.bg_style
`);
upsertTpl.run(1, 'Modern Clean',     'Minimal white layout with bold typography',        '#6366f1', 'light');
upsertTpl.run(2, 'Dark Elegance',    'Sophisticated dark theme with glass effects',       '#8b5cf6', 'dark');
upsertTpl.run(3, 'Creative Portfolio','Vibrant gradient design for creatives',            '#ec4899', 'gradient');
upsertTpl.run(4, 'Corporate Pro',    'Professional blue tones for business',              '#0ea5e9', 'corporate');
upsertTpl.run(5, 'Terminal Dev',     'Matrix-style hacker aesthetic for developers',      '#10b981', 'terminal');

// Routes
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email and password (min 6 chars) are required.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    const insert = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    const result = insert.run(email, hash);
    res.status(201).json({ id: result.lastInsertRowid, email });
  } catch (err) {
    res.status(400).json({ error: 'User already exists.' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (user && bcrypt.compareSync(password, user.password_hash)) {
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Middleware for JWT Verification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- MULTI-PORTFOLIO API ---

// Get all portfolios for user
app.get('/api/portfolios', authenticateToken, (req, res) => {
  const portfolios = db.prepare('SELECT * FROM portfolios WHERE user_id = ? ORDER BY id DESC').all(req.user.userId);
  res.json(portfolios);
});

// Create a new portfolio
app.post('/api/portfolios', authenticateToken, (req, res) => {
  const { portfolio_name, name, title, bio, contact_email, phone, location, github_url, linkedin_url, skills, template_id, is_draft } = req.body;
  const insert = db.prepare(`
    INSERT INTO portfolios (user_id, portfolio_name, name, title, bio, contact_email, phone, location, github_url, linkedin_url, skills, template_id, is_draft)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = insert.run(
    req.user.userId, portfolio_name || 'New Portfolio', name || '', title || '', bio || '',
    contact_email || '', phone || '', location || '', github_url || '', linkedin_url || '',
    skills || '', template_id || 1, is_draft !== undefined ? is_draft : 1
  );
  res.status(201).json({ id: result.lastInsertRowid, message: 'Portfolio created.' });
});

// Update a specific portfolio
app.put('/api/portfolios/:id', authenticateToken, (req, res) => {
  const { portfolio_name, name, title, bio, contact_email, phone, location, github_url, linkedin_url, skills, template_id, is_draft } = req.body;
  const portfolioId = req.params.id;
  const portfolio = db.prepare('SELECT id FROM portfolios WHERE id = ? AND user_id = ?').get(portfolioId, req.user.userId);
  if (!portfolio) return res.status(404).json({ error: 'Portfolio not found.' });

  const update = db.prepare(`
    UPDATE portfolios 
    SET portfolio_name = ?, name = ?, title = ?, bio = ?, contact_email = ?, phone = ?, location = ?, 
        github_url = ?, linkedin_url = ?, skills = ?, template_id = ?, is_draft = ?
    WHERE id = ? AND user_id = ?
  `);
  update.run(portfolio_name, name, title, bio, contact_email, phone, location, github_url, linkedin_url, skills, template_id, is_draft || 1, portfolioId, req.user.userId);
  res.json({ id: portfolioId, message: 'Portfolio updated.' });
});

// Delete a portfolio
app.delete('/api/portfolios/:id', authenticateToken, (req, res) => {
  const portfolioId = req.params.id;
  db.prepare('DELETE FROM projects WHERE portfolio_id = ?').run(portfolioId);
  db.prepare('DELETE FROM portfolios WHERE id = ? AND user_id = ?').run(portfolioId, req.user.userId);
  res.json({ message: 'Portfolio deleted.' });
});

// Legacy single portfolio API (kept for backward compatibility)
app.get('/api/portfolio', authenticateToken, (req, res) => {
  const portfolio = db.prepare('SELECT * FROM portfolios WHERE user_id = ? ORDER BY id ASC LIMIT 1').get(req.user.userId);
  res.json(portfolio || null);
});

app.post('/api/portfolio', authenticateToken, (req, res) => {
  const { name, title, bio, contact_email, phone, location, github_url, linkedin_url, skills, template_id } = req.body;
  const existing = db.prepare('SELECT id FROM portfolios WHERE user_id = ? ORDER BY id ASC LIMIT 1').get(req.user.userId);

  if (existing) {
    const update = db.prepare(`
      UPDATE portfolios 
      SET name = ?, title = ?, bio = ?, contact_email = ?, phone = ?, location = ?, 
          github_url = ?, linkedin_url = ?, skills = ?, template_id = ? 
      WHERE id = ?
    `);
    update.run(name, title, bio, contact_email, phone, location, github_url, linkedin_url, skills, template_id, existing.id);
    res.json({ id: existing.id, message: 'Portfolio updated.' });
  } else {
    const insert = db.prepare(`
      INSERT INTO portfolios (user_id, portfolio_name, name, title, bio, contact_email, phone, location, github_url, linkedin_url, skills, template_id, is_draft) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insert.run(req.user.userId, 'My Portfolio', name, title, bio, contact_email, phone, location, github_url, linkedin_url, skills, template_id || 1, 1);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Portfolio created.' });
  }
});

// Projects CRUD
app.get('/api/projects', authenticateToken, (req, res) => {
  const portfolio = db.prepare('SELECT id FROM portfolios WHERE user_id = ? ORDER BY id ASC LIMIT 1').get(req.user.userId);
  if (!portfolio) return res.json([]);
  const projects = db.prepare('SELECT * FROM projects WHERE portfolio_id = ?').all(portfolio.id);
  res.json(projects);
});

// Get projects for a specific portfolio
app.get('/api/portfolios/:id/projects', authenticateToken, (req, res) => {
  const portfolio = db.prepare('SELECT id FROM portfolios WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
  if (!portfolio) return res.status(404).json({ error: 'Portfolio not found.' });
  const projects = db.prepare('SELECT * FROM projects WHERE portfolio_id = ?').all(portfolio.id);
  res.json(projects);
});

app.post('/api/projects', authenticateToken, (req, res) => {
  const { title, description, tech_stack, url } = req.body;
  let portfolio = db.prepare('SELECT id FROM portfolios WHERE user_id = ? ORDER BY id ASC LIMIT 1').get(req.user.userId);

  // Auto-create a default portfolio so users can add projects immediately after registering
  if (!portfolio) {
    const insert = db.prepare(`
      INSERT INTO portfolios (user_id, portfolio_name, name, title, bio, contact_email, template_id, is_draft)
      VALUES (?, 'My Portfolio', '', '', '', '', 1, 1)
    `);
    const result = insert.run(req.user.userId);
    portfolio = { id: result.lastInsertRowid };
  }

  const insertProject = db.prepare('INSERT INTO projects (portfolio_id, title, description, tech_stack, url) VALUES (?, ?, ?, ?, ?)');
  const result = insertProject.run(portfolio.id, title, description, tech_stack, url);
  res.status(201).json({ id: result.lastInsertRowid, title });
});

app.put('/api/projects/:id', authenticateToken, (req, res) => {
  const { title, description, tech_stack, url } = req.body;
  const projectId = req.params.id;
  const portfolio = db.prepare('SELECT id FROM portfolios WHERE user_id = ? ORDER BY id ASC LIMIT 1').get(req.user.userId);

  if (!portfolio) return res.status(400).json({ error: 'Not authorized.' });
  const update = db.prepare('UPDATE projects SET title = ?, description = ?, tech_stack = ?, url = ? WHERE id = ? AND portfolio_id = ?');
  update.run(title, description, tech_stack, url, projectId, portfolio.id);
  res.json({ message: 'Project updated.' });
});

app.delete('/api/projects/:id', authenticateToken, (req, res) => {
  const projectId = req.params.id;
  const portfolio = db.prepare('SELECT id FROM portfolios WHERE user_id = ? ORDER BY id ASC LIMIT 1').get(req.user.userId);

  if (!portfolio) return res.status(400).json({ error: 'Not authorized.' });
  const del = db.prepare('DELETE FROM projects WHERE id = ? AND portfolio_id = ?');
  del.run(projectId, portfolio.id);
  res.json({ message: 'Project deleted.' });
});

// Templates Gallery
app.get('/api/templates', (req, res) => {
  const templates = db.prepare('SELECT * FROM templates').all();
  res.json(templates);
});

// Public Portfolio View
app.get('/api/p/:id', (req, res) => {
  const portfolio = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(req.params.id);
  if (!portfolio) return res.status(404).json({ error: 'Portfolio not found' });
  
  const projects = db.prepare('SELECT * FROM projects WHERE portfolio_id = ?').all(portfolio.id);
  res.json({ portfolio, projects });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
