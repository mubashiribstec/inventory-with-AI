
const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Security secret for license signing
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'smartstock_enterprise_master_key_2025';

app.use(cors());
app.use(express.json());

// Global Memory Cache for rapid access
let MEMORY_CACHE = {
  id: 'GLOBAL',
  software_name: 'SmartStock Pro',
  primary_color: 'indigo',
  system_id: null,
  license_key: null,
  license_expiry: null,
  is_db_connected: false,
  software_description: 'Enterprise Resource Planning',
  software_logo: 'fa-warehouse'
};

// MariaDB Connection Pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'inventory_user',
  password: process.env.DB_PASSWORD || 'inventory_password',
  database: process.env.DB_NAME || 'smartstock',
  connectionLimit: 30,
  acquireTimeout: 10000
});

// Helper: Generate License Signature
const generateSignature = (payload) => crypto.createHmac('sha256', LICENSE_SECRET).update(payload).digest('hex');

// Helper: Verify License Key
const verifyLicense = (licenseKey, currentSystemId) => {
  if (!licenseKey || !licenseKey.includes('.')) return { valid: false, error: 'Malformed Key' };
  const [payloadBase64, signature] = licenseKey.split('.');
  try {
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
    const payload = JSON.parse(payloadJson);
    if (signature !== generateSignature(payloadJson)) return { valid: false, error: 'Tamper Detected' };
    if (new Date(payload.expiry) < new Date()) return { valid: false, error: 'License Expired' };
    if (payload.sid !== currentSystemId) return { valid: false, error: 'System ID Mismatch' };
    return { valid: true, payload };
  } catch (e) { return { valid: false, error: 'Invalid Payload' }; }
};

// Middleware: Verify License
const licenseGuard = (req, res, next) => {
  const publicPaths = ['/login', '/settings', '/health'];
  if (publicPaths.some(p => req.path.includes(p))) return next();
  if (!MEMORY_CACHE.system_id) return res.status(503).json({ error: 'System initializing' });

  const v = verifyLicense(MEMORY_CACHE.license_key, MEMORY_CACHE.system_id);
  if (!v.valid) return res.status(403).json({ error: 'License Required', system_id: MEMORY_CACHE.system_id });
  next();
};

const apiRouter = express.Router();
apiRouter.use(licenseGuard);
app.use('/api', apiRouter);

/**
 * Enterprise Database Schema Synchronizer
 * Ensures HR, Inventory, and Settings tables are identical across all deployments.
 */
