
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License, Category, Employee, Department, PersonalBudget, AssetRequest, User, UserLog, AttendanceRecord, LeaveRequest, Role, Notification, SystemSettings } from './types.ts';
import { dbService } from './db.ts';

declare var google: any;

const BASE_URL = '/api';
const isGAS = typeof google !== 'undefined' && google.script && google.script.run;

const getUserContext = () => {
  const user = localStorage.getItem('smartstock_user');
  return user ? JSON.parse(user) : null;
};

const gasRequest = <T>(funcName: string, ...args: any[]): Promise<T> => {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((res: T) => resolve(res))
      .withFailureHandler((err: Error) => reject(err))
      [funcName](...args);
  });
};

const handleRequest = async <T>(url: string, options: RequestInit = {}, fallbackAction?: () => Promise<T>): Promise<T> => {
  if (isGAS) {
    const parts = url.split('/');
    const endpoint = parts[parts.length - 1];
    
    if (url.includes('/login')) return gasRequest<T>('apiLogin', JSON.parse(options.body as string).username, JSON.parse(options.body as string).password);
    if (url.includes('/init-db')) return gasRequest<T>('setupDatabase');
    if (url.includes('/factory-reset')) return gasRequest<T>('apiFactoryReset');
    
    if (url.includes('/settings')) {
        if (options.method === 'POST') return gasRequest<T>('apiUpsert', 'Settings', JSON.parse(options.body as string));
        const settings = await gasRequest<any[]>('getSheetData', 'Settings');
        return (settings[0] || {}) as T;
    }
    
    const sheetName = endpoint.charAt(0).toUpperCase() + endpoint.slice(1);
    if (options.method === 'POST') return gasRequest<T>('apiUpsert', sheetName, JSON.parse(options.body as string));
    if (options.method === 'DELETE') return gasRequest<T>('apiDelete', sheetName, parts[parts.length - 1]);
    
    return gasRequest<T>('getSheetData', sheetName);
  }

  const user = getUserContext();
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(user ? { 'x-user-id': user.id, 'x-username': user.username } : {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      if (fallbackAction) return await fallbackAction();
      throw new Error(`Server Error (${res.status})`);
    }
    return await res.json();
  } catch (e) {
    if (fallbackAction) return await fallbackAction();
    throw new Error(`Backend Unreachable.`);
  }
};

