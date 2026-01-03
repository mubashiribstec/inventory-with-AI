
const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Secret for signing licenses (must match the key generator)
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'smartstock_enterprise_master_key_2025';

app.use(cors());
app.use(express.json());

// Hot cache for system state
let MEMORY_CACHE = {
  id: 'GLOBAL',
  software_name: 'SmartStock Pro',
  primary_color: 'indigo',
  system_id: null,
  license_key: null,
  license_expiry: null,
  is_db_connected: false
};

const pool = mariadb.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'inventory_user',
  password: process.env.DB_PASSWORD || 'inventory_password',
  database: process.env.DB_NAME || 'smartstock',
  connectionLimit: 30
});

const generateSignature = (payload) => crypto.createHmac('sha256', LICENSE_SECRET).update(payload).digest('hex');

const verifyLicense = (licenseKey, currentSystemId) => {
  if (!licenseKey || !licenseKey.includes('.')) return { valid: false, error: 'Malformed' };
  const [payloadBase64, signature] = licenseKey.split('.');
  try {
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
    const payload = JSON.parse(payloadJson);
    if (signature !== generateSignature(payloadJson)) return { valid: false, error: 'Tampered' };
    if (new Date(payload.expiry) < new Date()) return { valid: false, error: 'Expired' };
    if (payload.sid !== currentSystemId) return { valid: false, error: 'System ID Mismatch' };
    return { valid: true, payload };
  } catch (e) { return { valid: false, error: 'Invalid Format' }; }
};

// Guard middleware
const licenseGuard = (req, res, next) => {
  const publicPaths = ['/login', '/settings', '/health'];
  if (publicPaths.some(p => req.path.includes(p))) return next();

  if (!MEMORY_CACHE.system_id) return res.status(503).json({ error: 'System Identity initializing' });

  const v = verifyLicense(MEMORY_CACHE.license_key, MEMORY_CACHE.system_id);
  if (!v.valid) {
    return res.status(403).json({ 
      error: 'License Invalid', 
      system_id: MEMORY_CACHE.system_id 
    });
  }
  next();
};

const apiRouter = express.Router();
apiRouter.use(licenseGuard);
app.use('/api', apiRouter);

const initializeDb = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("MariaDB: Connected.");

    // Create Settings Table
    await conn.query(`CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(50) PRIMARY KEY,
      software_name VARCHAR(255),
      primary_color VARCHAR(50),
      license_key TEXT,
      license_expiry DATE,
      system_id VARCHAR(100)
    )`);

    // Load or Initialize System ID
    const rows = await conn.query("SELECT * FROM settings WHERE id = 'GLOBAL'");
    if (rows.length > 0) {
      MEMORY_CACHE = { ...MEMORY_CACHE, ...rows[0], is_db_connected: true };
      console.log("System Identity Loaded:", MEMORY_CACHE.system_id);
    } else {
      const sid = crypto.randomBytes(4).toString('hex').toUpperCase();
      await conn.query(`INSERT INTO settings (id, software_name, primary_color, system_id) VALUES ('GLOBAL', ?, ?, ?)`, 
                       [MEMORY_CACHE.software_name, MEMORY_CACHE.primary_color, sid]);
      MEMORY_CACHE.system_id = sid;
      MEMORY_CACHE.is_db_connected = true;
      console.log("New System ID Generated:", sid);
    }

    // Ensure User table
    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY, 
      username VARCHAR(50) UNIQUE, 
      password VARCHAR(100), 
      role VARCHAR(20), 
      full_name VARCHAR(100)
    )`);
    await conn.query("REPLACE INTO users (id, username, password, role, full_name) VALUES ('U-001', 'admin', 'admin', 'ADMIN', 'System Administrator')");

  } catch (err) {
    console.error("DB Init Error:", err.message);
    setTimeout(initializeDb, 5000);
  } finally {
    if (conn) conn.release();
  }
};

initializeDb();

// Endpoints
apiRouter.get('/settings', (req, res) => res.json(MEMORY_CACHE));

apiRouter.post('/settings', async (req, res) => {
  let conn;
  try {
    const { license_key, software_name, primary_color } = req.body;
    
    if (license_key) {
      const v = verifyLicense(license_key, MEMORY_CACHE.system_id);
      if (!v.valid) return res.status(400).json({ error: `Verification Failed: ${v.error}` });
      req.body.license_expiry = v.payload.expiry;
    }

    conn = await pool.getConnection();
    const updates = Object.keys(req.body).filter(k => k !== 'id');
    const setClause = updates.map(k => `\`${k}\` = ?`).join(', ');
    const values = updates.map(k => req.body[k]);
    
    await conn.query(`UPDATE settings SET ${setClause} WHERE id = 'GLOBAL'`, values);
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
    const rows = await conn.query('SELECT id, username, role, full_name FROM users WHERE username=? AND password=?', [username, password]);
    if (rows.length > 0) res.json(rows[0]);
    else res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) { res.status(500).json({ error: 'DB Error' }); }
  finally { if (conn) conn.release(); }
});

// Generic Module Routes
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

app.listen(port, '0.0.0.0', () => console.log(`SmartStock Server on port ${port}`));
