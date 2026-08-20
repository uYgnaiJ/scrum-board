# Scrum Canvas

A local Scrum board with a browser interface and a small Node.js process for MySQL/PostgreSQL access. There is no cloud service and no Electron dependency.

## Run it

```bash
npm install
npm start
```

Then open <http://127.0.0.1:4173>.

The first launch opens a fully interactive demo workspace stored in browser local storage. Open **Configuration → Data sources** to connect a database. The Node process inspects `information_schema`, creates the regulated Scrum tables when they are absent, and reads an existing compatible schema when present.

Use `SCRUM_CANVAS_PORT` or `SCRUM_CANVAS_HOST` to override the default local address. The app binds to `127.0.0.1` by default so it is not exposed to the network.

## Database objects

- `scrum_meta`
- `scrum_columns`
- `scrum_projects`
- `scrum_priorities`
- `scrum_tasks`
- `scrum_task_movements`

Passwords are kept only in the ignored local file `server/data/config.json`. Protect that file like any other database credential.

## Development

Run the API and Vite UI in separate terminals:

```bash
npm run serve
npm run dev
```

Vite proxies `/api` to the Node process on port 4173.
