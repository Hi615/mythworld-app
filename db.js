// Simple file-based JSON database. Good for small/medium sites without
// needing a separate database server. Data is stored in /data/db.json
// and written to disk on every change (atomic write via temp file).

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

const DEFAULT_DATA = {
  users: [],       // { id, email, passwordHash, createdAt }
  posts: [],       // { id, category, title, name, place, description, image, video, comments: [], userId, createdAt }
  nextUserId: 1,
  nextPostId: 1,
};

function load() {
  if (!fs.existsSync(DB_PATH)) {
    const seeded = require('./seed-data');
    save(seeded);
    return seeded;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read db.json, reinitializing', e);
    const seeded = require('./seed-data');
    save(seeded);
    return seeded;
  }
}

function save(data) {
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

let data = load();

module.exports = {
  get: () => data,
  persist: () => save(data),
  reset: () => {
    data = require('./seed-data');
    save(data);
    return data;
  },
};
