
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

// --- API Endpoints ---

/**
 * Initialize Database Schema
 */
app.post('/api/init-db', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Create tables one by one for better control
    const queries = [
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
      `CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        department VARCHAR(100),
        role VARCHAR(100)
      )`,
      `CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        head VARCHAR(255),
        budget DECIMAL(15, 2) DEFAULT 0
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

    sendJSON(res, { success: true, message: 'Database schema successfully verified/initialized' });
  } catch (err) {
    console.error('Init DB Error:', err);
    sendJSON(res, { error: err.message }, 500);
  } finally {
    if (conn) conn.release();
  }
});

// Generic CRUD handlers
const handleCRUD = (tableName) => {
  // GET all
  app.get(`/api/${tableName}`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`SELECT * FROM ${tableName}`);
      sendJSON(res, Array.from(rows));
    } catch (err) { 
      console.error(`Error fetching ${tableName}:`, err);
      sendJSON(res, { error: err.message }, 500); 
    }
    finally { if (conn) conn.release(); }
  });

  // POST (Insert or Update)
  app.post(`/api/${tableName}`, async (req, res) => {
    let conn;
    try {
      const keys = Object.keys(req.body);
      if (keys.length === 0) return sendJSON(res, { error: "Empty body" }, 400);

      // Clean values: Convert empty strings to null for database compatibility (especially for INT/DATE columns)
      const values = Object.values(req.body).map(v => v === '' ? null : v);
      const placeholders = keys.map(() => '?').join(', ');
      const updates = keys.map(k => `${k}=VALUES(${k})`).join(', ');
      
      conn = await pool.getConnection();
      const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`;
      await conn.query(query, values);
      
      sendJSON(res, { success: true }, 201);
    } catch (err) { 
      console.error(`Error saving to ${tableName}:`, err);
      sendJSON(res, { error: err.message }, 500); 
    }
    finally { if (conn) conn.release(); }
  });

  // DELETE
  app.delete(`/api/${tableName}/:id`, async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();
      // Most tables use 'id' as primary key
      await conn.query(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
      sendJSON(res, { success: true });
    } catch (err) { 
      console.error(`Error deleting from ${tableName}:`, err);
      sendJSON(res, { error: err.message }, 500); 
    }
    finally { if (conn) conn.release(); }
  });
};

// Register routes for all modules
const modules = [
  'items', 
  'movements', 
  'suppliers', 
  'locations', 
  'maintenance_logs', 
  'categories', 
  'employees', 
  'departments', 
  'licenses', 
  'requests'
];

modules.forEach(handleCRUD);

// Static file serving
const staticPath = path.join(__dirname, 'dist');
app.use(express.static(staticPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).send(JSON.stringify({ error: `API endpoint ${req.url} not found.` }));
  }
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`SmartStock ERP Server Active on port ${port}`);
});
