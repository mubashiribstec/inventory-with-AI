
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License, Category, Employee, Department, AssetRequest, User, UserLog, AttendanceRecord, LeaveRequest, Role, Notification, SystemSettings } from './types.ts';
import { dbService } from './db.ts';

/**
 * Declare google for Google Apps Script environments to avoid TypeScript errors
 */
declare var google: any;

const BASE_URL = '/api';

/**
 * Detection for Google Apps Script Environment
 */
const isGAS = typeof google !== 'undefined' && google.script && google.script.run;

const getUserContext = () => {
  const user = localStorage.getItem('smartstock_user');
  return user ? JSON.parse(user) : null;
};

/**
 * Bridge for Google Apps Script Server Calls
 */
const gasRequest = <T>(funcName: string, ...args: any[]): Promise<T> => {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((res: T) => resolve(res))
      .withFailureHandler((err: Error) => reject(err))
      [funcName](...args);
  });
};

/**
 * Optimized request handler with support for REST API and GAS Bridge
 */
const handleRequest = async <T>(url: string, options: RequestInit = {}, fallbackAction?: () => Promise<T>): Promise<T> => {
  if (isGAS) {
    const parts = url.split('/');
    const endpoint = parts[parts.length - 1];
    
    // Map REST endpoints to GAS functions
    if (url.includes('/login')) return gasRequest<T>('apiLogin', JSON.parse(options.body as string).username, JSON.parse(options.body as string).password);
    if (url.includes('/init-db')) return gasRequest<T>('setupDatabase');
    if (url.includes('/settings')) {
        if (options.method === 'POST') return gasRequest<T>('apiUpsert', 'Settings', JSON.parse(options.body as string));
        const settings = await gasRequest<any[]>('getSheetData', 'Settings');
        return (settings[0] || {}) as T;
    }
    
    // Handle generic CRUD if endpoint matches sheet name (simplified mapping)
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
      if (res.status === 404 && fallbackAction) return await fallbackAction();
      const text = await res.text();
      throw new Error(`Server Error (${res.status}): ${text || 'Unknown Error'}`);
    }
    const text = await res.text();
    if (!text || text.trim() === '') return {} as T;
    try {
      return JSON.parse(text.trim());
    } catch (parseError) {
      return { success: true, message: text } as unknown as T;
    }
  } catch (e) {
    if (fallbackAction) return await fallbackAction();
    throw new Error(`Network Connectivity Issue: Could not reach the service.`);
  }
};

