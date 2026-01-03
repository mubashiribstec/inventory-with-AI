
/**
 * SmartStock Pro Enterprise - Google Apps Script Backend Controller
 * Modular Architecture:
 * 1. Human Resources (HR)
 * 2. Budget & Consumption (Analytics)
 * 3. Inventory Management (Procurement & Lifecycle)
 */

const DB_FILE_NAME = "smartstock_enterprise_db.json";

/**
 * Serves the HTML file for the web application
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('SmartStock Pro | Enterprise ERP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Core Database Engine: Manages the JSON storage on Google Drive
 */
function getDbFile() {
  const files = DriveApp.getFilesByName(DB_FILE_NAME);
  if (files.hasNext()) {
    return files.next();
  }
  return createDefaultDbFile();
}

/**
 * Schema Initialization: Sets up the default structure for all modules
 */
function createDefaultDbFile() {
  const defaultData = {
    // MODULE 1: Human Resources
    employees: [],
    departments: [
      { id: 'DEPT-IT', name: 'IT Infrastructure', manager: 'Admin', budget: 1000000 },
      { id: 'DEPT-HR', name: 'Human Resources', manager: 'Admin', budget: 500000 }
    ],
    users: [{
      id: 'U-001', 
      username: 'admin', 
      password: 'admin', 
      role: 'ADMIN', 
      full_name: 'System Admin', 
      department: 'IT', 
      is_active: true
    }],
    attendance: [],
    leave_requests: [],
    salaries: [],
    notifications: [],
    roles: [
      {id: 'ADMIN', label: 'Administrator', permissions: '*', color: 'rose'},
      {id: 'STAFF', label: 'Employee', permissions: 'inventory.view', color: 'slate'}
    ],

    // MODULE 2: Budget & Consumption
    budgets: [],
    movements: [], // Movement Ledger
    
    // MODULE 3: Inventory Management
    items: [],
    maintenance_logs: [], // Faulty & Repair Hub
    suppliers: [],
    categories: [
      { id: 'CAT-01', name: 'Laptops', icon: 'fa-laptop' },
      { id: 'CAT-02', name: 'Furniture', icon: 'fa-chair' }
    ],
    requests: [],
    
    // System Config
    settings: [{ 
      id: 'GLOBAL', 
      software_name: 'SmartStock Pro', 
      primary_color: 'indigo', 
      software_description: 'Modular Enterprise Resource Planning', 
      software_logo: 'fa-warehouse' 
    }],
    user_logs: []
  };
  return DriveApp.createFile(DB_FILE_NAME, JSON.stringify(defaultData), MimeType.PLAIN_TEXT);
}

/**
 * Universal Data Retrieval: Fetches the entire modular state
 */
function getAllData() {
  const file = getDbFile();
  const content = file.getBlob().getDataAsString();
  try {
    return JSON.parse(content);
  } catch (e) {
    // Fallback if file is corrupted
    return createDefaultDbFile().getBlob().getDataAsString();
  }
}

/**
 * Module-Specific Collection Fetcher
 */
function getCollection(collectionName) {
  const data = getAllData();
  return data[collectionName.toLowerCase()] || [];
}

/**
 * Universal CRUD: Upsert entity into any modular collection
 */
function apiUpsert(collectionName, entity) {
  const data = getAllData();
  const key = collectionName.toLowerCase();
  
  if (!data[key]) data[key] = [];
  const collection = data[key];
  
  const index = collection.findIndex(item => item.id.toString() === entity.id.toString());
  
  if (index > -1) {
    collection[index] = entity;
  } else {
    // Ensure timestamp for new records
    if (!entity.timestamp) entity.timestamp = new Date().toISOString();
    collection.push(entity);
  }
  
  // Custom Logic for Faulty Items (Inventory Module)
  if (key === 'maintenance_logs') {
    updateItemStatusFromMaintenance(data, entity);
  }

  data[key] = collection;
  getDbFile().setContent(JSON.stringify(data));
  return { success: true, id: entity.id };
}

/**
 * Maintenance Helper: Automatically updates Inventory based on Repair status
 */
function updateItemStatusFromMaintenance(data, log) {
  const itemIndex = data.items.findIndex(i => i.id === log.item_id);
  if (itemIndex > -1) {
    if (log.status === 'SCRAPPED') {
       data.items[itemIndex].status = 'archived'; // Not repairable
    } else if (log.status === 'FIXED') {
       data.items[itemIndex].status = 'available'; // Repairable & Done
    } else if (log.status === 'OPEN' || log.status === 'PENDING') {
       data.items[itemIndex].status = 'faulty'; // In maintenance
    }
  }
}

/**
 * Universal Deletion
 */
function apiDelete(collectionName, id) {
  const data = getAllData();
  const key = collectionName.toLowerCase();
  if (!data[key]) return { success: false, error: "Collection not found" };
  
  data[key] = data[key].filter(item => item.id.toString() !== id.toString());
  getDbFile().setContent(JSON.stringify(data));
  return { success: true };
}

/**
 * Authentication Controller
 */
function apiLogin(username, password) {
  const data = getAllData();
  const user = data.users.find(u => u.username === username && u.password === password);
  
  if (!user) throw new Error("Invalid username or security key.");
  if (user.is_active === false) throw new Error("Account is currently disabled. Contact HR.");
  
  // Log the activity
  apiUpsert('user_logs', {
    id: `LOG-${Date.now()}`,
    user_id: user.id,
    username: user.username,
    action: 'LOGIN',
    target_type: 'SYSTEM',
    target_id: 'AUTH',
    details: `User logged into modular system.`,
    timestamp: new Date().toISOString()
  });

  return user;
}

/**
 * System Diagnostics & Factory Reset
 */
function factoryReset() {
  const files = DriveApp.getFilesByName(DB_FILE_NAME);
  while (files.hasNext()) {
    files.next().setTrashed(true);
  }
  createDefaultDbFile();
  return { success: true, message: "Modular system reset. Default credentials restored." };
}

/**
 * Initial Setup Run
 */
function setupDatabase() {
  getDbFile();
  return { success: true, message: "SmartStock Enterprise Modular Storage initialized." };
}
