
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
  MAINTENANCE: 'Maintenance'
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
    [DB_SHEETS.MAINTENANCE]: ['id', 'item_id', 'issue_type', 'description', 'status', 'cost', 'start_date']
  };

  Object.keys(schema).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, schema[sheetName].length)
           .setValues([schema[sheetName]])
           .setFontWeight('bold')
           .setBackground('#f3f3f3');
      sheet.setFrozenRows(1);
    }
  });
  
  return "Database initialized successfully.";
}

/**
 * Generic Read Function
 */
function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
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
    timestamp: new Date().toISOString()
  };
}

/**
 * Save or Update an Inventory Item
 */
function upsertItem(itemData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DB_SHEETS.ITEMS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === itemData.id) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowValues = headers.map(h => itemData[h] || '');

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  
  return { success: true, id: itemData.id };
}

/**
 * Log an Asset Movement
 */
function logMovement(movementData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DB_SHEETS.MOVEMENTS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  if (!movementData.id) movementData.id = 'MOV-' + Date.now();
  if (!movementData.date) movementData.date = new Date().toISOString().split('T')[0];
  
  const rowValues = headers.map(h => movementData[h] || '');
  sheet.appendRow(rowValues);
  
  return { success: true, id: movementData.id };
}

/**
 * Handle Maintenance Ticket
 */
function addMaintenanceTicket(log) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DB_SHEETS.MAINTENANCE);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  log.id = Math.floor(Math.random() * 1000000);
  log.start_date = new Date().toISOString().split('T')[0];
  
  const rowValues = headers.map(h => log[h] || '');
  sheet.appendRow(rowValues);
  
  return { success: true, id: log.id };
}
