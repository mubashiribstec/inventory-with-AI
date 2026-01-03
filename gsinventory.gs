
/**
 * SmartStock Pro Enterprise - Google Apps Script Backend Controller (v1.5)
 * -----------------------------------------------------------------------
 * Handles modular persistence for:
 * - Module 1: Human Resources (HR)
 * - Module 2: Budget & Consumption (Financials)
 * - Module 3: Inventory Lifecycle (Stock & Maintenance)
 */

const DB_FILE_NAME = "smartstock_enterprise_db.json";
const BACKUP_FOLDER_NAME = "SmartStock_Backups";

/**
 * Entry point: Serves the React Application
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('SmartStock Pro | Enterprise ERP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * GET FILE: Returns the primary JSON database file from Drive
 */
function getDbFile() {
  const files = DriveApp.getFilesByName(DB_FILE_NAME);
  if (files.hasNext()) {
    return files.next();
  }
  return createInitialDatabase();
}

/**
 * ATOMIC READ: Safely parses the JSON database
 */
function readDb() {
  const file = getDbFile();
  const content = file.getBlob().getDataAsString();
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Database Corrupted, Restoring Defaults:", e);
    return createInitialDatabase(true); 
  }
}

/**
 * ATOMIC WRITE: Safely saves the JSON database with Concurrency Locking
 */
function writeDb(data) {
  const lock = LockService.getScriptLock();
  try {
    // Wait for up to 30 seconds for other processes to finish
    lock.waitLock(30000); 
    
    const file = getDbFile();
    file.setContent(JSON.stringify(data, null, 2));
    
    // Release the lock
    lock.releaseLock();
    return { success: true, timestamp: new Date().toISOString() };
  } catch (e) {
    console.error("Write Failed:", e);
    throw new Error("Database is busy. Please try again in a few seconds.");
  }
}

/**
 * CREATE SYSTEM BACKUP: Creates a timestamped snapshot in Drive
 */
function createSystemBackup() {
  const folders = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME);
  let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(BACKUP_FOLDER_NAME);
  
  const dbFile = getDbFile();
  const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  dbFile.makeCopy(backupName, folder);
  
  return { success: true, path: BACKUP_FOLDER_NAME + "/" + backupName };
}

/**
 * MODULE SAVE CONTROLLER: Universal Upsert with Logic Hooks
 */
function apiUpsert(collectionName, entity) {
  const data = readDb();
  const key = collectionName.toLowerCase();
  
  if (!data[key]) data[key] = [];
  const collection = data[key];
  
  const index = collection.findIndex(item => item.id.toString() === entity.id.toString());
  
  // 1. MODULE INTEGRITY HOOKS
  if (key === 'items') {
    // If it's a new purchase, attempt to charge the department budget
    if (index === -1 && entity.cost > 0 && entity.department) {
      const deptIdx = data.departments.findIndex(d => d.name === entity.department);
      if (deptIdx > -1) {
        data.departments[deptIdx].spent = (data.departments[deptIdx].spent || 0) + Number(entity.cost);
      }
    }
  }

  if (key === 'maintenance_logs') {
    // Update Item status based on repair outcome
    const itemIdx = data.items.findIndex(i => i.id === entity.item_id);
    if (itemIdx > -1) {
      if (entity.status === 'SCRAPPED') data.items[itemIdx].status = 'scrapped';
      if (entity.status === 'FIXED') data.items[itemIdx].status = 'available';
      if (entity.status === 'OPEN') data.items[itemIdx].status = 'faulty';
    }
  }

  // 2. PERSISTENCE
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
 * UNIVERSAL DELETE
 */
function apiDelete(collectionName, id) {
  const data = readDb();
  const key = collectionName.toLowerCase();
  if (!data[key]) return { success: false, error: "Collection not found" };
  
  data[key] = data[key].filter(item => item.id.toString() !== id.toString());
  return writeDb(data);
}

/**
 * INITIAL DATABASE SCHEMA
 */
function createInitialDatabase(asObject = false) {
  const initialSchema = {
    // Module 1: HR
    employees: [],
    departments: [
      { id: 'D-01', name: 'IT Infrastructure', manager: 'Admin', budget: 500000, spent: 0 },
      { id: 'D-02', name: 'Finance', manager: 'Admin', budget: 200000, spent: 0 }
    ],
    users: [{ id: 'U-01', username: 'admin', password: 'admin', role: 'ADMIN', full_name: 'System Admin', is_active: true }],
    attendance: [],
    leave_requests: [],
    salaries: [],
    
    // Module 2: Financials
    budgets: [],
    movements: [],
    
    // Module 3: Inventory
    items: [],
    maintenance_logs: [],
    categories: [{ id: 'C-01', name: 'Laptops', icon: 'fa-laptop' }],
    suppliers: [],
    licenses: [],
    requests: [],
    
    // Config
    settings: [{ id: 'GLOBAL', software_name: 'SmartStock Pro', primary_color: 'indigo' }],
    user_logs: [],
    notifications: []
  };

  if (asObject) return initialSchema;
  
  return DriveApp.createFile(DB_FILE_NAME, JSON.stringify(initialSchema), MimeType.PLAIN_TEXT);
}

/**
 * AUTHENTICATION
 */
function apiLogin(username, password) {
  const data = readDb();
  const user = data.users.find(u => u.username === username && u.password === password);
  if (!user) throw new Error("Unauthorized: Invalid Credentials");
  
  // Log login event
  apiUpsert('user_logs', {
    id: `LOG-${Date.now()}`,
    user_id: user.id,
    username: user.username,
    action: 'LOGIN',
    details: 'User logged into modular system'
  });
  
  return user;
}
