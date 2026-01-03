
/**
 * SmartStock Pro Enterprise - GAS MariaDB Connector
 */

const DB_CONFIG = {
  host: 'YOUR_PUBLIC_IP_OR_HOSTNAME', 
  port: 3306,
  db: 'smartstock',
  user: 'inventory_user',
  pass: 'inventory_password'
};

function getConnection() {
  const url = `jdbc:mysql://${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.db}`;
  try {
    return Jdbc.getConnection(url, DB_CONFIG.user, DB_CONFIG.pass);
  } catch (e) {
    throw new Error("Database Connection Failed: " + e.message);
  }
}

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('SmartStock Pro | Enterprise')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function login(username, password) {
  const conn = getConnection();
  const stmt = conn.prepareStatement("SELECT id, username, role, full_name FROM users WHERE username = ? AND password = ?");
  stmt.setString(1, username);
  stmt.setString(2, password);
  const rs = stmt.executeQuery();
  
  let user = null;
  if (rs.next()) {
    user = {
      id: rs.getString("id"),
      username: rs.getString("username"),
      role: rs.getString("role"),
      full_name: rs.getString("full_name")
    };
  }
  
  rs.close();
  stmt.close();
  conn.close();
  
  if (!user) throw new Error("Invalid Credentials");
  return user;
}

function getSettings() {
  const conn = getConnection();
  const stmt = conn.createStatement();
  const rs = stmt.executeQuery("SELECT * FROM settings WHERE id = 'GLOBAL' LIMIT 1");
  
  let settings = null;
  
  if (rs.next()) {
    let sid = rs.getString("system_id");
    
    // SELF-HEALING: If row exists but system_id is blank, fix it now.
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 10).toUpperCase();
      const update = conn.prepareStatement("UPDATE settings SET system_id = ? WHERE id = 'GLOBAL'");
      update.setString(1, sid);
      update.executeUpdate();
      update.close();
    }

    settings = {
      id: rs.getString("id"),
      software_name: rs.getString("software_name"),
      primary_color: rs.getString("primary_color"),
      software_description: rs.getString("software_description"),
      software_logo: rs.getString("software_logo"),
      license_key: rs.getString("license_key"),
      license_expiry: rs.getString("license_expiry"),
      system_id: sid,
      is_db_connected: true
    };
  } else {
    const sid = Math.random().toString(36).substring(2, 10).toUpperCase();
    const insert = conn.prepareStatement("INSERT INTO settings (id, software_name, primary_color, system_id) VALUES ('GLOBAL', 'SmartStock Pro', 'indigo', ?)");
    insert.setString(1, sid);
    insert.executeUpdate();
    insert.close();
    settings = { 
      id: 'GLOBAL', 
      software_name: 'SmartStock Pro', 
      primary_color: 'indigo',
      system_id: sid,
      is_db_connected: true
    };
  }
  
  rs.close();
  stmt.close();
  conn.close();
  return settings;
}

function updateSettings(settings) {
  const conn = getConnection();
  const keys = Object.keys(settings).filter(k => k !== 'id' && k !== 'is_db_connected');
  const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
  
  const stmt = conn.prepareStatement(`UPDATE settings SET ${setClause} WHERE id = 'GLOBAL'`);
  keys.forEach((k, i) => {
    stmt.setObject(i + 1, settings[k]);
  });
  
  stmt.executeUpdate();
  stmt.close();
  conn.close();
  return { success: true };
}

function getModuleData(tableName) {
  const conn = getConnection();
  const stmt = conn.createStatement();
  const rs = stmt.executeQuery(`SELECT * FROM \`${tableName}\``);
  const results = [];
  const meta = rs.getMetaData();
  const colCount = meta.getColumnCount();
  
  while (rs.next()) {
    const row = {};
    for (let i = 1; i <= colCount; i++) {
      const colName = meta.getColumnName(i);
      row[colName] = rs.getObject(i);
    }
    results.push(row);
  }
  
  rs.close();
  stmt.close();
  conn.close();
  return results;
}

function saveModuleData(tableName, entity) {
  const conn = getConnection();
  const keys = Object.keys(entity);
  const cols = keys.map(k => `\`${k}\``).join(', ');
  const placeholders = keys.map(() => '?').join(', ');
  const updateClause = keys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(', ');

  const sql = `INSERT INTO \`${tableName}\` (${cols}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
  const stmt = conn.prepareStatement(sql);
  
  keys.forEach((k, i) => {
    stmt.setObject(i + 1, entity[k]);
  });
  
  stmt.executeUpdate();
  stmt.close();
  conn.close();
  return { success: true };
}

function deleteModuleData(tableName, id) {
  const conn = getConnection();
  const stmt = conn.prepareStatement(`DELETE FROM \`${tableName}\` WHERE id = ?`);
  stmt.setString(1, id);
  stmt.executeUpdate();
  stmt.close();
  conn.close();
  return { success: true };
}
