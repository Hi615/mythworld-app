# MythWorld — An Archive of the Unexplained

A community archive for stories about divine encounters, ghosts, cryptids,
premonitions, myths, and unexplained phenomena. Fully functional: real
accounts, signup/login, file uploads, comments, and a "Library" subscription.

## What's included

- **Express server** (`server.js`) with a JSON-file database (`data/db.json`,
  created automatically on first run — no external database needed).
- **Real authentication**: email + password, hashed with bcrypt, sessions via
  JWT stored in an HTTP-only cookie.
- **File uploads**: photo/video reports are saved to `uploads/` and served
  back to the browser.
- **Persistent comments and library subscription**, stored per-user.
- **Frontend** in `public/` (plain HTML/CSS/JS, no build step).

## Running locally

```bash
npm install
npm start
```

Then open **http://localhost:3000**.

The first time it runs, it seeds the database with 6 example case files
(matching the original demo content). After that, everything you add
(accounts, reports, comments, subscriptions) is saved to `data/db.json`
and `uploads/`.

## Configuration

Set these environment variables before starting in production:

| Variable     | Purpose                                              | Default                          |
|--------------|------------------------------------------------------|-----------------------------------|
| `PORT`       | Port to listen on                                     | `3000`                            |
| `JWT_SECRET` | Secret used to sign login session tokens — **change this** | `mythworld-dev-secret-change-me` |

Example:

```bash
JWT_SECRET="$(openssl rand -hex 32)" PORT=3000 npm start
```

## Deploying

This is a single Node.js process with a filesystem database, so it works on
any host that runs Node and gives you persistent disk (Render, Railway,
Fly.io, a VPS, etc.).

### Option A — VPS / your own server

```bash
git clone <your-repo>
cd mythworld
npm install --omit=dev
JWT_SECRET="$(openssl rand -hex 32)" PORT=3000 npm start
```

Put it behind nginx/Caddy for HTTPS, or use a process manager like `pm2`:

```bash
npm install -g pm2
pm2 start server.js --name mythworld --env production
pm2 save
```

### Option B — Render / Railway / Fly.io

1. Push this folder to a GitHub repo.
2. Create a new "Web Service" from the repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variable `JWT_SECRET` with a random secret.
6. **Important**: enable a persistent disk/volume mounted at the project
   root (or at least covering `data/` and `uploads/`), otherwise uploaded
   reports and accounts will be lost on redeploy.

## Important production notes

- **Backups**: `data/db.json` is the entire database. Back it up regularly.
- **File size limit**: uploads are capped at 25MB per file (configurable in
  `server.js`, `multer` limits).
- **Scaling**: the JSON-file database is fine for small/medium communities.
  If you outgrow it, swap `db.js` for a real database (Postgres/SQLite) —
  the rest of the app talks to `db.get()` / `db.persist()`, so the change is
  isolated to that file.
- **Email/password reset**: not implemented. If a user forgets their
  password, you'll need to manually reset it in `data/db.json` (replace
  `passwordHash` with a new bcrypt hash) until a reset-email flow is added.

## Project structure

```
mythworld-app/
├── server.js        # Express app, API routes, auth
├── db.js            # tiny JSON-file database
├── seed-data.js      # initial demo posts
├── package.json
├── data/
│   └── db.json       # created automatically (your real data)
├── uploads/          # uploaded photos/videos
└── public/
    ├── index.html
    └── app.js
```
