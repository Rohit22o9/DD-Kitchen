# Daily Drop API

Express + MongoDB API. See the [root README](../README.md) for setup and deployment and [FIXES.md](../FIXES.md) for what changed from v1.

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:8000/api/health
npm test             # needs network access to download MongoDB once, or set MONGOMS_SYSTEM_BINARY
```

All routes and their guards are listed in `src/routes/index.js`.
