const Database = require('better-sqlite3');
const db = new Database('database.db');

try {
  console.log('Inspecting portfolios table...');
  const info = db.prepare('PRAGMA table_info(portfolios)').all();
  console.log('Columns:', info.map(c => c.name).join(', '));
  
  if (!info.find(c => c.name === 'title')) {
    console.log('Missing title column. Attempting migration...');
    db.exec('ALTER TABLE portfolios ADD COLUMN title TEXT');
    console.log('Migration successful.');
  } else {
    console.log('Title column already exists.');
  }
} catch (err) {
  console.error('Migration script failed:', err.message);
} finally {
  db.close();
}
