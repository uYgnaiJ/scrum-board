const mysql = require('mysql2/promise');
const pg = require('pg');
const { Client } = pg;
const { randomUUID } = require('crypto');

// TIMESTAMP (without time zone) columns are written as UTC wall-clock strings.
// pg-types would parse them in the process-local timezone by default, shifting
// every value; interpret them as UTC instead.
pg.types.setTypeParser(1114, (value) => (value === null ? value : new Date(`${value.replace(' ', 'T')}Z`)));

const TABLE_DEFINITIONS = {
  scrum_meta: ['schema_version', 'updated_at'],
  scrum_columns: ['id', 'name', 'color', 'position', 'is_todo', 'created_at'],
  scrum_projects: ['id', 'parent_id', 'name', 'created_at'],
  scrum_priorities: ['id', 'name', 'color', 'position', 'created_at'],
  scrum_tasks: ['id', 'parent_id', 'title', 'content', 'requester', 'expected_finish', 'requested_at', 'project_id', 'priority_id', 'column_id', 'created_at', 'updated_at', 'deleted_at'],
  scrum_task_movements: ['id', 'task_id', 'from_column_id', 'to_column_id', 'moved_at'],
  scrum_notes: ['id', 'content', 'updated_at'],
};

function sqlTimestamp(value = new Date()) {
  return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
}

async function connect(source) {
  if (source.type === 'postgres') {
    const client = new Client({
      host: source.host,
      port: Number(source.port || 5432),
      database: source.database,
      user: source.user,
      password: source.password,
      ssl: source.ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 7000,
    });
    await client.connect();
    return {
      type: 'postgres',
      raw: client,
      query: async (text, params = []) => (await client.query(text, params)).rows,
      close: () => client.end(),
    };
  }

  const client = await mysql.createConnection({
    host: source.host,
    port: Number(source.port || 3306),
    database: source.database,
    user: source.user,
    password: source.password,
    ssl: source.ssl ? {} : undefined,
    connectTimeout: 7000,
    // Timestamps are written as UTC wall-clock strings (sqlTimestamp). Tell the
    // driver to read them back as UTC too, so JS Dates keep the true instant
    // regardless of the server's local timezone.
    timezone: '+00:00',
  });
  return {
    type: 'mysql',
    raw: client,
    query: async (text, params = []) => {
      // Use MySQL's text protocol. Some older MySQL releases and compatible
      // proxies reject transaction/DDL commands sent through prepared
      // statements with ER_UNSUPPORTED_PS. mysql2 still escapes all `?`
      // placeholders when using query().
      const [rows] = await client.query(text, params);
      return rows;
    },
    close: () => client.end(),
  };
}

function placeholders(type, count, start = 1) {
  return Array.from({ length: count }, (_, index) => type === 'postgres' ? `$${start + index}` : '?').join(', ');
}

async function inspectSchema(db, source) {
  const tableNames = Object.keys(TABLE_DEFINITIONS);
  const marks = placeholders(db.type, tableNames.length);
  const scope = db.type === 'postgres' ? "table_schema = 'public'" : 'table_schema = ?';
  const params = db.type === 'postgres' ? tableNames : [source.database, ...tableNames];
  const offsetMarks = db.type === 'postgres' ? marks : placeholders(db.type, tableNames.length, 2);
  const query = `SELECT table_name, column_name FROM information_schema.columns WHERE ${scope} AND table_name IN (${offsetMarks})`;
  const rows = await db.query(query, params);
  const found = new Map();
  rows.forEach((row) => {
    const table = row.table_name || row.TABLE_NAME;
    const column = row.column_name || row.COLUMN_NAME;
    if (!found.has(table)) found.set(table, new Set());
    found.get(table).add(column);
  });
  const missingTables = tableNames.filter((name) => !found.has(name));
  const missingColumns = [];
  for (const [table, columns] of Object.entries(TABLE_DEFINITIONS)) {
    if (!found.has(table)) continue;
    for (const column of columns) if (!found.get(table).has(column)) missingColumns.push(`${table}.${column}`);
  }
  return { valid: !missingTables.length && !missingColumns.length, missingTables, missingColumns };
}

