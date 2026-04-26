const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.json');

// Initial schema
const defaultData = {
  reports: [],
  bans: [],
  stats: {
    total_matches: 0,
    total_messages: 0,
    total_reports: 0
  }
};

// Helper to read DB
const readDb = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("DB Read Error:", err);
    return defaultData;
  }
};

// Helper to write DB
const writeDb = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("DB Write Error:", err);
  }
};

async function initDb() {
  readDb(); // Ensure file exists
  console.log('JSON Database initialized.');
  return true;
}

const dbHelper = {
  // Reports
  async saveReport(report) {
    const db = readDb();
    db.reports.push({
      ...report,
      timestamp: new Date().toISOString(),
      messages: JSON.stringify(report.messages)
    });
    writeDb(db);
  },
  async getReports(limit = 50) {
    const db = readDb();
    const sorted = db.reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
    return sorted.map(r => ({
      ...r,
      messages: JSON.parse(r.messages)
    }));
  },

  // Bans
  async banIp(ip, reason) {
    const db = readDb();
    const existing = db.bans.findIndex(b => b.ip === ip);
    const banData = { ip, reason, timestamp: new Date().toISOString() };
    if (existing > -1) {
      db.bans[existing] = banData;
    } else {
      db.bans.push(banData);
    }
    writeDb(db);
  },
  async isBanned(ip) {
    const db = readDb();
    return db.bans.some(b => b.ip === ip);
  },
  async getBans() {
    const db = readDb();
    return db.bans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // Stats
  async incrementStat(key) {
    const db = readDb();
    if (db.stats[key] !== undefined) {
      db.stats[key] += 1;
      writeDb(db);
    }
  },
  async getStats() {
    const db = readDb();
    return db.stats;
  }
};

module.exports = { initDb, dbHelper };
