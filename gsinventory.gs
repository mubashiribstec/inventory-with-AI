
/**
 * SmartStock Pro Enterprise - GAS MariaDB Connector
 * -----------------------------------------------
 * Requires the MariaDB instance to be publicly accessible.
 */

// Database Configuration - UPDATE THESE WITH YOUR ACTUAL ACCESS DETAILS
const DB_CONFIG = {
  host: 'YOUR_PUBLIC_IP_OR_HOSTNAME', 
  port: 3306,
  db: 'smartstock',
  user: 'inventory_user',
  pass: 'inventory_password'
};

function getConnection() {
  const url = `jdbc:mysql://${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.db}`;
  return Jdbc.getConnection(url, DB_CONFIG.user, DB_CONFIG.pass);
}

/**
 * Serves the web application
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('inventory')
    .evaluate()
    .setTitle('SmartStock Pro | Enterprise')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Fetch Custom Settings from MariaDB
 */
function getGlobalSettings() {
  const conn = getConnection();
  const stmt = conn.createStatement();
  const rs = stmt.executeQuery("SELECT * FROM settings WHERE id = 'GLOBAL' LIMIT 1");
  
  let settings = { id: 'GLOBAL', software_name: 'SmartStock Pro', primary_color: 'indigo' };
  
  if (rs.next()) {
    settings = {
      id: rs.getString("id"),
      software_name: rs.getString("software_name"),
      primary_color: rs.getString("primary_color"),
      software_description: rs.getString("software_description"),
      software_logo: rs.getString("software_logo")
    };
  }
  
  rs.close();
  stmt.close();
  conn.close();
  return settings;
}

/**
 * Universal Delete from MariaDB
 */
function apiDelete(tableName, id) {
  const conn = getConnection();
  const stmt = conn.prepareStatement(`DELETE FROM ${tableName} WHERE id = ?`);
  stmt.setString(1, id);
  stmt.executeUpdate();
  stmt.close();
  conn.close();
  return { success: true };
}

/**
 * Logic for Departments and other tables
 */
function apiUpsert(tableName, entity) {
  const conn = getConnection();
  const id = entity.id;
  
  // Check existence
  const checkStmt = conn.prepareStatement(`SELECT 1 FROM ${tableName} WHERE id = ?`);
  checkStmt.setString(1, id);
  const exists = checkStmt.executeQuery().next();
  checkStmt.close();

  if (exists) {
    // Update logic (Dynamic SQL generation)
    const keys = Object.keys(entity).filter(k => k !== 'id');
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const updateStmt = conn.prepareStatement(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`);
    keys.forEach((k, i) => updateStmt.setObject(i + 1, entity[k]));
    updateStmt.setString(keys.length + 1, id);
    updateStmt.executeUpdate();
    updateStmt.close();
  } else {
    // Insert logic
    const keys = Object.keys(entity);
    const cols = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const insertStmt = conn.prepareStatement(`INSERT INTO ${tableName} (${cols}) VALUES (${placeholders})`);
    keys.forEach((k, i) => insertStmt.setObject(i + 1, entity[k]));
    insertStmt.executeUpdate();
    insertStmt.close();
  }
  
  conn.close();
  return { success: true };
}
