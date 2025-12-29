
/**
 * SmartStock Pro - Google Apps Script ERP Controller
 * This script acts as the backend for the SmartStock ERP when deployed as a Google Web App.
 * Data is persisted in the active Spreadsheet.
 */

const DB_SHEETS = {
  ITEMS: 'Items',
  MOVEMENTS: 'Movements',
  SUPPLIERS: 'Suppliers',
  LOCATIONS: 'Locations',
  LICENSES: 'Licenses',
  MAINTENANCE: 'Maintenance',
  CATEGORIES: 'Categories',
  EMPLOYEES: 'Employees',
  DEPARTMENTS: 'Departments',
  REQUESTS: 'Requests'
};

/**
 * Serves the Web App
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('SmartStock Pro | Enterprise Inventory')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Utility to include files in the template
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Initialize Database (Sheets)
 * Run this function once from the Apps Script editor to prepare your Sheet.
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const schema = {
    [DB_SHEETS.ITEMS]: ['id', 'name', 'category', 'serial', 'status', 'location', 'assignedTo', 'department', 'purchaseDate', 'warranty', 'cost'],
    [DB_SHEETS.MOVEMENTS]: ['id', 'date', 'item', 'from', 'to', 'employee', 'department', 'status'],
    [DB_SHEETS.SUPPLIERS]: ['id', 'name', 'contact_person', 'email', 'rating'],
    [DB_SHEETS.LOCATIONS]: ['id', 'building', 'floor', 'room', 'manager'],
    [DB_SHEETS.LICENSES]: ['id', 'software_name', 'product_key', 'total_seats', 'assigned_seats', 'expiration_date', 'supplier_id'],
    [DB_SHEETS.MAINTENANCE]: ['id', 'item_id', 'issue_type', 'description', 'status', 'cost', 'start_date'],
    [DB_SHEETS.CATEGORIES]: ['id', 'name', 'icon'],
    [DB_SHEETS.EMPLOYEES]: ['id', 'name', 'email', 'department', 'role'],
    [DB_SHEETS.DEPARTMENTS]: ['id', 'name', 'head', 'budget', 'budget_month'],
    [DB_SHEETS.REQUESTS]: ['id', 'item', 'employee', 'department', 'urgency', 'status', 'request_date', 'notes']
  };

  Object.keys(schema).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    // Always set/reset headers to ensure they are current
    sheet.getRange(1, 1, 1, schema[sheetName].length)
         .setValues([schema[sheetName]])
         .setFontWeight('bold')
         .setBackground('#f3f3f3');
    sheet.setFrozenRows(1);
  });
  
  return "Database initialized successfully with all tables.";
}

/**
 * Generic Read Function
 */
function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only headers or empty
  
  const headers = data.shift();
  
  return data.map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
}

/**
 * Main ERP API - Fetch all data in one go for the frontend
 */
function getFullERPData() {
  return {
    items: getSheetData(DB_SHEETS.ITEMS),
    movements: getSheetData(DB_SHEETS.MOVEMENTS),
    suppliers: getSheetData(DB_SHEETS.SUPPLIERS),
    locations: getSheetData(DB_SHEETS.LOCATIONS),
    licenses: getSheetData(DB_SHEETS.LICENSES),
    maintenance: getSheetData(DB_SHEETS.MAINTENANCE),
    categories: getSheetData(DB_SHEETS.CATEGORIES),
    employees: getSheetData(DB_SHEETS.EMPLOYEES),
    departments: getSheetData(DB_SHEETS.DEPARTMENTS),
    requests: getSheetData(DB_SHEETS.REQUESTS),
    timestamp: new Date().toISOString()
  };
}

/**
 * Save or Update any entity generically
 */
function upsertEntity(sheetName, entityData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return { success: false, error: 'Sheet not found: ' + sheetName };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  let rowIndex = -1;
  if (data.length > 1) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex].toString() === entityData.id.toString()) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  const rowValues = headers.map(h => entityData[h] === undefined ? '' : entityData[h]);

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  
  return { success: true, id: entityData.id };
}

/**
 * Wrapper functions for specific entities to match API structure
 */
function upsertItem(itemData) { return upsertEntity(DB_SHEETS.ITEMS, itemData); }
function logMovement(movementData) { return upsertEntity(DB_SHEETS.MOVEMENTS, movementData); }
function addMaintenanceTicket(log) { return upsertEntity(DB_SHEETS.MAINTENANCE, log); }
function upsertCategory(data) { return upsertEntity(DB_SHEETS.CATEGORIES, data); }
function upsertEmployee(data) { return upsertEntity(DB_SHEETS.EMPLOYEES, data); }
function upsertDepartment(data) { return upsertEntity(DB_SHEETS.DEPARTMENTS, data); }
function upsertRequest(data) { return upsertEntity(DB_SHEETS.REQUESTS, data); }

/**
 * Generic Delete Function
 */
function deleteEntity(sheetName, id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return { success: false, error: 'Sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Entity not found' };
}
