const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let db;

async function initDb() {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      roomId TEXT,
      reporterId TEXT,
      reportedId TEXT,
      messages TEXT -- JSON string
    );

    CREATE TABLE IF NOT EXISTS bans (
      ip TEXT PRIMARY KEY,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stats (
      key TEXT PRIMARY KEY,
      value INTEGER DEFAULT 0
    );

    -- Initialize stats if they don't exist
    INSERT OR IGNORE INTO stats (key, value) VALUES ('total_matches', 0);
    INSERT OR IGNORE INTO stats (key, value) VALUES ('total_messages', 0);
    INSERT OR IGNORE INTO stats (key, value) VALUES ('total_reports', 0);
  `);

  console.log('SQLite Database initialized.');
  return db;
}

const dbHelper = {
  // Reports
  async saveReport(report) {
    return db.run(
      'INSERT INTO reports (id, roomId, reporterId, reportedId, messages) VALUES (?, ?, ?, ?, ?)',
      [report.id, report.roomId, report.reporterId, report.reportedId, JSON.stringify(report.messages)]
    );
  },
  async getReports(limit = 50) {
    const rows = await db.all('SELECT * FROM reports ORDER BY timestamp DESC LIMIT ?', [limit]);
    return rows.map(r => ({
      ...r,
      messages: JSON.parse(r.messages)
    }));
  },

  // Bans
  async banIp(ip, reason) {
    return db.run('INSERT OR REPLACE INTO bans (ip, reason) VALUES (?, ?)', [ip, reason]);
  },
  async isBanned(ip) {
    const row = await db.get('SELECT 1 FROM bans WHERE ip = ?', [ip]);
    return !!row;
  },
  async getBans() {
    return db.all('SELECT * FROM bans ORDER BY timestamp DESC');
  },

  // Stats
  async incrementStat(key) {
    return db.run('UPDATE stats SET value = value + 1 WHERE key = ?', [key]);
  },
  async getStats() {
    const rows = await db.all('SELECT * FROM stats');
    const stats = {};
    rows.forEach(r => {
      stats[r.key] = r.value;
    });
    return stats;
  }
};

module.exports = { initDb, dbHelper };
