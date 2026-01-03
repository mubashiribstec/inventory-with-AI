
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
  connectionLimit: 10,
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
  console.log(`[DATABASE] Running ${forceReset ? 'FORCE RESET' : 'schema check'}...`);
  
  if (forceReset) {
    // Drop tables in reverse order of dependencies if any (though currently flat)
    for (const table of modules) {
      await conn.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
    console.log('[DATABASE] All existing tables dropped.');
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
    `CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recipient_id VARCHAR(50) NOT NULL,
      sender_name VARCHAR(100),
      message TEXT,
      type VARCHAR(50),
      is_read BOOLEAN DEFAULT FALSE,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50),
      username VARCHAR(50),
      action VARCHAR(50),
      target_type VARCHAR(50),
      target_id VARCHAR(50),
      details TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(50),
      username VARCHAR(50),
      date DATE,
      check_in DATETIME,
      check_out DATETIME,
      status VARCHAR(20),
      location VARCHAR(255)
    )`,
    `CREATE TABLE IF NOT EXISTS salaries (
      id VARCHAR(50) PRIMARY KEY,
      employee_id VARCHAR(50),
      base_salary DECIMAL(10, 2),
      tenure_bonus DECIMAL(10, 2),
      total_payable DECIMAL(10, 2),
      status VARCHAR(20),
      month VARCHAR(20)
    )`,
    `CREATE TABLE IF NOT EXISTS leave_requests (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(50),
      username VARCHAR(50),
      start_date DATE,
      end_date DATE,
      leave_type VARCHAR(20),
      reason TEXT,
      status VARCHAR(20)
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
    `CREATE TABLE IF NOT EXISTS movements (
      id VARCHAR(50) PRIMARY KEY,
      date DATE,
      item VARCHAR(255),
      \`from\` VARCHAR(255),
      \`to\` VARCHAR(255),
      employee VARCHAR(255),
      department VARCHAR(100),
      status VARCHAR(50)
    )`,
    `CREATE TABLE IF NOT EXISTS departments (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      head VARCHAR(255),
      budget DECIMAL(15, 2) DEFAULT 0,
      budget_month VARCHAR(20)
    )`,
    `CREATE TABLE IF NOT EXISTS employees (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      department VARCHAR(100),
      role VARCHAR(100),
      joining_date DATE,
      team_lead_id VARCHAR(50),
      manager_id VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE
    )`,
    `CREATE TABLE IF NOT EXISTS suppliers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255),
      email VARCHAR(255),
      rating INT DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS locations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      building VARCHAR(100),
      floor VARCHAR(50),
      room VARCHAR(50),
      manager VARCHAR(255)
    )`,
    `CREATE TABLE IF NOT EXISTS maintenance_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_id VARCHAR(50),
      issue_type VARCHAR(100),
      description TEXT,
      status VARCHAR(50),
      cost DECIMAL(10, 2),
      start_date DATE
    )`,
    `CREATE TABLE IF NOT EXISTS licenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      software_name VARCHAR(255) NOT NULL,
      product_key VARCHAR(255),
      total_seats INT,
      assigned_seats INT,
      expiration_date DATE,
      supplier_id INT
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      icon VARCHAR(50)
    )`,
    `CREATE TABLE IF NOT EXISTS requests (
      id VARCHAR(50) PRIMARY KEY,
      item VARCHAR(255),
      employee VARCHAR(255),
      department VARCHAR(100),
      urgency VARCHAR(50),
      status VARCHAR(50),
      request_date DATE,
      notes TEXT
    )`
  ];

  for (const query of queries) {
    await conn.query(query);
  }

  // Seed default settings and roles
  await conn.query("REPLACE INTO settings (id, software_name, primary_color, software_description, software_logo) VALUES ('GLOBAL', 'SmartStock Pro', 'indigo', 'Enterprise Resource Planning', 'fa-warehouse')");

  const defaultRoles = [
    ['ADMIN', 'Administrator', 'Full system access and security policy controls.', 'inventory.view,inventory.edit,inventory.procure,hr.view,hr.attendance,hr.leaves,hr.users,hr.salaries,analytics.view,analytics.financials,analytics.logs,system.roles,system.db,system.settings', 'rose', 'fa-user-crown'],
    ['MANAGER', 'Operations Manager', 'Departmental oversight of assets and operational logs.', 'inventory.view,inventory.edit,hr.view,hr.leaves,analytics.view,analytics.financials', 'amber', 'fa-briefcase'],
    ['HR', 'HR Specialist', 'Manages lifecycle of staff, attendance, and leave compliance.', 'hr.view,hr.attendance,hr.leaves,hr.salaries,analytics.view', 'emerald', 'fa-users-cog'],
    ['TEAM_LEAD', 'Team Lead', 'Oversight of tactical continuity for assigned team members.', 'inventory.view,hr.view,hr.attendance,analytics.view', 'indigo', 'fa-user-tie'],
    ['STAFF', 'Standard Employee', 'Personal asset tracking and basic requests.', 'inventory.view', 'slate', 'fa-user']
  ];

  for (const r of defaultRoles) {
    await conn.query("REPLACE INTO roles (id, label, description, permissions, color, icon) VALUES (?, ?, ?, ?, ?, ?)", r);
  }

  // Ensure default admin exists
  await conn.query("REPLACE INTO users (id, username, password, role, full_name, shift_start_time, department, joining_date, designation, is_active) VALUES ('U-001', 'admin', 'admin', 'ADMIN', 'System Administrator', '09:00', 'IT Infrastructure', '2023-01-01', 'Chief Systems Admin', 1)");
  
  console.log('[DATABASE] Initialization complete. Default Login: admin / admin');
  return true;
};

// Retry Loop for Database Connection
const initDbWithRetry = async (retries = 30, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    let conn;
    try {
      console.log(`[DATABASE] Connecting to ${dbHost} (Attempt ${i + 1}/${retries})...`);
      conn = await pool.getConnection();
      await handleInitDb(conn);
      isDbReady = true;
      dbError = null;
      console.log('[DATABASE] Connected and ready.');
      return;
    } catch (err) {
      dbError = `DB_CONNECTION_FAILURE: ${err.message}`;
      console.error(`[DATABASE ERROR] ${err.message}`);
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delay));
      }
    } finally {
      if (conn) conn.release();
    }
  }
  dbError = `CRITICAL_ERROR: Failed to connect to database after 30 attempts at ${dbHost}.`;
};

