
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License, Category, Employee, Department, AssetRequest, User, UserLog, AttendanceRecord, LeaveRequest, Role, Notification, SystemSettings } from './types.ts';
import { dbService } from './db.ts';

const BASE_URL = '/api';

// Simple session helper
const getUserContext = () => {
  const user = localStorage.getItem('smartstock_user');
  return user ? JSON.parse(user) : null;
};

const handleRequest = async <T>(url: string, options: RequestInit = {}, fallbackAction?: () => Promise<T>): Promise<T> => {
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
      throw new Error(`API Error (${res.status}): ${text || 'Unknown Error'}`);
    }

    const text = await res.text();
    if (!text || text.trim() === '') return {} as T;
    return JSON.parse(text.trim());
  } catch (e) {
    if (fallbackAction) return await fallbackAction();
    throw e;
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

  async getSystemLogs(): Promise<UserLog[]> {
    return handleRequest<UserLog[]>(`${BASE_URL}/system-logs`);
  },

  async getSettings(): Promise<SystemSettings> {
    return handleRequest<SystemSettings>(`${BASE_URL}/settings`);
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/settings`, {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  },

  // Generic Save Helper
  async genericSave(endpoint: string, data: any): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async genericDelete(endpoint: string, id: string | number): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/${endpoint}/${id}`, { method: 'DELETE' });
  },

  // Specific Entity Methods
  async getAllItems(): Promise<InventoryItem[]> { return handleRequest<InventoryItem[]>(`${BASE_URL}/items`, {}, () => dbService.getAllItems()); },
  async saveItem(item: InventoryItem): Promise<void> { return this.genericSave('items', item); },
  async updateItem(id: string, item: Partial<InventoryItem>): Promise<void> { return this.genericSave('items', { ...item, id }); },
  async deleteItem(id: string): Promise<void> { return this.genericDelete('items', id); },

  async getCategories(): Promise<Category[]> { return handleRequest<Category[]>(`${BASE_URL}/categories`, {}, () => dbService.getAllCategories()); },
  async saveCategory(cat: Category): Promise<void> { return this.genericSave('categories', cat); },
  async deleteCategory(id: string): Promise<void> { return this.genericDelete('categories', id); },
  
  async getEmployees(): Promise<Employee[]> { return handleRequest<Employee[]>(`${BASE_URL}/employees`, {}, () => dbService.getAllEmployees()); },
  async saveEmployee(emp: Employee): Promise<void> { return this.genericSave('employees', emp); },
  async deleteEmployee(id: string): Promise<void> { return this.genericDelete('employees', id); },

  async getDepartments(): Promise<Department[]> { return handleRequest<Department[]>(`${BASE_URL}/departments`, {}, () => dbService.getAllDepartments()); },
  async saveDepartment(dept: Department): Promise<void> { return this.genericSave('departments', dept); },
  async deleteDepartment(id: string): Promise<void> { return this.genericDelete('departments', id); },

  async getAllMaintenance(): Promise<MaintenanceLog[]> { return handleRequest<MaintenanceLog[]>(`${BASE_URL}/maintenance_logs`, {}, () => dbService.getAllMaintenance()); },
  async saveMaintenance(log: MaintenanceLog): Promise<void> { return this.genericSave('maintenance_logs', log); },
  async deleteMaintenance(id: number): Promise<void> { return this.genericDelete('maintenance_logs', id); },

  async getAllLicenses(): Promise<License[]> { return handleRequest<License[]>(`${BASE_URL}/licenses`, {}, () => dbService.getAllLicenses()); },
  async saveLicense(license: License): Promise<void> { return this.genericSave('licenses', license); },
  async deleteLicense(id: number): Promise<void> { return this.genericDelete('licenses', id); },

  async getAllRequests(): Promise<AssetRequest[]> { return handleRequest<AssetRequest[]>(`${BASE_URL}/requests`, {}, () => dbService.getAllRequests()); },
  async saveRequest(req: AssetRequest): Promise<void> { return this.genericSave('requests', req); },
  async deleteRequest(id: string): Promise<void> { return this.genericDelete('requests', id); },

  async getAllMovements(): Promise<Movement[]> { return handleRequest<Movement[]>(`${BASE_URL}/movements`, {}, () => dbService.getAllMovements()); },
  async saveMovement(movement: Movement): Promise<void> { return this.genericSave('movements', movement); },
  async getAllSuppliers(): Promise<Supplier[]> { return handleRequest<Supplier[]>(`${BASE_URL}/suppliers`, {}, () => dbService.getAllSuppliers()); },
  async getAllLocations(): Promise<LocationRecord[]> { return handleRequest<LocationRecord[]>(`${BASE_URL}/locations`, {}, () => dbService.getAllLocations()); },

  // Attendance & Leaves & Users
  async getAttendance(): Promise<AttendanceRecord[]> { return handleRequest<AttendanceRecord[]>(`${BASE_URL}/attendance`); },
  async saveAttendance(record: AttendanceRecord): Promise<void> { return this.genericSave('attendance', record); },
  async deleteAttendance(id: string): Promise<void> { return this.genericDelete('attendance', id); },
  
  async getLeaveRequests(): Promise<LeaveRequest[]> { return handleRequest<LeaveRequest[]>(`${BASE_URL}/leave_requests`); },
  async saveLeaveRequest(record: LeaveRequest): Promise<void> { return this.genericSave('leave_requests', record); },
  async deleteLeaveRequest(id: string): Promise<void> { return this.genericDelete('leave_requests', id); },

  async getUsers(): Promise<User[]> { return handleRequest<User[]>(`${BASE_URL}/users`); },
  async saveUser(user: User): Promise<void> { return this.genericSave('users', user); },
  async deleteUser(id: string): Promise<void> { return this.genericDelete('users', id); },

  // Added getRoles to expose the roles endpoint properly and resolve missing property errors
  async getRoles(): Promise<Role[]> { return handleRequest<Role[]>(`${BASE_URL}/roles`); },

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return handleRequest<Notification[]>(`${BASE_URL}/notifications/${userId}`);
  },
  async markNotificationsAsRead(ids: number[]): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/notifications/read`, {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
  },
  async createNotification(notification: Partial<Notification>): Promise<void> {
    return this.genericSave('notifications', notification);
  }
};
