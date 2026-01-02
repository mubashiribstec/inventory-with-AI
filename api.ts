
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License, Category, Employee, Department, AssetRequest, User, UserLog, AttendanceRecord, LeaveRequest, Role, Notification, SystemSettings } from './types.ts';
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

/**
 * Handle requests with deep fallback to IndexedDB if server is offline
 */
const handleRequest = async <T>(url: string, options: RequestInit = {}, fallbackAction?: () => Promise<T>): Promise<T> => {
  if (isGAS) {
    const parts = url.split('/');
    const endpoint = parts[parts.length - 1];
    if (url.includes('/login')) return gasRequest<T>('apiLogin', JSON.parse(options.body as string).username, JSON.parse(options.body as string).password);
    if (url.includes('/init-db')) return gasRequest<T>('setupDatabase');
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // Fail fast for local testing
    
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (fallbackAction) return await fallbackAction();
      throw new Error(`Server Error (${res.status})`);
    }
    return await res.json();
  } catch (e) {
    // Detect server downtime (Failed to fetch)
    if (fallbackAction) {
      console.warn(`[API] Server offline at ${url}. Falling back to local data.`);
      return await fallbackAction();
    }
    throw new Error(`Backend Unreachable. Use Demo Mode.`);
  }
};

export const apiService = {
  async login(username, password): Promise<User> {
    return handleRequest<User>(`${BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }, async () => {
      // Local Mock Login
      await dbService.init();
      const users = await dbService.getUsers();
      const user = users.find(u => u.username === username && u.password === password);
      if (user) return user;
      throw new Error("Invalid credentials or database empty.");
    });
  },

  async initDatabase(): Promise<{ success: boolean; message: string }> {
    return handleRequest<{ success: boolean; message: string }>(`${BASE_URL}/init-db`, { method: 'POST' }, async () => {
      await dbService.init();
      return { success: true, message: "Local IndexedDB ready." };
    });
  },

  async factoryReset(): Promise<void> {
    // Note: For real servers, you might need a restricted backend endpoint.
    // For local/GAS fallback, we wipe the local IndexedDB.
    await dbService.clearAllData();
  },

  async getSettings(): Promise<SystemSettings> { return handleRequest<SystemSettings>(`${BASE_URL}/settings`, {}, () => dbService.getSettings()); },
  
  async updateSettings(settings: SystemSettings): Promise<void> { return handleRequest<void>(`${BASE_URL}/settings`, { method: 'POST', body: JSON.stringify(settings) }, () => dbService.saveSettings(settings)); },
  
  async getAllItems(): Promise<InventoryItem[]> { return handleRequest<InventoryItem[]>(`${BASE_URL}/items`, {}, () => dbService.getAllItems()); },
  async saveItem(item: InventoryItem): Promise<void> { return handleRequest<void>(`${BASE_URL}/items`, { method: 'POST', body: JSON.stringify(item) }, () => dbService.saveItem(item)); },
  async deleteItem(id: string): Promise<void> { return handleRequest<void>(`${BASE_URL}/items/${id}`, { method: 'DELETE' }, () => dbService.deleteItem(id)); },

  async getCategories(): Promise<Category[]> { return handleRequest<Category[]>(`${BASE_URL}/categories`, {}, () => dbService.getAllCategories()); },
  
  async saveEmployee(employee: Employee): Promise<void> { return handleRequest<void>(`${BASE_URL}/employees`, { method: 'POST', body: JSON.stringify(employee) }, () => dbService.saveEmployee(employee)); },
  async getEmployees(): Promise<Employee[]> { return handleRequest<Employee[]>(`${BASE_URL}/employees`, {}, () => dbService.getAllEmployees()); },
  
  async getDepartments(): Promise<Department[]> { return handleRequest<Department[]>(`${BASE_URL}/departments`, {}, () => dbService.getAllDepartments()); },
  async getAllMaintenance(): Promise<MaintenanceLog[]> { return handleRequest<MaintenanceLog[]>(`${BASE_URL}/maintenance_logs`, {}, () => dbService.getAllMaintenance()); },
  
  async getAllLicenses(): Promise<License[]> { return handleRequest<License[]>(`${BASE_URL}/licenses`, {}, () => dbService.getAllLicenses()); },
  
  async deleteLicense(id: any): Promise<void> { return handleRequest<void>(`${BASE_URL}/licenses/${id}`, { method: 'DELETE' }, () => dbService.deleteLicense(id)); },
  
  async getAllRequests(): Promise<AssetRequest[]> { return handleRequest<AssetRequest[]>(`${BASE_URL}/requests`, {}, () => dbService.getAllRequests()); },
  async getAllMovements(): Promise<Movement[]> { return handleRequest<Movement[]>(`${BASE_URL}/movements`, {}, () => dbService.getAllMovements()); },
  async getAllSuppliers(): Promise<Supplier[]> { return handleRequest<Supplier[]>(`${BASE_URL}/suppliers`, {}, () => dbService.getAllSuppliers()); },
  async getAllLocations(): Promise<LocationRecord[]> { return handleRequest<LocationRecord[]>(`${BASE_URL}/locations`, {}, () => dbService.getAllLocations()); },
  
  async getUsers(): Promise<User[]> { return handleRequest<User[]>(`${BASE_URL}/users`, {}, () => dbService.getUsers()); },
  
  async saveUser(user: User): Promise<void> { return handleRequest<void>(`${BASE_URL}/users`, { method: 'POST', body: JSON.stringify(user) }, () => dbService.saveUser(user)); },
  async deleteUser(id: string): Promise<void> { return handleRequest<void>(`${BASE_URL}/users/${id}`, { method: 'DELETE' }, () => dbService.deleteUser(id)); },
  
  async getRoles(): Promise<Role[]> { return handleRequest<Role[]>(`${BASE_URL}/roles`, {}, () => dbService.getRoles()); },
  
  async getNotifications(userId: string): Promise<Notification[]> { return handleRequest<Notification[]>(`${BASE_URL}/notifications/${userId}`, {}, () => dbService.getNotifications(userId)); },
  
  async createNotification(notif: Partial<Notification>): Promise<void> { return handleRequest<void>(`${BASE_URL}/notifications`, { method: 'POST', body: JSON.stringify(notif) }, () => dbService.saveNotification(notif)); },
  async markNotificationsAsRead(ids: number[]): Promise<void> { 
    return handleRequest<void>(`${BASE_URL}/notifications/read`, { method: 'POST', body: JSON.stringify({ ids }) }, async () => {
      for (const id of ids) {
        const n = await dbService.getNotification(id);
        if (n) await dbService.saveNotification({ ...n, is_read: true });
      }
    }); 
  },
  
  async getSystemLogs(): Promise<UserLog[]> { return handleRequest<UserLog[]>(`${BASE_URL}/system-logs`, {}, () => dbService.getSystemLogs()); },

  async getAttendance(): Promise<AttendanceRecord[]> { return handleRequest<AttendanceRecord[]>(`${BASE_URL}/attendance`, {}, () => dbService.getAttendance()); },
  async saveAttendance(record: AttendanceRecord): Promise<void> { return handleRequest<void>(`${BASE_URL}/attendance`, { method: 'POST', body: JSON.stringify(record) }, () => dbService.saveAttendance(record)); },
  async deleteAttendance(id: string): Promise<void> { return handleRequest<void>(`${BASE_URL}/attendance/${id}`, { method: 'DELETE' }, () => dbService.deleteAttendance(id)); },
  
  async getLeaveRequests(): Promise<LeaveRequest[]> { return handleRequest<LeaveRequest[]>(`${BASE_URL}/leave_requests`, {}, () => dbService.getLeaveRequests()); },
  async saveLeaveRequest(request: LeaveRequest): Promise<void> { return handleRequest<void>(` ${BASE_URL}/leave_requests`, { method: 'POST', body: JSON.stringify(request) }, () => dbService.saveLeaveRequest(request)); },
  async deleteLeaveRequest(id: string): Promise<void> { return handleRequest<void>(`${BASE_URL}/leave_requests/${id}`, { method: 'DELETE' }, () => dbService.deleteLeaveRequest(id)); },

  async genericSave(tableName: string, data: any): Promise<void> { return handleRequest<void>(`${BASE_URL}/${tableName}`, { method: 'POST', body: JSON.stringify(data) }, () => dbService.put(tableName, data)); },
  async genericDelete(tableName: string, id: any): Promise<void> { return handleRequest<void>(`${BASE_URL}/${tableName}/${id}`, { method: 'DELETE' }, () => dbService.delete(tableName, id)); }
};
