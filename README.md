# Scrum Canvas

A local Scrum board with a browser interface and a small Node.js server for MySQL or PostgreSQL access. No cloud service, no Electron.

## Run it

Install dependencies once:

```bash
npm install
```

Then either double-click `start.bat` (Windows) or run:

```bash
npm start
```

Open http://127.0.0.1:4173.

The first launch opens an interactive demo workspace stored in browser local storage. Open Configuration → Data sources to connect a MySQL or PostgreSQL database. The server inspects `information_schema`, creates the Scrum tables when they are missing, and reuses an existing compatible schema. Missing columns are added automatically.

`SCRUM_CANVAS_PORT` and `SCRUM_CANVAS_HOST` override the default address. The server binds to `127.0.0.1` by default, so it is not exposed to the network.

## Features

- Kanban board with configurable columns and priorities
- Projects and branches, with a project filter
- Tasks with requester, request time, expected finish, priority, and status
- Sub-tasks under a main task, shown in the board and in the edit panel
- Hover a card to preview its content
- Movement history and a workspace note

## Scripts

```bash
npm run dev      # Vite dev server (proxies /api to port 4173)
npm run serve    # Start the API server only
npm run build    # Build the frontend into dist/
npm start        # Build, then serve API and frontend on 4173
npm run check    # Syntax check the server and build the frontend
```

## Database objects

- scrum_meta
- scrum_columns
- scrum_projects
- scrum_priorities
- scrum_tasks
- scrum_task_movements
- scrum_notes

Connection details, including passwords, are kept only in the local file `server/data/config.json`. Treat it like any other credentials file.

## Development

Run the API and the Vite UI in separate terminals:

```bash
npm run serve
npm run dev
```

Vite proxies `/api` requests to the Node server on port 4173.
