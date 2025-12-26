
const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'inventory_user',
  password: process.env.DB_PASSWORD || 'inventory_password',
  database: process.env.DB_NAME || 'smartstock',
  connectionLimit: 10
});

// API Routes - MUST come before static file catch-all
app.get('/api/items', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM items ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ error: 'Database query failed' });
  } finally {
    if (conn) conn.release();
  }
});

app.post('/api/items', async (req, res) => {
  let conn;
  try {
    const { id, name, category, serial, status, location, assignedTo, department, purchaseDate, warranty, cost } = req.body;
    conn = await pool.getConnection();
    await conn.query(
      "INSERT INTO items (id, name, category, serial, status, location, assignedTo, department, purchaseDate, warranty, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=?, location=?, assignedTo=?, department=?, name=?, category=?, cost=?",
      [id, name, category, serial, status, location, assignedTo, department, purchaseDate, warranty, cost, status, location, assignedTo, department, name, category, cost]
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('Insert Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

app.put('/api/items/:id', async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { name, category, serial, status, location, assignedTo, department, purchaseDate, warranty, cost } = req.body;
    conn = await pool.getConnection();
    await conn.query(
      "UPDATE items SET name=?, category=?, serial=?, status=?, location=?, assignedTo=?, department=?, purchaseDate=?, warranty=?, cost=? WHERE id=?",
      [name, category, serial, status, location, assignedTo, department, purchaseDate, warranty, cost, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

app.delete('/api/items/:id', async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();
    await conn.query("DELETE FROM items WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/movements', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM movements ORDER BY date DESC LIMIT 50");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

app.get('/api/suppliers', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM suppliers");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

app.get('/api/locations', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM locations");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

app.get('/api/maintenance', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM maintenance_logs");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); } finally { if (conn) conn.release(); }
});

// Static Files & Catch-all
const staticPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'dist') 
  : path.join(__dirname, '.');

app.use(express.static(staticPath));

app.get('*', (req, res) => {
  // Prevent returning HTML for API calls that don't match
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexFile = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, 'dist', 'index.html')
    : path.join(__dirname, 'index.html');
  res.sendFile(indexFile);
});

app.listen(port, () => console.log(`SmartStock ERP Server running on port ${port} [${process.env.NODE_ENV || 'dev'}]`));
