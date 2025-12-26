
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

// Request Logging Middleware for Debugging 404s
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware to enforce JSON content type for all /api routes
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

const sendJSON = (res, data, status = 200) => {
  return res.status(status).send(JSON.stringify(data));
};

// --- API Endpoints ---

app.get('/api/items', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM items ORDER BY id DESC");
    sendJSON(res, Array.from(rows));
  } catch (err) {
    console.error('Fetch Items Error:', err);
    sendJSON(res, { error: 'Database fetch failed: ' + err.message }, 500);
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
    sendJSON(res, { success: true, id }, 201);
  } catch (err) {
    console.error('Save Item Error:', err);
    sendJSON(res, { error: err.message }, 500);
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
    sendJSON(res, { success: true });
  } catch (err) {
    console.error('Update Item Error:', err);
    sendJSON(res, { error: err.message }, 500);
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
    sendJSON(res, { success: true });
  } catch (err) {
    console.error('Delete Item Error:', err);
    sendJSON(res, { error: err.message }, 500);
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/movements', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM movements ORDER BY date DESC LIMIT 50");
    sendJSON(res, Array.from(rows));
  } catch (err) { 
    sendJSON(res, { error: err.message }, 500); 
  } finally { 
    if (conn) conn.release(); 
  }
});

app.get('/api/suppliers', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM suppliers");
    sendJSON(res, Array.from(rows));
  } catch (err) { 
    sendJSON(res, { error: err.message }, 500); 
  } finally { 
    if (conn) conn.release(); 
  }
});

app.get('/api/locations', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM locations");
    sendJSON(res, Array.from(rows));
  } catch (err) { 
    sendJSON(res, { error: err.message }, 500); 
  } finally { 
    if (conn) conn.release(); 
  }
});

app.get('/api/maintenance', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM maintenance_logs");
    sendJSON(res, Array.from(rows));
  } catch (err) { 
    sendJSON(res, { error: err.message }, 500); 
  } finally { 
    if (conn) conn.release(); 
  }
});

// --- Static Assets & Routing ---

const staticPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'dist') 
  : path.join(__dirname, '.');

app.use(express.static(staticPath));

// Catch-all to handle SPA routing or 404s for missing API endpoints
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).send(JSON.stringify({ error: `API endpoint ${req.url} not found on this server.` }));
  }
  const indexFile = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, 'dist', 'index.html')
    : path.join(__dirname, 'index.html');
  res.sendFile(indexFile);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`SmartStock ERP Server Active on port ${port} [ENV: ${process.env.NODE_ENV || 'development'}]`);
});