const initializeDb = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("MariaDB: Syncing Modular Schema...");

    // 1. Settings Module
    await conn.query(`CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(50) PRIMARY KEY,
      software_name VARCHAR(255) DEFAULT 'SmartStock Pro',
      primary_color VARCHAR(50) DEFAULT 'indigo'
    )`);

    const setCols = await conn.query("SHOW COLUMNS FROM settings");
    const setColNames = setCols.map(c => c.Field);
    const setReq = [
      { name: 'license_key', type: 'TEXT' },
      { name: 'license_expiry', type: 'DATE' },
      { name: 'system_id', type: 'VARCHAR(100)' },
      { name: 'software_description', type: 'TEXT' },
      { name: 'software_logo', type: 'VARCHAR(255)' }
    ];
    for (const col of setReq) {
      if (!setColNames.includes(col.name)) {
        await conn.query(`ALTER TABLE settings ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Migration: Added Settings column [${col.name}]`);
      }
    }

    // 2. HR Module: Users & Hierarchy
    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY, 
      username VARCHAR(50) UNIQUE, 
      password VARCHAR(100), 
      role VARCHAR(20), 
      full_name VARCHAR(100),
      department VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE
    )`);
    
    const userCols = await conn.query("SHOW COLUMNS FROM users");
    const userColNames = userCols.map(c => c.Field);
    const userReq = [
      { name: 'shift_start_time', type: 'VARCHAR(10) DEFAULT "09:00"' },
      { name: 'team_lead_id', type: 'VARCHAR(50)' },
      { name: 'manager_id', type: 'VARCHAR(50)' },
      { name: 'joining_date', type: 'DATE' },
      { name: 'designation', type: 'VARCHAR(100)' }
    ];
    for (const col of userReq) {
      if (!userColNames.includes(col.name)) {
        await conn.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Migration: Added HR column [${col.name}] to Users`);
      }
    }

    // 3. HR Module: Attendance & Leave
    await conn.query(`CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(50),
      username VARCHAR(100),
      date DATE,
      check_in DATETIME,
      check_out DATETIME,
      status VARCHAR(20),
      location VARCHAR(100)
    )`);

    await conn.query(`CREATE TABLE IF NOT EXISTS leave_requests (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50),
      username VARCHAR(100),
      start_date DATE,
      end_date DATE,
      leave_type VARCHAR(20),
      reason TEXT,
      status VARCHAR(20) DEFAULT 'PENDING'
    )`);

    // 4. Inventory Module
    await conn.query(`CREATE TABLE IF NOT EXISTS items (
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
      cost DECIMAL(15, 2)
    )`);

    // 5. Global Identity Logic
    const rows = await conn.query("SELECT * FROM settings WHERE id = 'GLOBAL'");
    if (rows.length > 0) {
      let dbSettings = rows[0];
      if (!dbSettings.system_id) {
        const sid = crypto.randomBytes(4).toString('hex').toUpperCase();
        await conn.query("UPDATE settings SET system_id = ? WHERE id = 'GLOBAL'", [sid]);
        dbSettings.system_id = sid;
      }
      MEMORY_CACHE = { 
        ...MEMORY_CACHE, 
        ...dbSettings,
        license_expiry: dbSettings.license_expiry ? new Date(dbSettings.license_expiry).toISOString().split('T')[0] : null,
        is_db_connected: true 
      };
    } else {
      const sid = crypto.randomBytes(4).toString('hex').toUpperCase();
      await conn.query(`INSERT INTO settings (id, software_name, primary_color, system_id, software_description, software_logo) VALUES ('GLOBAL', ?, ?, ?, ?, ?)`, 
                       [MEMORY_CACHE.software_name, MEMORY_CACHE.primary_color, sid, MEMORY_CACHE.software_description, MEMORY_CACHE.software_logo]);
      MEMORY_CACHE.system_id = sid;
      MEMORY_CACHE.is_db_connected = true;
    }

    // 6. Root User Safety
    await conn.query("REPLACE INTO users (id, username, password, role, full_name, is_active) VALUES ('U-001', 'admin', 'admin', 'ADMIN', 'System Administrator', 1)");

    console.log("MariaDB: Initialization Complete.");
  } catch (err) {
    console.error("MariaDB Setup Failed:", err.message);
    setTimeout(initializeDb, 5000); 
  } finally {
    if (conn) conn.release();
  }
};

initializeDb();

app.get('/health', (req, res) => res.json({ status: 'ok', db: MEMORY_CACHE.is_db_connected, sid: MEMORY_CACHE.system_id }));

apiRouter.get('/settings', (req, res) => res.json(MEMORY_CACHE));

apiRouter.post('/settings', async (req, res) => {
  let conn;
  try {
    const { license_key } = req.body;
    if (license_key) {
      const v = verifyLicense(license_key, MEMORY_CACHE.system_id);
      if (!v.valid) return res.status(400).json({ error: `Verification Failed: ${v.error}` });
      req.body.license_expiry = v.payload.expiry;
    }
    conn = await pool.getConnection();
    const updates = Object.keys(req.body).filter(k => k !== 'id' && k !== 'is_db_connected');
    if (updates.length > 0) {
      const setClause = updates.map(k => `\`${k}\` = ?`).join(', ');
      const values = updates.map(k => req.body[k]);
      await conn.query(`UPDATE settings SET ${setClause} WHERE id = 'GLOBAL'`, values);
    }
    MEMORY_CACHE = { ...MEMORY_CACHE, ...req.body };
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    if (conn) conn.release();
  }
});

apiRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM users WHERE username=? AND password=?', [username, password]);
    if (rows.length > 0) res.json(rows[0]);
    else res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) { res.status(500).json({ error: 'DB Error' }); }
  finally { if (conn) conn.release(); }
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
      const values = Object.values(req.body);
      await conn.query(`REPLACE INTO \`${m}\` (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`, values);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { if (conn) conn.release(); }
  });
  apiRouter.delete(`/${m}/:id`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(`DELETE FROM \`${m}\` WHERE id = ?`, [req.params.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { if (conn) conn.release(); }
  });
});

const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));
app.get('*', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`Modular Enterprise Server active on ${port}`));
