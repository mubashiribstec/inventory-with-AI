
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

// Global Memory Cache
let MEMORY_CACHE = {
  id: 'GLOBAL',
  software_name: 'SmartStock Pro',
  primary_color: 'indigo',
  system_id: null,
  license_key: null,
  license_expiry: null,
  is_db_connected: false
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

// Middleware: Verify License for all API calls except public ones
const licenseGuard = (req, res, next) => {
  const publicPaths = ['/login', '/settings', '/health'];
  if (publicPaths.some(p => req.path.includes(p))) return next();

  if (!MEMORY_CACHE.system_id) {
    return res.status(503).json({ error: 'System Identity initializing' });
  }

  const v = verifyLicense(MEMORY_CACHE.license_key, MEMORY_CACHE.system_id);
  if (!v.valid) {
    return res.status(403).json({ 
      error: 'License Required', 
      system_id: MEMORY_CACHE.system_id 
    });
  }
  next();
};

const apiRouter = express.Router();
apiRouter.use(licenseGuard);
app.use('/api', apiRouter);

/**
 * Database Initialization
 * Ensures tables exist and a unique System ID is generated and SAVED.
 */
const initializeDb = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("MariaDB: Initializing Core Services...");

    // 1. Create Settings Table
    await conn.query(`CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(50) PRIMARY KEY,
      software_name VARCHAR(255),
      primary_color VARCHAR(50),
      license_key TEXT,
      license_expiry DATE,
      system_id VARCHAR(100)
    )`);

    // 2. Fetch or Generate System Identity
    const rows = await conn.query("SELECT * FROM settings WHERE id = 'GLOBAL'");
    
    if (rows.length > 0) {
      let dbSettings = rows[0];
      
      // If system_id is missing in existing row, generate it now
      if (!dbSettings.system_id) {
        const sid = crypto.randomBytes(4).toString('hex').toUpperCase();
        await conn.query("UPDATE settings SET system_id = ? WHERE id = 'GLOBAL'", [sid]);
        dbSettings.system_id = sid;
        console.log("SUCCESS: Created missing System ID for existing row:", sid);
      }

      MEMORY_CACHE = { 
        ...MEMORY_CACHE, 
        ...dbSettings,
        license_expiry: dbSettings.license_expiry ? new Date(dbSettings.license_expiry).toISOString().split('T')[0] : null,
        is_db_connected: true 
      };
    } else {
      const sid = crypto.randomBytes(4).toString('hex').toUpperCase();
      await conn.query(`INSERT INTO settings (id, software_name, primary_color, system_id) VALUES ('GLOBAL', ?, ?, ?)`, 
                       [MEMORY_CACHE.software_name, MEMORY_CACHE.primary_color, sid]);
      MEMORY_CACHE.system_id = sid;
      MEMORY_CACHE.is_db_connected = true;
      console.log("SUCCESS: Provisioned New System ID:", sid);
    }

    // 3. Ensure Default Admin User
    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY, 
      username VARCHAR(50) UNIQUE, 
      password VARCHAR(100), 
      role VARCHAR(20), 
      full_name VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE
    )`);
    await conn.query("REPLACE INTO users (id, username, password, role, full_name, is_active) VALUES ('U-001', 'admin', 'admin', 'ADMIN', 'System Administrator', 1)");

    console.log("MariaDB: All modules synchronized. System ID is persistent.");
  } catch (err) {
    console.error("CRITICAL ERROR: MariaDB Initialization Failed:", err.message);
    setTimeout(initializeDb, 5000); // Retry loop
  } finally {
    if (conn) conn.release();
  }
};

initializeDb();

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok', db: MEMORY_CACHE.is_db_connected, sid: MEMORY_CACHE.system_id }));

/**
 * Settings Endpoints
 */
apiRouter.get('/settings', async (req, res) => {
  // If memory cache is somehow stale, attempt a final DB refresh
  if (!MEMORY_CACHE.system_id) {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query("SELECT * FROM settings WHERE id = 'GLOBAL'");
      if (rows.length > 0) {
        MEMORY_CACHE = { ...MEMORY_CACHE, ...rows[0], is_db_connected: true };
      }
    } catch(e) {} finally { if (conn) conn.release(); }
  }
  res.json(MEMORY_CACHE);
});

apiRouter.post('/settings', async (req, res) => {
  let conn;
  try {
    const { license_key, software_name, primary_color } = req.body;
    
    // Verification step if license is being updated
    if (license_key) {
      const v = verifyLicense(license_key, MEMORY_CACHE.system_id);
      if (!v.valid) return res.status(400).json({ error: `Verification Failed: ${v.error}` });
      req.body.license_expiry = v.payload.expiry;
    }

    conn = await pool.getConnection();
    const updates = Object.keys(req.body).filter(k => k !== 'id' && k !== 'is_db_connected');
    const setClause = updates.map(k => `\`${k}\` = ?`).join(', ');
    const values = updates.map(k => req.body[k]);
    
    if (updates.length > 0) {
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

/**
 * Auth & Dynamic Module Routing
 */
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

// Serve Frontend
const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));
app.get('*', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`SmartStock Enterprise Server listening on port ${port}`));
