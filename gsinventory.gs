
/**
 * SmartStock Pro Enterprise - Google Drive JSON Controller
 * This script manages data as a JSON blob stored in a Drive file.
 */

const DB_FILE_NAME = "smartstock_db.json";

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('SmartStock Pro | Cloud Inventory')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Finds or creates the JSON database file in Google Drive
 */
function getDbFile() {
  const files = DriveApp.getFilesByName(DB_FILE_NAME);
  if (files.hasNext()) {
    return files.next();
  }
  // Create default structure if file doesn't exist
  const defaultData = {
    items: [],
    movements: [],
    suppliers: [],
    locations: [],
    licenses: [],
    maintenance: [],
    categories: [],
    employees: [],
    departments: [],
    budgets: [],
    requests: [],
    users: [{id: 'U-001', username: 'admin', password: 'admin123', role: 'ADMIN', full_name: 'System Admin', department: 'IT'}],
    settings: { id: 'GLOBAL', software_name: 'SmartStock Pro', primary_color: 'indigo' },
    logs: [],
    attendance: [],
    leaves: [],
    roles: [],
    notifications: []
  };
  return DriveApp.createFile(DB_FILE_NAME, JSON.stringify(defaultData), MimeType.PLAIN_TEXT);
}

/**
 * Retrieves all data from the Drive JSON file
 */
function getAllData() {
  const file = getDbFile();
  const content = file.getBlob().getDataAsString();
  return JSON.parse(content);
}

/**
 * Saves a specific collection to the Drive JSON file
 */
function apiUpsert(collectionName, entity) {
  const data = getAllData();
  const collection = data[collectionName.toLowerCase()] || [];
  
  const index = collection.findIndex(item => item.id.toString() === entity.id.toString());
  
  if (index > -1) {
    collection[index] = entity;
  } else {
    collection.push(entity);
  }
  
  data[collectionName.toLowerCase()] = collection;
  getDbFile().setContent(JSON.stringify(data));
  return { success: true };
}

/**
 * Replaces the entire cloud database (Bulk Sync)
 */
function syncFullDatabase(fullData) {
  try {
    getDbFile().setContent(JSON.stringify(fullData));
    return { success: true, timestamp: new Date().toISOString() };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function getCollection(collectionName) {
  const data = getAllData();
  return data[collectionName.toLowerCase()] || [];
}

function apiDelete(collectionName, id) {
  const data = getAllData();
  const collection = data[collectionName.toLowerCase()] || [];
  const filtered = collection.filter(item => item.id.toString() !== id.toString());
  data[collectionName.toLowerCase()] = filtered;
  getDbFile().setContent(JSON.stringify(data));
  return { success: true };
}

function apiLogin(username, password) {
  const data = getAllData();
  const user = data.users.find(u => u.username === username && u.password === password);
  if (!user) throw new Error("Invalid credentials");
  return user;
}

function setupDatabase() {
  getDbFile(); // Triggers file creation if missing
  return "SmartStock Drive Storage initialized.";
}
