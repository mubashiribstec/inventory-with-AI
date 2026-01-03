
/**
 * SmartStock Pro Enterprise - Google Apps Script Backend Controller (v1.6)
 * -----------------------------------------------------------------------
 * Handles global persistence across all browsers and devices.
 */

const DB_FILE_NAME = "smartstock_enterprise_db.json";

/**
 * Entry point: Serves the Web Application
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('SmartStock Pro | Enterprise ERP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper: Find or Create the central JSON database file in Google Drive
 */
function getDbFile() {
  const files = DriveApp.getFilesByName(DB_FILE_NAME);
  if (files.hasNext()) {
    return files.next();
  }
  return createInitialDatabase();
}

/**
 * ATOMIC READ: Parses the central database
 */
function readDb() {
  const file = getDbFile();
  const content = file.getBlob().getDataAsString();
  try {
    return JSON.parse(content);
  } catch (e) {
    return createInitialDatabase(true); 
  }
}

/**
 * ATOMIC WRITE: Saves data back to Google Drive with concurrency protection
 */
function writeDb(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    const file = getDbFile();
    file.setContent(JSON.stringify(data, null, 2));
    lock.releaseLock();
    return { success: true };
  } catch (e) {
    throw new Error("Persistence error: Central database is busy.");
  }
}

/**
 * API: Universal Upsert (Save/Update)
 */
function apiUpsert(collectionName, entity) {
  const data = readDb();
  const key = collectionName.toLowerCase();
  
  if (!data[key]) data[key] = [];
  const collection = data[key];
  
  const index = collection.findIndex(item => item.id.toString() === entity.id.toString());

  if (index > -1) {
    collection[index] = { ...collection[index], ...entity, updated_at: new Date().toISOString() };
  } else {
    entity.created_at = new Date().toISOString();
    collection.push(entity);
  }
  
  data[key] = collection;
  return writeDb(data);
}

/**
 * API: Universal Delete
 */
function apiDelete(collectionName, id) {
  const data = readDb();
  const key = collectionName.toLowerCase();
  if (!data[key]) return { success: false };
  
  data[key] = data[key].filter(item => item.id.toString() !== id.toString());
  return writeDb(data);
}

/**
 * API: Fetch Global Settings
 */
function getGlobalSettings() {
  const data = readDb();
  return data.settings && data.settings[0] ? data.settings[0] : { id: 'GLOBAL', software_name: 'SmartStock Pro', primary_color: 'indigo' };
}

/**
 * Initialize Default Database Structure
 */
function createInitialDatabase(asObject = false) {
  const schema = {
    employees: [],
    departments: [
      { id: 'D-01', name: 'IT Support', manager: 'Admin' },
      { id: 'D-02', name: 'Operations', manager: 'Admin' }
    ],
    users: [{ id: 'U-01', username: 'admin', password: 'admin', role: 'ADMIN', full_name: 'System Admin', is_active: true }],
    items: [],
    categories: [{ id: 'C-01', name: 'Hardware', icon: 'fa-laptop' }],
    settings: [{ id: 'GLOBAL', software_name: 'SmartStock Pro', primary_color: 'indigo', software_logo: 'fa-warehouse' }],
    notifications: [],
    movements: []
  };
  if (asObject) return schema;
  return DriveApp.createFile(DB_FILE_NAME, JSON.stringify(schema), MimeType.PLAIN_TEXT);
}
