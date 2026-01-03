
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License, Category, Employee, Department, PersonalBudget, AssetRequest, User, UserLog, AttendanceRecord, LeaveRequest, Role, Notification, SystemSettings } from './types.ts';
import { dbService } from './db.ts';

const API_BASE = '/api';

const getHeaders = () => {
  const userStr = localStorage.getItem('smartstock_user');
  const user = userStr ? JSON.parse(userStr) : null;
  return {
    'Content-Type': 'application/json',
    'x-user-id': user?.id || 'SYSTEM',
    'x-username': user?.username || 'SYSTEM'
  };
};

export const apiService = {
  // Authentication
  async login(username, password): Promise<User> {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        let errorMsg = `Login Error (${response.status})`;
        try {
          const data = await response.json();
          errorMsg = data.error || data.details || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const user = await response.json();
      await dbService.saveUser(user); 
      return user;
    } catch (e: any) {
      if (e instanceof TypeError) throw new Error("Backend server unreachable. Verify Docker network.");
      throw e;
    }
  },

  async initDatabase(force = false): Promise<{ success: boolean }> { 
    await dbService.init(); 
    return { success: true };
  },

  async getSettings(retryCount = 0): Promise<SystemSettings> {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (res.ok) {
        const settings = await res.json();
        if (settings && settings.system_id) {
          try { await dbService.saveSettings(settings); } catch(e) {}
          return settings;
        }
      }
      
      // If we got an error or empty ID, retry up to 10 times
      if (retryCount < 10) {
        console.warn(`Settings incomplete. Retrying in 2s... (Attempt ${retryCount + 1})`);
        await new Promise(r => setTimeout(r, 2000));
        return this.getSettings(retryCount + 1);
      }
    } catch (e) {
      if (retryCount < 10) {
        await new Promise(r => setTimeout(r, 2000));
        return this.getSettings(retryCount + 1);
      }
    }
    return dbService.getSettings();
  },

  async updateSettings(s: SystemSettings) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(s)
    });
    
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to sync settings with server.");
    }

    try { await dbService.saveSettings(s); } catch(e) {}
    return s;
  },

  async get<T>(path: string): Promise<T[]> {
    try {
      const res = await fetch(`${API_BASE}/${path}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${res.statusText}`);
      }
      return res.json();
    } catch (e: any) {
      if (e instanceof TypeError) throw new Error("Connection failed. Server offline.");
      throw e;
    }
  },

  async post(path: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server Error: ${res.statusText}`);
    }
    return res.json();
  },

  async del(path: string, id: string | number): Promise<any> {
    const res = await fetch(`${API_BASE}/${id ? path+'/'+id : path}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server Error: ${res.statusText}`);
    }
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
  async deleteLicense(id: string | number) { return this.del('licenses', id); },
  async getAllRequests(): Promise<AssetRequest[]> { return this.get('requests'); },
  async getUsers(): Promise<User[]> { return this.get('users'); },
  async saveUser(u: User) { return this.post('users', u); },
  async deleteUser(id: string) { return this.del('users', id); },
  async getRoles(): Promise<Role[]> { return this.get('roles'); },
  async getNotifications(uid: string): Promise<Notification[]> { return this.get(`notifications/${uid}`); },
  async createNotification(data: any) { return this.post('notifications', data); },
  async markNotificationsAsRead(ids: number[]) { return this.post('notifications/read', { ids }); },
  async getAttendance(): Promise<AttendanceRecord[]> { return this.get('attendance'); },
  async saveAttendance(r: AttendanceRecord) { return this.post('attendance', r); },
  async deleteAttendance(id: string) { return this.del('attendance', id); },
  async getLeaveRequests(): Promise<LeaveRequest[]> { return this.get('leave_requests'); },
  async saveLeaveRequest(l: LeaveRequest) { return this.post('leave_requests', l); },
  async deleteLeaveRequest(id: string) { return this.del('leave_requests', id); },
  async genericSave(store: string, data: any) { return this.post(store, data); },
  async genericDelete(store: string, id: any) { return this.del(store, id); },

  async exportInventoryToCSV(): Promise<string> {
    const items = await this.getAllItems();
    const headers = ['id', 'name', 'category', 'serial', 'status', 'location', 'assignedTo', 'department', 'purchaseDate', 'warranty', 'cost'];
    return [
      headers.join(','),
      ...items.map(item => headers.map(header => `"${String((item as any)[header] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
  }
};
