
const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Connection pool configuration
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'inventory_user',
  password: process.env.DB_PASSWORD || 'inventory_password',
  database: process.env.DB_NAME || 'smartstock',
  connectionLimit: 20,
  connectTimeout: 15000
});

// Middleware to enforce JSON content type
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

const sendJSON = (res, data, status = 200) => {
  return res.status(status).send(JSON.stringify(data));
};

// Helper for logging user actions
async function logAction(userId, username, action, targetType, targetId, details) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO user_logs (user_id, username, action, target_type, target_id, details) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, username, action, targetType, targetId, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Audit Log Error:', err);
  } finally {
    if (conn) conn.release();
  }
}

// --- API Endpoints ---

/**
 * Login
 */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  let conn;
  try {
    console.log(`Login attempt for: ${username}`);
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    
    if (rows.length > 0) {
      const user = rows[0];
      console.log(`Login successful for: ${username} (Role: ${user.role})`);
      // Do not return password to frontend
      const { password: _, ...userSafe } = user;
      await logAction(user.id, user.username, 'LOGIN', 'USER', user.id, 'User logged in successfully');
      sendJSON(res, userSafe);
    } else {
      console.log(`Login failed for: ${username} - Invalid credentials`);
      sendJSON(res, { error: 'Invalid credentials' }, 401);
    }
  } catch (err) {
    console.error('Login Error:', err);
    sendJSON(res, { error: err.message }, 500);
  } finally {
    if (conn) conn.release();
  }
});

/**
 * Initialize Database Schema
 */
app.post('/api/init-db', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Starting Database Initialization...');
    
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        full_name VARCHAR(100),
        shift_start_time VARCHAR(5) DEFAULT '09:00'
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
        role VARCHAR(100)
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

    // Seeding default users
    console.log('Seeding default system users...');
    await conn.query("REPLACE INTO users (id, username, password, role, full_name, shift_start_time) VALUES ('U-001', 'admin', 'admin123', 'ADMIN', 'System Administrator', '09:00')");
    await conn.query("REPLACE INTO users (id, username, password, role, full_name, shift_start_time) VALUES ('U-002', 'manager', 'manager123', 'MANAGER', 'Operations Manager', '09:00')");
    await conn.query("REPLACE INTO users (id, username, password, role, full_name, shift_start_time) VALUES ('U-003', 'staff', 'staff123', 'STAFF', 'Basic Staff', '08:30')");

    console.log('Database initialization complete.');
    sendJSON(res, { success: true, message: 'Database successfully initialized. Default accounts are ready.' });
  } catch (err) {
    console.error('Init DB Error:', err);
    sendJSON(res, { error: err.message }, 500);
  } finally {
    if (conn) conn.release();
  }
});

/**
 * System Logs API
 */
app.get('/api/system-logs', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM user_logs ORDER BY timestamp DESC LIMIT 200');
    sendJSON(res, Array.from(rows));
  } catch (err) {
    sendJSON(res, { error: err.message }, 500);
  } finally {
    if (conn) conn.release();
  }
});

// Generic CRUD handlers
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
    const userId = req.headers['x-user-id'] || 'SYSTEM';
    const username = req.headers['x-username'] || 'SYSTEM';
    
    let conn;
    try {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body).map(v => v === '' ? null : v);
      const escapedKeys = keys.map(k => `\`${k}\``);
      const placeholders = keys.map(() => '?').join(', ');
      const updates = keys.map(k => `\`${k}\`=VALUES(\`${k}\`)`).join(', ');
      
      conn = await pool.getConnection();
      const query = `INSERT INTO ${tableName} (${escapedKeys.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`;
      const result = await conn.query(query, values);
      
      // LOG ACTION
      await logAction(userId, username, result.affectedRows > 1 ? 'UPDATE' : 'CREATE', tableName.toUpperCase(), req.body.id || 'NEW', req.body);
      
      sendJSON(res, { success: true }, 201);
    } catch (err) { sendJSON(res, { error: err.message }, 500); }
    finally { if (conn) conn.release(); }
  });

  app.delete(`/api/${tableName}/:id`, async (req, res) => {
    const userId = req.headers['x-user-id'] || 'SYSTEM';
    const username = req.headers['x-username'] || 'SYSTEM';
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
      
      // LOG ACTION
      await logAction(userId, username, 'DELETE', tableName.toUpperCase(), req.params.id, { id: req.params.id });
      
      sendJSON(res, { success: true });
    } catch (err) { sendJSON(res, { error: err.message }, 500); }
    finally { if (conn) conn.release(); }
  });
};

const modules = ['items', 'movements', 'suppliers', 'locations', 'maintenance_logs', 'categories', 'employees', 'departments', 'licenses', 'requests', 'attendance', 'users', 'leave_requests'];
modules.forEach(handleCRUD);

const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).send(JSON.stringify({ error: 'Not found' }));
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => console.log(`SmartStock ERP Active on ${port}`));