export const apiService = {
  async login(username, password): Promise<User> { return handleRequest<User>(`${BASE_URL}/login`, { method: 'POST', body: JSON.stringify({ username, password }) }, async () => { await dbService.init(); const users = await dbService.getUsers(); const user = users.find(u => u.username === username && u.password === password); if (user) return user; throw new Error("Auth failed."); }); },
  async initDatabase() { return handleRequest<any>(`${BASE_URL}/init-db`, { method: 'POST' }); },
  async factoryReset() { return handleRequest<any>(`${BASE_URL}/factory-reset`, { method: 'POST' }, () => dbService.clearAllData()); },
  async getSettings(): Promise<SystemSettings> { return handleRequest<SystemSettings>(`${BASE_URL}/settings`, {}, () => dbService.getSettings()); },
  async updateSettings(s: SystemSettings) { return handleRequest<void>(`${BASE_URL}/settings`, { method: 'POST', body: JSON.stringify(s) }, () => dbService.saveSettings(s)); },
  
  async getAllItems(): Promise<InventoryItem[]> { return handleRequest<InventoryItem[]>(`${BASE_URL}/items`, {}, () => dbService.getAllItems()); },
  async saveItem(item: InventoryItem) { return handleRequest<void>(`${BASE_URL}/items`, { method: 'POST', body: JSON.stringify(item) }, () => dbService.saveItem(item)); },
  async deleteItem(id: string) { return handleRequest<void>(`${BASE_URL}/items/${id}`, { method: 'DELETE' }, () => dbService.deleteItem(id)); },
  
  async getDepartments(): Promise<Department[]> { return handleRequest<Department[]>(`${BASE_URL}/departments`, {}, () => dbService.getAllDepartments()); },
  async saveDepartment(d: Department) { return handleRequest<void>(`${BASE_URL}/departments`, { method: 'POST', body: JSON.stringify(d) }, () => dbService.saveDepartment(d)); },
  
  async getBudgets(): Promise<PersonalBudget[]> { return handleRequest<PersonalBudget[]>(`${BASE_URL}/budgets`, {}, () => dbService.put('budgets', []).then(() => [])); },
  async saveBudget(b: PersonalBudget) { return handleRequest<void>(`${BASE_URL}/budgets`, { method: 'POST', body: JSON.stringify(b) }, () => dbService.put('budgets', b)); },

  async getEmployees(): Promise<Employee[]> { return handleRequest<Employee[]>(`${BASE_URL}/employees`, {}, () => dbService.getAllEmployees()); },
  async saveEmployee(e: Employee) { return handleRequest<void>(`${BASE_URL}/employees`, { method: 'POST', body: JSON.stringify(e) }, () => dbService.saveEmployee(e)); },

  async getCategories(): Promise<Category[]> { return handleRequest<Category[]>(`${BASE_URL}/categories`, {}, () => dbService.getAllCategories()); },
  async getAllMovements(): Promise<Movement[]> { return handleRequest<Movement[]>(`${BASE_URL}/movements`, {}, () => dbService.getAllMovements()); },
  async getAllSuppliers(): Promise<Supplier[]> { return handleRequest<Supplier[]>(`${BASE_URL}/suppliers`, {}, () => dbService.getAllSuppliers()); },
  async getAllLocations(): Promise<LocationRecord[]> { return handleRequest<LocationRecord[]>(`${BASE_URL}/locations`, {}, () => dbService.getAllLocations()); },
  async getAllMaintenance(): Promise<MaintenanceLog[]> { return handleRequest<MaintenanceLog[]>(`${BASE_URL}/maintenance`, {}, () => dbService.getAllMaintenance()); },
  async getAllLicenses(): Promise<License[]> { return handleRequest<License[]>(`${BASE_URL}/licenses`, {}, () => dbService.getAllLicenses()); },
  async deleteLicense(id: any) { return handleRequest<void>(`${BASE_URL}/licenses/${id}`, { method: 'DELETE' }, () => dbService.deleteLicense(id)); },
  async getAllRequests(): Promise<AssetRequest[]> { return handleRequest<AssetRequest[]>(`${BASE_URL}/requests`, {}, () => dbService.getAllRequests()); },
  async getUsers(): Promise<User[]> { return handleRequest<User[]>(`${BASE_URL}/users`, {}, () => dbService.getUsers()); },
  async saveUser(u: User) { return handleRequest<void>(`${BASE_URL}/users`, { method: 'POST', body: JSON.stringify(u) }, () => dbService.saveUser(u)); },
  async deleteUser(id: string) { return handleRequest<void>(`${BASE_URL}/users/${id}`, { method: 'DELETE' }, () => dbService.deleteUser(id)); },
  async getRoles(): Promise<Role[]> { return handleRequest<Role[]>(`${BASE_URL}/roles`, {}, () => dbService.getRoles()); },
  async getNotifications(uid: string): Promise<Notification[]> { return handleRequest<Notification[]>(`${BASE_URL}/notifications/${uid}`, {}, () => dbService.getNotifications(uid)); },
  async createNotification(n: Partial<Notification>) { return handleRequest<void>(`${BASE_URL}/notifications`, { method: 'POST', body: JSON.stringify(n) }, () => dbService.saveNotification(n)); },
  async markNotificationsAsRead(ids: number[]) { return handleRequest<void>(`${BASE_URL}/notifications/read`, { method: 'POST', body: JSON.stringify({ ids }) }); },
  async getSystemLogs(): Promise<UserLog[]> { return handleRequest<UserLog[]>(`${BASE_URL}/system-logs`, {}, () => dbService.getSystemLogs()); },
  async getAttendance(): Promise<AttendanceRecord[]> { return handleRequest<AttendanceRecord[]>(`${BASE_URL}/attendance`, {}, () => dbService.getAttendance()); },
  async saveAttendance(r: AttendanceRecord) { return handleRequest<void>(`${BASE_URL}/attendance`, { method: 'POST', body: JSON.stringify(r) }, () => dbService.saveAttendance(r)); },
  async deleteAttendance(id: string) { return handleRequest<void>(`${BASE_URL}/attendance/${id}`, { method: 'DELETE' }, () => dbService.deleteAttendance(id)); },
  async getLeaveRequests(): Promise<LeaveRequest[]> { return handleRequest<LeaveRequest[]>(`${BASE_URL}/leaves`, {}, () => dbService.getLeaveRequests()); },
  async saveLeaveRequest(l: LeaveRequest) { return handleRequest<void>(`${BASE_URL}/leaves`, { method: 'POST', body: JSON.stringify(l) }, () => dbService.saveLeaveRequest(l)); },
  async deleteLeaveRequest(id: string) { return handleRequest<void>(`${BASE_URL}/leaves/${id}`, { method: 'DELETE' }, () => dbService.deleteLeaveRequest(id)); },

  // Added generic persistence helper for dynamic tables
  async genericSave(tableName: string, data: any) { 
    return handleRequest<void>(`${BASE_URL}/${tableName}`, { method: 'POST', body: JSON.stringify(data) }, () => dbService.put(tableName, data)); 
  },
  // Added generic deletion helper for dynamic tables
  async genericDelete(tableName: string, id: string) { 
    return handleRequest<void>(`${BASE_URL}/${tableName}/${id}`, { method: 'DELETE' }, () => dbService.delete(tableName, id)); 
  }
};