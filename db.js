const fs = require('fs');
const path = require('path');

const DATA_DIR = '/tmp/mythworld-data';
const DB_PATH = path.join(DATA_DIR, 'db.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load() {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) {
    const seeded = require('./seed-data');
    save(seeded);
    return JSON.parse(JSON.stringify(seeded));
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('db.json corrupted, reinitializing:', e.message);
    const seeded = require('./seed-data');
    save(seeded);
    return JSON.parse(JSON.stringify(seeded));
  }
}

function save(data) {
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

let data = load();

module.exports = {
  get: () => data,
  persist: () => save(data),
};