async function createSchema(db) {
  // Older MySQL releases can assign implicit defaults to TIMESTAMP columns and
  // then reject additional NOT NULL timestamps. DATETIME avoids that behavior;
  // PostgreSQL continues to use its native TIMESTAMP type.
  const dateTimeType = db.type === 'mysql' ? 'DATETIME' : 'TIMESTAMP';
  const statements = [
    `CREATE TABLE IF NOT EXISTS scrum_meta (schema_version VARCHAR(20) PRIMARY KEY, updated_at ${dateTimeType} NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS scrum_columns (id VARCHAR(36) PRIMARY KEY, name VARCHAR(100) NOT NULL, color VARCHAR(20) NOT NULL, position INTEGER NOT NULL, is_todo INTEGER NOT NULL DEFAULT 0, created_at ${dateTimeType} NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS scrum_projects (id VARCHAR(36) PRIMARY KEY, parent_id VARCHAR(36) NULL, name VARCHAR(160) NOT NULL, created_at ${dateTimeType} NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS scrum_priorities (id VARCHAR(36) PRIMARY KEY, name VARCHAR(80) NOT NULL, color VARCHAR(20) NOT NULL, position INTEGER NOT NULL, created_at ${dateTimeType} NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS scrum_tasks (id VARCHAR(36) PRIMARY KEY, parent_id VARCHAR(36) NULL, title VARCHAR(240) NOT NULL, content TEXT NULL, requester VARCHAR(160) NOT NULL, expected_finish ${dateTimeType} NULL, requested_at ${dateTimeType} NULL, project_id VARCHAR(36) NULL, priority_id VARCHAR(36) NULL, column_id VARCHAR(36) NOT NULL, created_at ${dateTimeType} NOT NULL, updated_at ${dateTimeType} NOT NULL, deleted_at ${dateTimeType} NULL)`,
    `CREATE TABLE IF NOT EXISTS scrum_task_movements (id VARCHAR(36) PRIMARY KEY, task_id VARCHAR(36) NOT NULL, from_column_id VARCHAR(36) NULL, to_column_id VARCHAR(36) NOT NULL, moved_at ${dateTimeType} NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS scrum_notes (id VARCHAR(36) PRIMARY KEY, content TEXT NOT NULL, updated_at ${dateTimeType} NOT NULL)`,
  ];
  for (const statement of statements) await db.query(statement);

  const now = sqlTimestamp();
  const columns = await db.query('SELECT id FROM scrum_columns');
  if (!columns.length) {
    const defaults = [
      [randomUUID(), 'To do', '#6c63ff', 0, 1, now],
      [randomUUID(), 'In progress', '#e9a23b', 1, 0, now],
      [randomUUID(), 'Review', '#3b82f6', 2, 0, now],
      [randomUUID(), 'Done', '#31a66a', 3, 0, now],
    ];
    for (const values of defaults) await db.query(`INSERT INTO scrum_columns (id,name,color,position,is_todo,created_at) VALUES (${placeholders(db.type, 6)})`, values);
  }
  const priorities = await db.query('SELECT id FROM scrum_priorities');
  if (!priorities.length) {
    const defaults = [['Low', '#78a88b'], ['Medium', '#d09b36'], ['High', '#de6a4c'], ['Critical', '#c94b6d']];
    for (let i = 0; i < defaults.length; i += 1) {
      await db.query(`INSERT INTO scrum_priorities (id,name,color,position,created_at) VALUES (${placeholders(db.type, 5)})`, [randomUUID(), defaults[i][0], defaults[i][1], i, now]);
    }
  }
  const projects = await db.query('SELECT id FROM scrum_projects');
  if (!projects.length) {
    const projectId = randomUUID();
    await db.query(`INSERT INTO scrum_projects (id,parent_id,name,created_at) VALUES (${placeholders(db.type, 4)})`, [projectId, null, 'General', now]);
    await db.query(`INSERT INTO scrum_projects (id,parent_id,name,created_at) VALUES (${placeholders(db.type, 4)})`, [randomUUID(), projectId, 'Main', now]);
  }
  const existingMeta = await db.query('SELECT schema_version FROM scrum_meta');
  if (!existingMeta.length) await db.query(`INSERT INTO scrum_meta (schema_version,updated_at) VALUES (${placeholders(db.type, 2)})`, ['1', now]);
}