// Start initialization in background
initDbWithRetry();

// Middleware
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  // Always allow /init-db regardless of state
  if (req.path === '/init-db') return next();
  
  if (!isDbReady) {
    return res.status(503).json({ 
      error: 'Database Initializing', 
      details: dbError || 'The server is currently establishing a connection to MariaDB.' 
    });
  }
  next();
});

const sendJSON = (res, data, status = 200) => {
  return res.status(status).send(JSON.stringify(data));
};

// Endpoints
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      const user = rows[0];
      if (user.is_active === 0) return sendJSON(res, { error: 'Account disabled' }, 403);
      const { password: _, ...userSafe } = user;
      sendJSON(res, userSafe);
    } else {
      sendJSON(res, { error: 'Invalid username or password' }, 401);
    }
  } catch (err) {
    sendJSON(res, { error: `Login Error: ${err.message}` }, 500);
  } finally {
    if (conn) conn.release();
  }
});

app.post('/api/init-db', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const force = req.body.force === true;
    await handleInitDb(conn, force);
    isDbReady = true;
    dbError = null;
    sendJSON(res, { success: true, message: force ? 'Database reset and initialized.' : 'Database tables verified.' });
  } catch (err) {
    sendJSON(res, { error: `Init Failure: ${err.message}` }, 500);
  } finally {
    if (conn) conn.release();
  }
});

app.post('/api/factory-reset', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await handleInitDb(conn, true); // True = Delete old and reset
    sendJSON(res, { success: true, message: 'Software factory reset complete.' });
  } catch (err) {
    sendJSON(res, { error: err.message }, 500);
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/settings', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM settings WHERE id = ?', ['GLOBAL']);
    sendJSON(res, rows[0] || {});
  } catch (err) { sendJSON(res, { error: err.message }, 500); }
  finally { if (conn) conn.release(); }
});

app.post('/api/settings', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { software_name, primary_color, software_description, software_logo } = req.body;
    await conn.query(
      'REPLACE INTO settings (id, software_name, primary_color, software_description, software_logo) VALUES (?, ?, ?, ?, ?)',
      ['GLOBAL', software_name, primary_color, software_description, software_logo]
    );
    sendJSON(res, { success: true });
  } catch (err) { sendJSON(res, { error: err.message }, 500); }
  finally { if (conn) conn.release(); }
});

const handleCRUD = (tableName) => {
  app.get(`/api/${tableName}`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`SELECT * FROM ${tableName}`);
      sendJSON(res, Array.from(rows));
    } catch (err) { sendJSON(res, { error: err.message }, 500); }
    finally { if (conn) conn.release(); }
  });

  app.post(`/api/${tableName}`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const keys = Object.keys(req.body);
      const values = Object.values(req.body).map(v => v === '' ? null : v);
      const id = req.body.id;
      let isUpdate = false;
      if (id) {
        const existing = await conn.query(`SELECT 1 FROM ${tableName} WHERE id = ?`, [id]);
        if (existing.length > 0) isUpdate = true;
      }
      if (isUpdate) {
        const setClause = keys.filter(k => k !== 'id').map(k => `\`${k}\` = ?`).join(', ');
        const updateValues = keys.filter(k => k !== 'id').map(k => req.body[k] === '' ? null : req.body[k]);
        updateValues.push(id);
        await conn.query(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`, updateValues);
      } else {
        const escapedKeys = keys.map(k => `\`${k}\``);
        const placeholders = keys.map(() => '?').join(', ');
        await conn.query(`INSERT INTO ${tableName} (${escapedKeys.join(', ')}) VALUES (${placeholders})`, values);
      }
      sendJSON(res, { success: true });
    } catch (err) { sendJSON(res, { error: err.message }, 500); }
    finally { if (conn) conn.release(); }
  });

  app.delete(`/api/${tableName}/:id`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
      sendJSON(res, { success: true });
    } catch (err) { sendJSON(res, { error: err.message }, 500); }
    finally { if (conn) conn.release(); }
  });
};

modules.forEach(handleCRUD);

const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => console.log(`SmartStock ERP running on port ${port}`));
