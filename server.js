
const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

const LICENSE_SECRET = process.env.LICENSE_SECRET || 'smartstock_enterprise_master_key_2025';

app.use(cors());
app.use(express.json());

// FAST-PATH: Generate a System ID immediately in memory
// This ensures the frontend ALWAYS sees an ID even if MariaDB is still booting
let MEMORY_CACHE = {
  id: 'GLOBAL',
  software_name: 'SmartStock Pro',
  primary_color: 'indigo',
  system_id: crypto.createHash('md5').update(process.env.HOSTNAME || 'local-host').digest('hex').substring(0, 8).toUpperCase(),
  license_key: null,
  is_db_connected: false
};

const dbHost = process.env.DB_HOST && process.env.DB_HOST.trim() !== '' ? process.env.DB_HOST : '127.0.0.1';

const pool = mariadb.createPool({
  host: dbHost,
  user: process.env.DB_USER || 'inventory_user',
  password: process.env.DB_PASSWORD || 'inventory_password',
  database: process.env.DB_NAME || 'smartstock',
  connectionLimit: 30, // Increased for performance
  connectTimeout: 5000,
  acquireTimeout: 5000
});

const generateSignature = (payload) => crypto.createHmac('sha256', LICENSE_SECRET).update(payload).digest('hex');

const verifyLicense = (licenseKey, currentSystemId) => {
  if (!licenseKey || !licenseKey.includes('.')) return { valid: false, error: 'Missing' };
  const [payloadBase64, signature] = licenseKey.split('.');
  try {
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
    const payload = JSON.parse(payloadJson);
    if (signature !== generateSignature(payloadJson)) return { valid: false, error: 'Tampered' };
    if (new Date(payload.expiry) < new Date()) return { valid: false, error: 'Expired' };
    if (payload.sid !== currentSystemId) return { valid: false, error: 'ID Mismatch' };
    return { valid: true, payload };
  } catch (e) { return { valid: false, error: 'Invalid Format' }; }
};

// --- OPTIMIZED GATEKEEPER ---
// Uses MEMORY_CACHE for 0-ms latency checks
const licenseGuard = (req, res, next) => {
  const bypass = ['/login', '/init-db', '/settings', '/health'];
  if (bypass.some(p => req.path.includes(p))) return next();

  const v = verifyLicense(MEMORY_CACHE.license_key, MEMORY_CACHE.system_id);
  if (!v.valid) {
    return res.status(403).json({ 
      error: 'License Required', 
      code: 'LICENSE_INVALID',
      system_id: MEMORY_CACHE.system_id 
    });
  }
  next();
};

const apiRouter = express.Router();
apiRouter.use(licenseGuard);
app.use('/api', apiRouter);

// --- DB SYNC LOGIC ---
const syncMemoryToDb = async () => {
  if (!MEMORY_CACHE.is_db_connected) return;
  let conn;
  try {
    conn = await pool.getConnection();
    const keys = Object.keys(MEMORY_CACHE).filter(k => !['is_db_connected', 'id'].includes(k));
    const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
    await conn.query(`UPDATE settings SET ${setClause} WHERE id = 'GLOBAL'`, Object.values(keys.map(k => MEMORY_CACHE[k])));
  } catch (e) {
    console.error("Cache sync failed:", e.message);
  } finally {
    if (conn) conn.release();
  }
};

const initializeDb = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("DB: Connected. Initializing Schema...");
    
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

    // Fetch existing settings to populate memory
    const rows = await conn.query("SELECT * FROM settings WHERE id = 'GLOBAL'");
    if (rows.length > 0) {
      MEMORY_CACHE = { ...MEMORY_CACHE, ...rows[0], is_db_connected: true };
    } else {
      // First time setup
      await conn.query(`INSERT INTO settings (id, software_name, primary_color, system_id) 
                       VALUES ('GLOBAL', ?, ?, ?)`, 
                       [MEMORY_CACHE.software_name, MEMORY_CACHE.primary_color, MEMORY_CACHE.system_id]);
      MEMORY_CACHE.is_db_connected = true;
    }

    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY, 
      username VARCHAR(50) UNIQUE, 
      password VARCHAR(100), 
      role VARCHAR(20), 
      full_name VARCHAR(100)
    )`);
    
    await conn.query("REPLACE INTO users (id, username, password, role, full_name) VALUES ('U-001', 'admin', 'admin', 'ADMIN', 'System Administrator')");
    
    console.log("DB: Ready. System ID:", MEMORY_CACHE.system_id);
  } catch (err) {
    console.error("DB: Connection Error. Retrying in 3s...", err.message);
    setTimeout(initializeDb, 3000);
  } finally {
    if (conn) conn.release();
  }
};

initializeDb();

// --- ENDPOINTS ---

apiRouter.get('/settings', (req, res) => res.json(MEMORY_CACHE));

apiRouter.post('/settings', async (req, res) => {
  const { license_key } = req.body;
  if (license_key) {
    const v = verifyLicense(license_key, MEMORY_CACHE.system_id);
    if (!v.valid) return res.status(400).json({ error: `Invalid: ${v.error}` });
    req.body.license_expiry = v.payload.expiry;
  }
  
  // Update memory first for instant UI response
  MEMORY_CACHE = { ...MEMORY_CACHE, ...req.body };
  res.json({ success: true });
  
  // Sync to DB in background
  syncMemoryToDb();
});

apiRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT id, username, role, full_name FROM users WHERE username=? AND password=?', [username, password]);
    if (rows.length > 0) res.json(rows[0]);
    else res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) { res.status(500).json({ error: 'Database busy' }); }
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
    } catch (e) { res.status(500).json({ error: 'DB_BUSY' }); }
    finally { if (conn) conn.release(); }
  });
  apiRouter.post(`/${m}`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const keys = Object.keys(req.body);
      await conn.query(`REPLACE INTO \`${m}\` (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`, Object.values(req.body));
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'SAVE_ERROR' }); }
    finally { if (conn) conn.release(); }
  });
});

const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));
app.get('*', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`SmartStock API port ${port}`));
