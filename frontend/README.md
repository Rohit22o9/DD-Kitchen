# Daily Drop website

React 19 + TypeScript + Vite. See the [root README](../README.md).

```bash
npm install
npm run dev      # proxies /api to http://127.0.0.1:8000
npm run build    # set VITE_API_BASE_URL for production builds
```

`src/services/api.ts` is the only place that talks to the server.
