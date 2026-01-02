
/**
 * SmartStock Pro Enterprise - Google Apps Script Controller
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
  BUDGETS: 'Budgets',
  REQUESTS: 'Requests',
  USERS: 'Users',
  SETTINGS: 'Settings',
  LOGS: 'Logs',
  ATTENDANCE: 'Attendance',
  LEAVES: 'Leaves',
  ROLES: 'Roles',
  NOTIFICATIONS: 'Notifications'
};

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('SmartStock Pro | Enterprise ERP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

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
    [DB_SHEETS.EMPLOYEES]: ['id', 'name', 'email', 'department', 'role', 'joining_date'],
    [DB_SHEETS.DEPARTMENTS]: ['id', 'name', 'manager'],
    [DB_SHEETS.BUDGETS]: ['id', 'person_name', 'total_limit', 'spent_amount', 'category', 'notes'],
    [DB_SHEETS.REQUESTS]: ['id', 'item', 'employee', 'department', 'urgency', 'status', 'request_date', 'notes'],
    [DB_SHEETS.USERS]: ['id', 'username', 'password', 'role', 'full_name', 'department', 'shift_start_time', 'team_lead_id', 'manager_id'],
    [DB_SHEETS.SETTINGS]: ['id', 'software_name', 'primary_color', 'software_description', 'software_logo'],
    [DB_SHEETS.ROLES]: ['id', 'label', 'description', 'permissions', 'color', 'icon'],
    [DB_SHEETS.ATTENDANCE]: ['id', 'user_id', 'username', 'date', 'check_in', 'check_out', 'status', 'location'],
    [DB_SHEETS.LEAVES]: ['id', 'user_id', 'username', 'start_date', 'end_date', 'leave_type', 'reason', 'status'],
    [DB_SHEETS.LOGS]: ['id', 'user_id', 'username', 'action', 'target_type', 'target_id', 'details', 'timestamp'],
    [DB_SHEETS.NOTIFICATIONS]: ['id', 'recipient_id', 'sender_name', 'message', 'type', 'is_read', 'timestamp']
  };

  Object.keys(schema).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    sheet.getRange(1, 1, 1, schema[sheetName].length)
         .setValues([schema[sheetName]])
         .setFontWeight('bold')
         .setBackground('#f3f3f3');
    sheet.setFrozenRows(1);
  });

  const userSheet = ss.getSheetByName(DB_SHEETS.USERS);
  if (userSheet.getLastRow() === 1) {
    userSheet.appendRow(['U-001', 'admin', 'admin123', 'ADMIN', 'System Administrator', 'IT', '09:00', '', '']);
  }

  const settingsSheet = ss.getSheetByName(DB_SHEETS.SETTINGS);
  if (settingsSheet.getLastRow() === 1) {
    settingsSheet.appendRow(['GLOBAL', 'SmartStock Pro', 'indigo', 'Enterprise Resource Planning', 'fa-warehouse']);
  }
  
  return "SmartStock Database initialized.";
}

function apiUpsert(sheetName, entity) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: 'Sheet not found' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  
  let rowIndex = -1;
  if (data.length > 1) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol].toString() === entity.id.toString()) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  const rowData = headers.map(h => entity[h] !== undefined ? entity[h] : '');
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return { success: true };
}

function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; 
  
  const headers = data.shift();
  return data.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (val instanceof Date) val = val.toISOString().split('T')[0];
      obj[h] = val;
    });
    return obj;
  });
}

function apiDelete(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Not found' };
}

function apiLogin(username, password) {
  const users = getSheetData(DB_SHEETS.USERS);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) throw new Error("Invalid credentials");
  return user;
}
