const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const database = require('./database.cjs');

const app = express();
const PORT = Number(process.env.SCRUM_CANVAS_PORT || 4173);
const HOST = process.env.SCRUM_CANVAS_HOST || '127.0.0.1';
const CONFIG_PATH = path.join(__dirname, 'data', 'config.json');

app.use(express.json({ limit: '1mb' }));

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch { return { activeDatasourceId: null, datasources: [] }; }
}

function saveConfig(config) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  return config;
}

function publicConfig(config) {
  return {
    ...config,
    // This app is bound to localhost and the configuration screen explicitly
    // supports viewing/editing saved credentials.
    datasources: config.datasources.map((source) => ({ ...source, hasSavedPassword: Boolean(source.password) })),
  };
}

function resolveSource(id, draft) {
  const config = loadConfig();
  if (draft) {
    const stored = config.datasources.find((item) => item.id === draft.id);
    return { ...stored, ...draft, password: draft.password || stored?.password || '' };
  }
  const source = config.datasources.find((item) => item.id === (id || config.activeDatasourceId));
  if (!source) {
    const error = new Error('No data source is selected. Add one in Configuration.');
    error.status = 409;
    throw error;
  }
  return source;
}

function activeSource() { return resolveSource(); }
function route(handler) {
  return async (req, res, next) => {
    try { await handler(req, res); } catch (error) { next(error); }
  };
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/config', (_req, res) => res.json(publicConfig(loadConfig())));

app.post('/api/datasources/test', route(async (req, res) => {
  const source = resolveSource(null, req.body);
  const db = await database.connect(source);
  try {
    const inspection = await database.inspectSchema(db, source);
    res.json({ ok: true, inspection });
  } finally { await db.close(); }
}));

app.post('/api/datasources', route(async (req, res) => {
  const source = resolveSource(null, { ...req.body, id: req.body.id || crypto.randomUUID() });
  const inspection = await database.ensureSchema(source);
  const config = loadConfig();
  const existing = config.datasources.findIndex((item) => item.id === source.id);
  if (existing >= 0) config.datasources[existing] = source;
  else config.datasources.push(source);
  config.activeDatasourceId = source.id;
  saveConfig(config);
  res.json({ config: publicConfig(config), inspection, board: await database.loadBoard(source) });
}));

app.post('/api/datasources/:id/connect', route(async (req, res) => {
  const source = resolveSource(req.params.id);
  const inspection = await database.ensureSchema(source);
  const config = loadConfig();
  config.activeDatasourceId = source.id;
  saveConfig(config);
  res.json({ config: publicConfig(config), inspection, board: await database.loadBoard(source) });
}));

app.get('/api/board', route(async (_req, res) => {
  const source = activeSource();
  await database.ensureSchema(source);
  res.json(await database.loadBoard(source));
}));
app.put('/api/board-config', route(async (req, res) => res.json(await database.saveBoardConfig(activeSource(), req.body))));
app.get('/api/note', route(async (_req, res) => res.json(await database.loadNote(activeSource()))));
app.put('/api/note', route(async (req, res) => res.json(await database.saveNote(activeSource(), String(req.body.content || '')))));
app.post('/api/tasks', route(async (req, res) => res.status(201).json(await database.createTask(activeSource(), req.body))));
app.put('/api/tasks/:id', route(async (req, res) => res.json(await database.updateTask(activeSource(), { ...req.body, id: req.params.id }))));
app.post('/api/tasks/:id/move', route(async (req, res) => res.json(await database.moveTask(activeSource(), req.params.id, req.body.columnId))));
app.delete('/api/tasks/:id', route(async (req, res) => res.json(await database.softDeleteTask(activeSource(), req.params.id))));

const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
  },
}));
app.get('*path', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(dist, 'index.html'));
});

app.use((error, _req, res, _next) => {
  if (!error.status || error.status >= 500) console.error(error);
  res.status(error.status || 500).json({ error: error.message || 'Unexpected error', code: error.code || 'SERVER_ERROR' });
});

app.listen(PORT, HOST, () => {
  console.log(`Scrum Canvas is ready at http://${HOST}:${PORT}`);
});
