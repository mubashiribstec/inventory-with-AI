const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In production, serve the compiled 'dist' folder created by Vite
const staticPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'dist') 
  : path.join(__dirname, '.');

app.use(express.static(staticPath));

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'inventory_user',
  password: process.env.DB_PASSWORD || 'inventory_password',
  database: process.env.DB_NAME || 'smartstock',
  connectionLimit: 10
});

// Assets API
app.get('/api/items', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM items ORDER BY id DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

app.post('/api/items', async (req, res) => {
  let conn;
  try {
    const { id, name, category, serial, status, location_id, supplier_id, assignedTo, department, purchaseDate, warranty, cost } = req.body;
    conn = await pool.getConnection();
    await conn.query(
      "INSERT INTO items (id, name, category, serial, status, location_id, supplier_id, assignedTo, department, purchaseDate, warranty, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=?, location_id=?, assignedTo=?, department=?",
      [id, name, category, serial, status, location_id, supplier_id, assignedTo, department, purchaseDate, warranty, cost, status, location_id, assignedTo, department]
    );
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

// ERP: Suppliers API
app.get('/api/suppliers', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM suppliers");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

// ERP: Locations API
app.get('/api/locations', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM locations");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

// ERP: Licenses API
app.get('/api/licenses', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM licenses");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

// ERP: Maintenance Logs
app.get('/api/maintenance', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT m.*, i.name as item_name FROM maintenance_logs m JOIN items i ON m.item_id = i.id");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

app.post('/api/maintenance', async (req, res) => {
  let conn;
  try {
    const { item_id, issue_type, description, status, cost, start_date } = req.body;
    conn = await pool.getConnection();
    await conn.query(
      "INSERT INTO maintenance_logs (item_id, issue_type, description, status, cost, start_date) VALUES (?, ?, ?, ?, ?, ?)",
      [item_id, issue_type, description, status, cost, start_date]
    );
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

// Movements
app.get('/api/movements', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM movements ORDER BY date DESC LIMIT 50");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

app.post('/api/movements', async (req, res) => {
  let conn;
  try {
    const { id, date, item, from, to, employee, department, status } = req.body;
    conn = await pool.getConnection();
    await conn.query("INSERT INTO movements (id, date, item, `from`, `to`, employee, department, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, date, item, from, to, employee, department, status]);
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

// Serve index.html for any unknown routes (SPA support)
app.get('*', (req, res) => {
  const indexFile = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, 'dist', 'index.html')
    : path.join(__dirname, 'index.html');
  res.sendFile(indexFile);
});

app.listen(port, () => console.log(`SmartStock ERP Server Active on port ${port} [Mode: ${process.env.NODE_ENV || 'development'}]`));