async function migrateSchema(db, missingColumns) {
  const dateTimeType = db.type === 'mysql' ? 'DATETIME' : 'TIMESTAMP';
  const migrations = { 'scrum_tasks.requested_at': dateTimeType };
  for (const key of missingColumns) {
    if (!migrations[key]) {
      const error = new Error(`Existing Scrum tables are incompatible: ${key}`);
      error.code = 'INCOMPATIBLE_SCHEMA';
      throw error;
    }
    const [table, column] = key.split('.');
    await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${migrations[key]} NULL`);
  }
}

async function ensureSchema(source) {
  const db = await connect(source);
  try {
    let inspection = await inspectSchema(db, source);
    if (!inspection.valid) {
      if (inspection.missingTables.length) await createSchema(db);
      if (inspection.missingColumns.length) await migrateSchema(db, inspection.missingColumns);
      inspection = await inspectSchema(db, source);
    }
    return inspection;
  } finally {
    await db.close();
  }
}

async function loadBoard(source) {
  const db = await connect(source);
  try {
    const [columns, projects, priorities, tasks, movements] = await Promise.all([
      db.query('SELECT * FROM scrum_columns ORDER BY position'),
      db.query('SELECT * FROM scrum_projects ORDER BY created_at'),
      db.query('SELECT * FROM scrum_priorities ORDER BY position'),
      db.query('SELECT * FROM scrum_tasks WHERE deleted_at IS NULL ORDER BY updated_at DESC'),
      db.query('SELECT * FROM scrum_task_movements ORDER BY moved_at DESC'),
    ]);
    return { columns, projects, priorities, tasks, movements };
  } finally {
    await db.close();
  }
}

async function createTask(source, task) {
  const db = await connect(source);
  const id = randomUUID();
  const stamp = new Date();
  const now = sqlTimestamp(stamp);
  const nowIso = stamp.toISOString();
  try {
    const values = [id, task.parent_id || null, task.title, task.content || null, task.requester, task.expected_finish ? sqlTimestamp(task.expected_finish) : null, task.requested_at ? sqlTimestamp(task.requested_at) : null, task.project_id || null, task.priority_id || null, task.column_id, now, now, null];
    await db.query(`INSERT INTO scrum_tasks (id,parent_id,title,content,requester,expected_finish,requested_at,project_id,priority_id,column_id,created_at,updated_at,deleted_at) VALUES (${placeholders(db.type, values.length)})`, values);
    await db.query(`INSERT INTO scrum_task_movements (id,task_id,from_column_id,to_column_id,moved_at) VALUES (${placeholders(db.type, 5)})`, [randomUUID(), id, null, task.column_id, now]);
    return { ...task, id, created_at: nowIso, updated_at: nowIso, deleted_at: null };
  } finally { await db.close(); }
}

async function updateTask(source, task) {
  const db = await connect(source);
  const stamp = new Date();
  const now = sqlTimestamp(stamp);
  try {
    const fields = ['parent_id', 'title', 'content', 'requester', 'expected_finish', 'requested_at', 'project_id', 'priority_id'];
    const values = fields.map((key) => (key === 'expected_finish' || key === 'requested_at') && task[key] ? sqlTimestamp(task[key]) : (task[key] || null));
    const assignments = fields.map((field, index) => `${field} = ${db.type === 'postgres' ? `$${index + 1}` : '?'}`);
    const updateIndex = values.length + 1;
    const idIndex = values.length + 2;
    await db.query(`UPDATE scrum_tasks SET ${assignments.join(', ')}, updated_at = ${db.type === 'postgres' ? `$${updateIndex}` : '?'} WHERE id = ${db.type === 'postgres' ? `$${idIndex}` : '?'}`, [...values, now, task.id]);
    return { ...task, updated_at: stamp.toISOString() };
  } finally { await db.close(); }
}

async function moveTask(source, id, columnId) {
  const db = await connect(source);
  const stamp = new Date();
  const now = sqlTimestamp(stamp);
  try {
    const current = await db.query(`SELECT column_id FROM scrum_tasks WHERE id = ${db.type === 'postgres' ? '$1' : '?'}`, [id]);
    if (!current.length) throw new Error('Task not found');
    const from = current[0].column_id;
    await db.query(`UPDATE scrum_tasks SET column_id = ${db.type === 'postgres' ? '$1' : '?'}, updated_at = ${db.type === 'postgres' ? '$2' : '?'} WHERE id = ${db.type === 'postgres' ? '$3' : '?'}`, [columnId, now, id]);
    await db.query(`INSERT INTO scrum_task_movements (id,task_id,from_column_id,to_column_id,moved_at) VALUES (${placeholders(db.type, 5)})`, [randomUUID(), id, from, columnId, now]);
    return { id, from_column_id: from, to_column_id: columnId, moved_at: stamp.toISOString() };
  } finally { await db.close(); }
}

async function softDeleteTask(source, id) {
  const db = await connect(source);
  try {
    const now = sqlTimestamp();
    await db.query(`UPDATE scrum_tasks SET deleted_at = ${db.type === 'postgres' ? '$1' : '?'}, updated_at = ${db.type === 'postgres' ? '$2' : '?'} WHERE id = ${db.type === 'postgres' ? '$3' : '?'} OR parent_id = ${db.type === 'postgres' ? '$4' : '?'}`, [now, now, id, id]);
    return { id, deleted_at: now };
  } finally { await db.close(); }
}

async function saveBoardConfig(source, config) {
  const db = await connect(source);
  const now = sqlTimestamp();
  const upsert = async (table, columns, values) => {
    const names = columns.join(',');
    const updates = columns.filter((name) => name !== 'id').map((name) => db.type === 'postgres' ? `${name}=EXCLUDED.${name}` : `${name}=VALUES(${name})`).join(',');
    const conflict = db.type === 'postgres' ? `ON CONFLICT (id) DO UPDATE SET ${updates}` : `ON DUPLICATE KEY UPDATE ${updates}`;
    await db.query(`INSERT INTO ${table} (${names}) VALUES (${placeholders(db.type, values.length)}) ${conflict}`, values);
  };
  const deleteUnused = async (table, ids, referenceSql) => {
    if (!ids.length) return;
    const marks = placeholders(db.type, ids.length);
    await db.query(`DELETE FROM ${table} WHERE id NOT IN (${marks}) AND id NOT IN (${referenceSql})`, ids);
  };
  try {
    await db.query('BEGIN');
    for (let index = 0; index < config.columns.length; index += 1) {
      const item = config.columns[index];
      await upsert('scrum_columns', ['id','name','color','position','is_todo','created_at'], [item.id, item.name, item.color, index, item.is_todo ? 1 : 0, item.created_at ? sqlTimestamp(item.created_at) : now]);
    }
    for (const item of config.projects) {
      await upsert('scrum_projects', ['id','parent_id','name','created_at'], [item.id, item.parent_id || null, item.name, item.created_at ? sqlTimestamp(item.created_at) : now]);
    }
    for (let index = 0; index < config.priorities.length; index += 1) {
      const item = config.priorities[index];
      await upsert('scrum_priorities', ['id','name','color','position','created_at'], [item.id, item.name, item.color, index, item.created_at ? sqlTimestamp(item.created_at) : now]);
    }
    await deleteUnused('scrum_columns', config.columns.map((item) => item.id), 'SELECT column_id FROM scrum_tasks WHERE deleted_at IS NULL');
    await deleteUnused('scrum_projects', config.projects.map((item) => item.id), 'SELECT project_id FROM scrum_tasks WHERE deleted_at IS NULL AND project_id IS NOT NULL');
    await deleteUnused('scrum_priorities', config.priorities.map((item) => item.id), 'SELECT priority_id FROM scrum_tasks WHERE deleted_at IS NULL AND priority_id IS NOT NULL');
    await db.query('COMMIT');
    return await loadBoard(source);
  } catch (error) {
    try { await db.query('ROLLBACK'); } catch {}
    throw error;
  } finally { await db.close(); }
}

async function ensureNoteTable(db) {
  const dateTimeType = db.type === 'mysql' ? 'DATETIME' : 'TIMESTAMP';
  await db.query(`CREATE TABLE IF NOT EXISTS scrum_notes (id VARCHAR(36) PRIMARY KEY, content TEXT NOT NULL, updated_at ${dateTimeType} NOT NULL)`);
}

async function loadNote(source) {
  const db = await connect(source);
  try {
    await ensureNoteTable(db);
    const rows = await db.query(`SELECT id, content, updated_at FROM scrum_notes WHERE id = ${db.type === 'postgres' ? '$1' : '?'}`, ['workspace-note']);
    return rows[0] || { id: 'workspace-note', content: '', updated_at: null };
  } finally { await db.close(); }
}

async function saveNote(source, content) {
  const db = await connect(source);
  const stamp = new Date();
  const now = sqlTimestamp(stamp);
  try {
    await ensureNoteTable(db);
    if (db.type === 'postgres') {
      await db.query('INSERT INTO scrum_notes (id,content,updated_at) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content, updated_at=EXCLUDED.updated_at', ['workspace-note', content, now]);
    } else {
      await db.query('INSERT INTO scrum_notes (id,content,updated_at) VALUES (?,?,?) ON DUPLICATE KEY UPDATE content=VALUES(content), updated_at=VALUES(updated_at)', ['workspace-note', content, now]);
    }
    return { id: 'workspace-note', content, updated_at: stamp.toISOString() };
  } finally { await db.close(); }
}

module.exports = { connect, inspectSchema, ensureSchema, loadBoard, createTask, updateTask, moveTask, softDeleteTask, saveBoardConfig, loadNote, saveNote };
