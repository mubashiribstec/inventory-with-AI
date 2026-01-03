
const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Security Secret - Change this to something unique and keep it private!
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'smartstock_enterprise_master_key_2025';

app.use(cors());
app.use(express.json());

const dbHost = process.env.DB_HOST && process.env.DB_HOST.trim() !== '' ? process.env.DB_HOST : '127.0.0.1';

const pool = mariadb.createPool({
  host: dbHost,
  user: process.env.DB_USER || 'inventory_user',
  password: process.env.DB_PASSWORD || 'inventory_password',
  database: process.env.DB_NAME || 'smartstock',
  connectionLimit: 15
});

let isDbReady = false;

// --- CRYPTOGRAPHIC UTILITIES ---

const generateSignature = (payload) => {
  return crypto.createHmac('sha256', LICENSE_SECRET).update(payload).digest('hex');
};

const verifyLicense = (licenseKey, currentSystemId) => {
  if (!licenseKey || !licenseKey.includes('.')) return { valid: false, error: 'Malformed Key' };
  
  const [payloadBase64, signature] = licenseKey.split('.');
  const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
  
  try {
    const payload = JSON.parse(payloadJson);
    const expectedSignature = generateSignature(payloadJson);
    
    // 1. Check Integrity (Has the key been tampered with?)
    if (signature !== expectedSignature) return { valid: false, error: 'Signature Mismatch' };
    
    // 2. Check Expiry (Has the license run out?)
    const expiry = new Date(payload.expiry);
    if (expiry < new Date()) return { valid: false, error: 'License Expired', payload };

    // 3. Check Hardware Binding (Does this key belong to THIS computer?)
    if (payload.sid !== currentSystemId) return { valid: false, error: 'Binding Mismatch (Key belongs to another system)' };
    
    return { valid: true, payload };
  } catch (e) {
    return { valid: false, error: 'Invalid Payload Structure' };
  }
};

// --- MIDDLEWARE: THE GATEKEEPER ---

const licenseGuard = async (req, res, next) => {
  // Always allow init and login
  if (req.path === '/api/login' || req.path === '/api/init-db') return next();

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT license_key, system_id FROM settings WHERE id = ?', ['GLOBAL']);
    const settings = rows[0];

    // Allow updating settings (activation) even if license is invalid
    if (req.path === '/api/settings' && req.method === 'POST') return next();
    if (req.path === '/api/settings' && req.method === 'GET') return next();

    const verification = verifyLicense(settings?.license_key, settings?.system_id);
    
    if (!verification.valid) {
      return res.status(403).json({ 
        error: 'License Authorization Required', 
        details: verification.error,
        code: 'LICENSE_INVALID' 
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Authorization Layer Error' });
  } finally {
    if (conn) conn.release();
  }
};

app.use('/api', licenseGuard);

// --- DB INITIALIZATION ---

const handleInitDb = async (conn) => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(50) PRIMARY KEY,
      software_name VARCHAR(255),
      primary_color VARCHAR(50),
      software_description TEXT,
      software_logo VARCHAR(50),
      license_key TEXT,
      license_expiry DATE,
      system_id VARCHAR(100)
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(100),
      role VARCHAR(20) NOT NULL,
      full_name VARCHAR(100),
      department VARCHAR(100) DEFAULT 'Unassigned',
      is_active BOOLEAN DEFAULT TRUE
    )`,
    `CREATE TABLE IF NOT EXISTS items (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      serial VARCHAR(100),
      status VARCHAR(50),
      cost DECIMAL(10, 2)
    )`,
    `CREATE TABLE IF NOT EXISTS roles (
      id VARCHAR(50) PRIMARY KEY,
      label VARCHAR(100),
      permissions TEXT,
      color VARCHAR(20)
    )`
  ];
  
  for (const q of queries) await conn.query(q);

  // Check if system ID exists, otherwise create it
  const existing = await conn.query("SELECT system_id FROM settings WHERE id = 'GLOBAL'");
  let systemId = existing[0]?.system_id;
  
  if (!systemId) {
    systemId = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Generate an initial 7-day Trial
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 7);
    const trialPayload = JSON.stringify({ expiry: trialExpiry.toISOString().split('T')[0], sid: systemId });
    const trialKey = `${Buffer.from(trialPayload).toString('base64')}.${generateSignature(trialPayload)}`;

    await conn.query(`REPLACE INTO settings (id, software_name, primary_color, software_description, software_logo, license_key, license_expiry, system_id) 
                     VALUES ('GLOBAL', 'Secure Inventory', 'indigo', 'Signed Enterprise Registry', 'fa-warehouse', ?, ?, ?)`, 
                     [trialKey, trialExpiry.toISOString().split('T')[0], systemId]);
  }

  // Seed default admin
  await conn.query("INSERT IGNORE INTO users (id, username, password, role, full_name) VALUES ('U-001', 'admin', 'admin', 'ADMIN', 'Administrator')");
  
  const defaultRoles = [
    ['ADMIN', 'Administrator', 'inventory.view,inventory.edit,system.settings,hr.users', 'rose'],
    ['STAFF', 'Staff', 'inventory.view', 'slate']
  ];
  for (const r of defaultRoles) {
    await conn.query("INSERT IGNORE INTO roles (id, label, permissions, color) VALUES (?, ?, ?, ?)", r);
  }
};

const modules = ['items', 'movements', 'departments', 'employees', 'suppliers', 'locations', 'maintenance_logs', 'licenses', 'categories', 'requests', 'users', 'roles', 'notifications', 'user_logs', 'attendance', 'salaries', 'leave_requests'];

const initDbWithRetry = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    await handleInitDb(conn);
    isDbReady = true;
    console.log("Database & Security Layer Ready.");
  } catch (err) {
    console.error("DB Init Error, retrying...", err.message);
    setTimeout(initDbWithRetry, 5000);
  } finally {
    if (conn) conn.release();
  }
};
initDbWithRetry();

app.get('/api/settings', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM settings WHERE id = ?', ['GLOBAL']);
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (conn) conn.release(); }
});

app.post('/api/settings', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { license_key, ...other } = req.body;
    
    if (license_key) {
      const settings = await conn.query('SELECT system_id FROM settings WHERE id = ?', ['GLOBAL']);
      const v = verifyLicense(license_key, settings[0]?.system_id);
      if (!v.valid) return res.status(400).json({ error: `Verification Failed: ${v.error}` });
      
      // Update expiry date in DB based on validated key
      req.body.license_expiry = v.payload.expiry;
    }

    const keys = Object.keys(req.body);
    const values = keys.map(k => req.body[k]);
    const placeholders = keys.map(() => '?').join(', ');
    await conn.query(`REPLACE INTO settings (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${placeholders})`, values);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (conn) conn.release(); }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT id, username, role, full_name, department FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) res.json(rows[0]);
    else res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (conn) conn.release(); }
});

const handleCRUD = (tableName) => {
  app.get(`/api/${tableName}`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`SELECT * FROM \`${tableName}\``);
      res.json(Array.from(rows));
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) conn.release(); }
  });
  app.post(`/api/${tableName}`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const keys = Object.keys(req.body);
      const values = keys.map(k => req.body[k]);
      const placeholders = keys.map(() => '?').join(', ');
      await conn.query(`REPLACE INTO \`${tableName}\` (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${placeholders})`, values);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
    finally { if (conn) conn.release(); }
  });
};
modules.forEach(handleCRUD);

const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));
app.get('*', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`SmartStock Secure API on port ${port}`));