export const apiService = {
  async login(username, password): Promise<User> {
    return handleRequest<User>(`${BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  async initDatabase(): Promise<{ success: boolean; message: string }> {
    return handleRequest<{ success: boolean; message: string }>(`${BASE_URL}/init-db`, { method: 'POST' });
  },

  // Fixed path to match server.js /api/system-logs
  async getSystemLogs(): Promise<UserLog[]> { return handleRequest<UserLog[]>(`${BASE_URL}/system-logs`); },
  async getSettings(): Promise<SystemSettings> { return handleRequest<SystemSettings>(`${BASE_URL}/settings`); },
  async updateSettings(settings: Partial<SystemSettings>): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/settings`, { method: 'POST', body: JSON.stringify(settings) });
  },

  async getAllItems(): Promise<InventoryItem[]> { return handleRequest<InventoryItem[]>(`${BASE_URL}/items`, {}, () => dbService.getAllItems()); },
  async saveItem(item: InventoryItem): Promise<void> { return handleRequest<void>(`${BASE_URL}/items`, { method: 'POST', body: JSON.stringify(item) }); },
  async deleteItem(id: string): Promise<void> { return handleRequest<void>(`${BASE_URL}/items/${id}`, { method: 'DELETE' }); },

  async getCategories(): Promise<Category[]> { return handleRequest<Category[]>(`${BASE_URL}/categories`); },
  async getEmployees(): Promise<Employee[]> { return handleRequest<Employee[]>(`${BASE_URL}/employees`); },
  async saveEmployee(emp: Employee): Promise<void> { return handleRequest<void>(`${BASE_URL}/employees`, { method: 'POST', body: JSON.stringify(emp) }); },
  async getDepartments(): Promise<Department[]> { return handleRequest<Department[]>(`${BASE_URL}/departments`); },
  // Fixed path to match server.js /api/maintenance_logs
  async getAllMaintenance(): Promise<MaintenanceLog[]> { return handleRequest<MaintenanceLog[]>(`${BASE_URL}/maintenance_logs`); },
  async getAllLicenses(): Promise<License[]> { return handleRequest<License[]>(`${BASE_URL}/licenses`); },
  // Fix: added missing deleteLicense method for LicenseList component
  async deleteLicense(id: number): Promise<void> { return handleRequest<void>(`${BASE_URL}/licenses/${id}`, { method: 'DELETE' }); },
  async getAllRequests(): Promise<AssetRequest[]> { return handleRequest<AssetRequest[]>(`${BASE_URL}/requests`); },
  async getAllMovements(): Promise<Movement[]> { return handleRequest<Movement[]>(`${BASE_URL}/movements`); },

  // Fix: added missing getAllSuppliers method for App component
  async getAllSuppliers(): Promise<Supplier[]> { return handleRequest<Supplier[]>(`${BASE_URL}/suppliers`); },
  // Fix: added missing getAllLocations method for App component
  async getAllLocations(): Promise<LocationRecord[]> { return handleRequest<LocationRecord[]>(`${BASE_URL}/locations`); },

  // Fix: added generic methods for RoleManagement component
  async genericSave(module: string, data: any): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/${module}`, { method: 'POST', body: JSON.stringify(data) });
  },
  async genericDelete(module: string, id: string | number): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/${module}/${id}`, { method: 'DELETE' });
  },

  async getAttendance(): Promise<AttendanceRecord[]> { return handleRequest<AttendanceRecord[]>(`${BASE_URL}/attendance`); },
  async saveAttendance(record: AttendanceRecord): Promise<void> { return handleRequest<void>(`${BASE_URL}/attendance`, { method: 'POST', body: JSON.stringify(record) }); },
  async deleteAttendance(id: string): Promise<void> { return handleRequest<void>(`${BASE_URL}/attendance/${id}`, { method: 'DELETE' }); },
  
  // Fixed path to match server.js /api/leave_requests
  async getLeaveRequests(): Promise<LeaveRequest[]> { return handleRequest<LeaveRequest[]>(`${BASE_URL}/leave_requests`); },
  // Fixed path to match server.js /api/leave_requests
  async saveLeaveRequest(record: LeaveRequest): Promise<void> { return handleRequest<void>(`${BASE_URL}/leave_requests`, { method: 'POST', body: JSON.stringify(record) }); },
  // Fixed path to match server.js /api/leave_requests
  async deleteLeaveRequest(id: string): Promise<void> { return handleRequest<void>(`${BASE_URL}/leave_requests/${id}`, { method: 'DELETE' }); },

  async getUsers(): Promise<User[]> { return handleRequest<User[]>(`${BASE_URL}/users`); },
  async saveUser(user: User): Promise<void> { return handleRequest<void>(`${BASE_URL}/users`, { method: 'POST', body: JSON.stringify(user) }); },
  async deleteUser(id: string): Promise<void> { return handleRequest<void>(`${BASE_URL}/users/${id}`, { method: 'DELETE' }); },

  async getRoles(): Promise<Role[]> { return handleRequest<Role[]>(`${BASE_URL}/roles`); },
  async getNotifications(userId: string): Promise<Notification[]> { return handleRequest<Notification[]>(`${BASE_URL}/notifications/${userId}`); },
  async markNotificationsAsRead(ids: number[]): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/notifications/read`, { method: 'POST', body: JSON.stringify({ ids }) });
  },
  async createNotification(notification: Partial<Notification>): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/notifications`, { method: 'POST', body: JSON.stringify(notification) });
  }
};
