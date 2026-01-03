
const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// MASTER SECRET: Keep this private. Used to sign all licenses.
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'smartstock_enterprise_master_key_2025';

app.use(cors());
app.use(express.json());

const dbHost = process.env.DB_HOST && process.env.DB_HOST.trim() !== '' ? process.env.DB_HOST : '127.0.0.1';

const pool = mariadb.createPool({
  host: dbHost,
  user: process.env.DB_USER || 'inventory_user',
  password: process.env.DB_PASSWORD || 'inventory_password',
  database: process.env.DB_NAME || 'smartstock',
  connectionLimit: 15,
  connectTimeout: 10000
});

let isDbReady = false;

// --- CRYPTO UTILS ---
const generateSignature = (payload) => crypto.createHmac('sha256', LICENSE_SECRET).update(payload).digest('hex');

const verifyLicense = (licenseKey, currentSystemId) => {
  if (!licenseKey || !licenseKey.includes('.')) return { valid: false, error: 'Missing' };
  const [payloadBase64, signature] = licenseKey.split('.');
  try {
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
    const payload = JSON.parse(payloadJson);
    if (signature !== generateSignature(payloadJson)) return { valid: false, error: 'Tampered' };
    if (new Date(payload.expiry) < new Date()) return { valid: false, error: 'Expired', payload };
    if (payload.sid !== currentSystemId) return { valid: false, error: 'ID Mismatch' };
    return { valid: true, payload };
  } catch (e) { return { valid: false, error: 'Invalid Format' }; }
};

// --- GATEKEEPER ---
const licenseGuard = async (req, res, next) => {
  const bypassPaths = ['/login', '/init-db'];
  if (bypassPaths.includes(req.path)) return next();
  
  if (req.path === '/settings' && req.method === 'GET') return next();

  if (!isDbReady && req.path !== '/settings') {
    return res.status(503).json({ error: 'System is initializing database.' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT license_key, system_id FROM settings WHERE id = ?', ['GLOBAL']);
    const settings = rows[0];
    
    if (req.path === '/settings' && req.method === 'POST') return next();

    const v = verifyLicense(settings?.license_key, settings?.system_id);
    if (!v.valid) {
      return res.status(403).json({ 
        error: 'License Required', 
        details: v.error, 
        code: 'LICENSE_INVALID',
        system_id: settings?.system_id 
      });
    }
    next();
  } catch (err) { 
    // If the database is completely down, we still want to allow login attempts (which handle their own DB errors)
    if (req.path === '/login') return next();
    res.status(500).json({ error: 'Internal Security Error', details: err.message }); 
  } finally { 
    if (conn) conn.release(); 
  }
};

const apiRouter = express.Router();
apiRouter.use(licenseGuard);
app.use('/api', apiRouter);

// --- DB INIT ---
const handleInitDb = async (conn) => {
  console.log("DB: Starting Schema Initialization...");
  
  await conn.query(`CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(50) PRIMARY KEY,
    software_name VARCHAR(255),
    primary_color VARCHAR(50),
    software_description TEXT,
    software_logo VARCHAR(50),
    license_key TEXT,
    license_expiry DATE,
    system_id VARCHAR(100)
  )`);

  await conn.query(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY, 
    username VARCHAR(50) UNIQUE, 
    password VARCHAR(100), 
    role VARCHAR(20), 
    full_name VARCHAR(100)
  )`);

  // Column Fixes
  try { await conn.query("ALTER TABLE settings ADD COLUMN system_id VARCHAR(100)"); } catch(e) {}

  // System ID Generation
  const rows = await conn.query("SELECT system_id FROM settings WHERE id = 'GLOBAL'");
  let sid = rows[0]?.system_id;

  if (!sid) {
    console.log("DB: Generating first-time System ID...");
    sid = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    const payload = JSON.stringify({ expiry: expiry.toISOString().split('T')[0], sid });
    const key = `${Buffer.from(payload).toString('base64')}.${generateSignature(payload)}`;
    
    await conn.query(`REPLACE INTO settings (id, software_name, primary_color, license_key, license_expiry, system_id) 
                     VALUES ('GLOBAL', 'SmartStock Pro', 'indigo', ?, ?, ?)`, 
                     [key, expiry.toISOString().split('T')[0], sid]);
  }

  // Admin Account
  await conn.query("REPLACE INTO users (id, username, password, role, full_name) VALUES ('U-001', 'admin', 'admin', 'ADMIN', 'System Administrator')");
  
  isDbReady = true;
  console.log("DB: Initialization Complete. System ID:", sid);
};

const initDbWithRetry = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    await handleInitDb(conn);
  } catch (err) { 
    console.error("DB: Connection failed. Check if MariaDB container is running. Retrying...", err.message);
    setTimeout(initDbWithRetry, 3000); 
  } finally { 
    if (conn) conn.release(); 
  }
};
initDbWithRetry();

// --- API ENDPOINTS ---

apiRouter.get('/settings', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM settings WHERE id = ?', ['GLOBAL']);
    
    // Emergency Init if table is empty
    if (rows.length === 0) {
      await handleInitDb(conn);
      const retryRows = await conn.query('SELECT * FROM settings WHERE id = ?', ['GLOBAL']);
      return res.json(retryRows[0] || {});
    }
    
    res.json(rows[0]);
  } catch (err) { 
    res.status(500).json({ error: 'DB_OFFLINE', details: err.message }); 
  } finally { if (conn) conn.release(); }
});

apiRouter.post('/settings', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { license_key } = req.body;
    if (license_key) {
      const rows = await conn.query('SELECT system_id FROM settings WHERE id = ?', ['GLOBAL']);
      const v = verifyLicense(license_key, rows[0].system_id);
      if (!v.valid) return res.status(400).json({ error: `Invalid Key: ${v.error}` });
      req.body.license_expiry = v.payload.expiry;
    }
    const keys = Object.keys(req.body).filter(k => k !== 'id');
    const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
    await conn.query(`UPDATE settings SET ${setClause} WHERE id = 'GLOBAL'`, Object.values(req.body));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
  finally { if (conn) conn.release(); }
});

apiRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT id, username, role, full_name FROM users WHERE username=? AND password=?', [username, password]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(401).json({ error: 'Incorrect username or password' });
    }
  } catch (err) { 
    res.status(500).json({ error: 'Database disconnected. Please check MariaDB.' }); 
  } finally { 
    if (conn) conn.release(); 
  }
});

const modules = ['items', 'movements', 'departments', 'employees', 'suppliers', 'locations', 'maintenance_logs', 'licenses', 'categories', 'requests', 'users', 'roles', 'notifications', 'attendance', 'salaries', 'leave_requests'];
modules.forEach(m => {
  apiRouter.get(`/${m}`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`SELECT * FROM \`${m}\``);
      res.json(Array.from(rows));
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { if (conn) conn.release(); }
  });
  apiRouter.post(`/${m}`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const keys = Object.keys(req.body);
      await conn.query(`REPLACE INTO \`${m}\` (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`, Object.values(req.body));
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { if (conn) conn.release(); }
  });
});

const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));
app.get('*', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`SmartStock API active on port ${port}`));
