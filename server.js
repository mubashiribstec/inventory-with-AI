
const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuration for MariaDB connection
const dbHost = process.env.DB_HOST && process.env.DB_HOST.trim() !== '' 
  ? process.env.DB_HOST 
  : '127.0.0.1';

const pool = mariadb.createPool({
  host: dbHost,
  user: process.env.DB_USER || 'inventory_user',
  password: process.env.DB_PASSWORD || 'inventory_password',
  database: process.env.DB_NAME || 'smartstock',
  connectionLimit: 15,
  connectTimeout: 30000, 
  acquireTimeout: 30000
});

let isDbReady = false;
let dbError = null;

const modules = [
  'notifications', 'user_logs', 'attendance', 'salaries', 'leave_requests', 
  'items', 'movements', 'departments', 'employees', 'suppliers', 
  'locations', 'maintenance_logs', 'licenses', 'categories', 'requests', 
  'users', 'roles', 'settings'
];

const handleInitDb = async (conn, forceReset = false) => {
  if (forceReset) {
    for (const table of modules) {
      await conn.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
  }

  const queries = [
    `CREATE TABLE IF NOT EXISTS roles (
      id VARCHAR(50) PRIMARY KEY,
      label VARCHAR(100),
      description TEXT,
      permissions TEXT,
      color VARCHAR(20),
      icon VARCHAR(50) DEFAULT 'fa-shield-alt',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(100),
      role VARCHAR(20) NOT NULL,
      full_name VARCHAR(100),
      department VARCHAR(100) DEFAULT 'Unassigned',
      shift_start_time VARCHAR(5) DEFAULT '09:00',
      team_lead_id VARCHAR(50),
      manager_id VARCHAR(50),
      joining_date DATE,
      designation VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(50) PRIMARY KEY,
      software_name VARCHAR(255),
      primary_color VARCHAR(50),
      software_description TEXT,
      software_logo VARCHAR(50)
    )`,
    `CREATE TABLE IF NOT EXISTS items (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      serial VARCHAR(100),
      status VARCHAR(50),
      location VARCHAR(255),
      assignedTo VARCHAR(255),
      department VARCHAR(100),
      purchaseDate DATE,
      warranty DATE,
      cost DECIMAL(10, 2)
    )`,
    `CREATE TABLE IF NOT EXISTS departments (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      manager VARCHAR(255),
      budget DECIMAL(15, 2) DEFAULT 0,
      budget_month VARCHAR(20)
    )`
  ];

  for (const query of queries) {
    await conn.query(query);
  }

  // Initial Seed with generic data - "SmartStock Pro" removed from hardcoded defaults
  await conn.query("INSERT IGNORE INTO settings (id, software_name, primary_color, software_description, software_logo) VALUES ('GLOBAL', 'Inventory System', 'indigo', 'Local Enterprise Resource Planning', 'fa-warehouse')");
  
  const defaultRoles = [
    ['ADMIN', 'Administrator', 'Full system access.', 'inventory.view,inventory.edit,inventory.procure,hr.view,hr.attendance,hr.leaves,hr.users,hr.salaries,analytics.view,analytics.financials,analytics.logs,system.roles,system.db,system.settings', 'rose', 'fa-user-crown'],
    ['STAFF', 'Standard Employee', 'Basic access.', 'inventory.view', 'slate', 'fa-user']
  ];
  for (const r of defaultRoles) {
    await conn.query("INSERT IGNORE INTO roles (id, label, description, permissions, color, icon) VALUES (?, ?, ?, ?, ?, ?)", r);
  }

  await conn.query("INSERT IGNORE INTO users (id, username, password, role, full_name, shift_start_time, department, joining_date, designation, is_active) VALUES ('U-001', 'admin', 'admin', 'ADMIN', 'System Administrator', '09:00', 'IT', '2023-01-01', 'Admin', 1)");
  
  return true;
};

const initDbWithRetry = async (retries = 30, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    let conn;
    try {
      conn = await pool.getConnection();
      await handleInitDb(conn);
      isDbReady = true;
      dbError = null;
      return;
    } catch (err) {
      dbError = err.message;
      if (i < retries - 1) await new Promise(res => setTimeout(res, delay));
    } finally {
      if (conn) conn.release();
    }
  }
};

initDbWithRetry();

app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!isDbReady && req.path !== '/init-db') {
    return res.status(503).json({ error: 'Database Initializing' });
  }
  next();
});

const sendJSON = (res, data, status = 200) => res.status(status).send(JSON.stringify(data));

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      const user = rows[0];
      const { password: _, ...userSafe } = user;
      sendJSON(res, userSafe);
    } else {
      sendJSON(res, { error: 'Invalid credentials' }, 401);
    }
  } catch (err) { sendJSON(res, { error: err.message }, 500); }
  finally { if (conn) conn.release(); }
});

const handleCRUD = (tableName) => {
  app.get(`/api/${tableName}`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`SELECT * FROM \`${tableName}\``);
      sendJSON(res, Array.from(rows));
    } catch (err) { sendJSON(res, { error: err.message }, 500); }
    finally { if (conn) conn.release(); }
  });

  app.post(`/api/${tableName}`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const id = req.body.id;
      const keys = Object.keys(req.body);
      const values = keys.map(k => req.body[k]);
      const placeholders = keys.map(() => '?').join(', ');
      await conn.query(`REPLACE INTO \`${tableName}\` (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${placeholders})`, values);
      sendJSON(res, { success: true });
    } catch (err) { sendJSON(res, { error: err.message }, 500); }
    finally { if (conn) conn.release(); }
  });

  app.delete(`/api/${tableName}/:id`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(`DELETE FROM \`${tableName}\` WHERE id = ?`, [req.params.id]);
      sendJSON(res, { success: true });
    } catch (err) { sendJSON(res, { error: err.message }, 500); }
    finally { if (conn) conn.release(); }
  });
};

modules.forEach(handleCRUD);

app.get('/api/settings', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM settings WHERE id = ?', ['GLOBAL']);
    sendJSON(res, rows[0] || {});
  } catch (err) { sendJSON(res, { error: err.message }, 500); }
  finally { if (conn) conn.release(); }
});

const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));
app.get('*', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`API Listening on ${port}`));
