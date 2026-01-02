
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License, Category, Employee, Department, PersonalBudget, AssetRequest, User, UserLog, AttendanceRecord, LeaveRequest, Role, Notification, SystemSettings } from './types.ts';
import { dbService } from './db.ts';

// No longer using Google Apps Script - Pure MariaDB Mode
const API_BASE = '/api';

export const apiService = {
  // Authentication - Strictly Remote (MariaDB)
  async login(username, password): Promise<User> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      let errorMsg = "Invalid Credentials";
      try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const user = await response.json();
    await dbService.saveUser(user); // Cache for session persistence
    return user;
  },

  // Global Settings - Source of Truth is the MariaDB 'settings' table
  async getSettings(): Promise<SystemSettings> {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok) {
        const s = await res.json();
        if (s.id) {
          await dbService.saveSettings(s);
          return s;
        }
      }
    } catch (e) {
      console.warn("Backend settings unreachable, using local cache.");
    }
    return dbService.getSettings();
  },

  async updateSettings(s: SystemSettings) {
    await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    });
    return dbService.saveSettings(s);
  },

  // Snapshot Features for Local Browser Migration
  async getFullDataSnapshot() {
    return {
      items: await this.getAllItems(),
      movements: await this.getAllMovements(),
      suppliers: await this.getAllSuppliers(),
      locations: await this.getAllLocations(),
      maintenance: await this.getAllMaintenance(),
      licenses: await this.getAllLicenses(),
      categories: await this.getCategories(),
      employees: await this.getEmployees(),
      departments: await this.getDepartments(),
      budgets: await this.getBudgets(),
      users: await this.getUsers(),
      settings: await this.getSettings(),
      attendance: await this.getAttendance(),
      leaves: await this.getLeaveRequests(),
      roles: await this.getRoles()
    };
  },

  async importFullDataSnapshot(data: any) {
    await dbService.bulkImport(data);
    return { success: true };
  },

  async get<T>(path: string): Promise<T[]> {
    const res = await fetch(`${API_BASE}/${path}`);
    if (!res.ok) throw new Error(`Server Error: ${res.statusText}`);
    return res.json();
  },

  async post(path: string, data: any): Promise<any> {
    const userStr = localStorage.getItem('smartstock_user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const res = await fetch(`${API_BASE}/${path}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': user?.id || 'SYSTEM',
        'x-username': user?.username || 'SYSTEM'
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async del(path: string, id: string | number): Promise<any> {
    const userStr = localStorage.getItem('smartstock_user');
    const user = userStr ? JSON.parse(userStr) : null;

    const res = await fetch(`${API_BASE}/${id ? path+'/'+id : path}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': user?.id || 'SYSTEM',
        'x-username': user?.username || 'SYSTEM'
      }
    });
    return res.json();
  },

  async getAllItems(): Promise<InventoryItem[]> { return this.get('items'); },
  async saveItem(item: InventoryItem) { return this.post('items', item); },
  async deleteItem(id: string) { return this.del('items', id); },
  
  async getEmployees(): Promise<Employee[]> { return this.get('employees'); },
  async saveEmployee(e: Employee) { return this.post('employees', e); },
  async deleteEmployee(id: string) { return this.del('employees', id); },
  
  async getDepartments(): Promise<Department[]> { return this.get('departments'); },
  async saveDepartment(d: Department) { return this.post('departments', d); },
  
  async getBudgets(): Promise<PersonalBudget[]> { return this.get('salaries'); },
  async saveBudget(b: PersonalBudget) { return this.post('salaries', b); },
  
  async getCategories(): Promise<Category[]> { return this.get('categories'); },
  async getAllMovements(): Promise<Movement[]> { return this.get('movements'); },
  async getAllSuppliers(): Promise<Supplier[]> { return this.get('suppliers'); },
  async getAllLocations(): Promise<LocationRecord[]> { return this.get('locations'); },
  async getAllMaintenance(): Promise<MaintenanceLog[]> { return this.get('maintenance_logs'); },
  async getAllLicenses(): Promise<License[]> { return this.get('licenses'); },
  async getAllRequests(): Promise<AssetRequest[]> { return this.get('requests'); },
  
  async getUsers(): Promise<User[]> { return this.get('users'); },
  async saveUser(u: User) { return this.post('users', u); },
  async deleteUser(id: string) { return this.del('users', id); },
  
  async getRoles(): Promise<Role[]> { return this.get('roles'); },
  async getNotifications(uid: string): Promise<Notification[]> { return this.get(`notifications/${uid}`); },
  async markNotificationsAsRead(ids: number[]) { return this.post('notifications/read', { ids }); },
  
  async getAttendance(): Promise<AttendanceRecord[]> { return this.get('attendance'); },
  async saveAttendance(r: AttendanceRecord) { return this.post('attendance', r); },
  async deleteAttendance(id: string) { return this.del('attendance', id); },
  
  async getLeaveRequests(): Promise<LeaveRequest[]> { return this.get('leave_requests'); },
  async saveLeaveRequest(l: LeaveRequest) { return this.post('leave_requests', l); },
  async deleteLeaveRequest(id: string) { return this.del('leave_requests', id); },

  async genericSave(store: string, data: any) { 
    const mappedStore = store === 'maintenance' ? 'maintenance_logs' : store;
    return this.post(mappedStore, data); 
  },
  async genericDelete(store: string, id: any) { 
    const mappedStore = store === 'maintenance' ? 'maintenance_logs' : store;
    return this.del(mappedStore, id); 
  },

  async deleteLicense(id: any) { return this.del('licenses', id); },
  async createNotification(notif: any) { return this.post('notifications', notif); },

  async exportInventoryToCSV(): Promise<string> {
    const items = await this.getAllItems();
    if (!items || items.length === 0) return 'ID,Name,Category,Serial,Status,Location,Assigned To,Department,Purchase Date,Warranty,Cost';
    const headers = ['id', 'name', 'category', 'serial', 'status', 'location', 'assignedTo', 'department', 'purchaseDate', 'warranty', 'cost'];
    return [
      headers.join(','),
      ...items.map(item => headers.map(header => `"${String((item as any)[header] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
  },

  async factoryReset() { 
    const res = await fetch(`${API_BASE}/factory-reset`, { method: 'POST' });
    if (res.ok) {
        localStorage.removeItem('smartstock_user');
        await dbService.clearAllData();
        return { success: true };
    }
    throw new Error("Reset Failed");
  },

  async initDatabase(): Promise<{ success: boolean }> { 
    await dbService.init(); 
    try {
        const res = await fetch(`${API_BASE}/init-db`, { method: 'POST' });
        if (res.ok) {
          await this.getSettings();
          return { success: true };
        }
    } catch (e) {
        console.error("Server init probe failed", e);
    }
    return { success: false };
  }
};
