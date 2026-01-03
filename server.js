
const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Security Secret - In production, this should be an environment variable
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

const verifyLicense = (licenseKey) => {
  if (!licenseKey || !licenseKey.includes('.')) return { valid: false, error: 'Malformed Key' };
  
  const [payloadBase64, signature] = licenseKey.split('.');
  const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
  
  try {
    const payload = JSON.parse(payloadJson);
    const expectedSignature = generateSignature(payloadJson);
    
    if (signature !== expectedSignature) return { valid: false, error: 'Signature Mismatch' };
    
    const expiry = new Date(payload.expiry);
    if (expiry < new Date()) return { valid: false, error: 'License Expired', payload };
    
    return { valid: true, payload };
  } catch (e) {
    return { valid: false, error: 'Invalid Payload' };
  }
};

// --- MIDDLEWARE: THE GATEKEEPER ---

const licenseGuard = async (req, res, next) => {
  // Allow login and settings (to update license) without restriction
  if (req.path === '/api/login' || req.path === '/api/settings' || req.path === '/api/init-db') {
    return next();
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT license_key FROM settings WHERE id = ?', ['GLOBAL']);
    const license = rows[0]?.license_key;
    
    const verification = verifyLicense(license);
    if (!verification.valid) {
      return res.status(403).json({ 
        error: 'License Validation Failed', 
        details: verification.error,
        code: 'LICENSE_INVALID' 
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'System Authorization Error' });
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
    )`
    // ... other tables remain same as before
  ];
  
  for (const q of queries) await conn.query(q);

  // Generate a unique System ID for this installation if not exists
  const systemId = crypto.randomBytes(8).toString('hex').toUpperCase();
  
  // Generate a signed 30-day trial license for first boot
  const trialExpiry = new Date();
  trialExpiry.setDate(trialExpiry.getDate() + 30);
  const trialPayload = JSON.stringify({ expiry: trialExpiry.toISOString().split('T')[0], sid: systemId });
  const trialKey = `${Buffer.from(trialPayload).toString('base64')}.${generateSignature(trialPayload)}`;

  await conn.query(`INSERT IGNORE INTO settings (id, software_name, primary_color, software_description, software_logo, license_key, license_expiry, system_id) 
                   VALUES ('GLOBAL', 'Enterprise Inventory', 'indigo', 'Secure Asset Registry', 'fa-warehouse', ?, ?, ?)`, 
                   [trialKey, trialExpiry.toISOString().split('T')[0], systemId]);
};

// ... Rest of server.js CRUD logic remains same, but now protected by licenseGuard ...

const modules = ['items', 'movements', 'departments', 'employees', 'suppliers', 'locations', 'maintenance_logs', 'licenses', 'categories', 'requests', 'users', 'roles', 'notifications', 'user_logs', 'attendance', 'salaries', 'leave_requests'];

const initDbWithRetry = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    await handleInitDb(conn);
    isDbReady = true;
  } catch (err) {
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
    
    // If updating license, verify it first before saving
    if (license_key) {
      const v = verifyLicense(license_key);
      if (!v.valid) return res.status(400).json({ error: `Invalid License Signature: ${v.error}` });
    }

    const keys = Object.keys(req.body);
    const values = keys.map(k => req.body[k]);
    const placeholders = keys.map(() => '?').join(', ');
    await conn.query(`REPLACE INTO settings (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${placeholders})`, values);
    res.json({ success: true });
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
  // ... other POST/DELETE handlers ...
};
modules.forEach(handleCRUD);

const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));
app.get('*', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`Secure API on ${port}`));
