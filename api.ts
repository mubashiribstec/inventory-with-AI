
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License, Category, Employee, Department, PersonalBudget, AssetRequest, User, UserLog, AttendanceRecord, LeaveRequest, Role, Notification, SystemSettings } from './types.ts';
import { dbService } from './db.ts';

const API_BASE = '/api';

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
    let lastError = "Initialization timed out or failed.";
    
    // Retry loop to handle MariaDB boot time in Docker
    for (let i = 0; i < 5; i++) {
        try {
            const res = await fetch(`${API_BASE}/init-db`, { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ force })
            });
            const data = await res.json().catch(() => ({}));
            
            if (res.ok) {
                await this.getSettings();
                return { success: true };
            } else {
                lastError = data.error || data.details || `Server Status ${res.status}`;
                // If it's a 503 (Initializing), we wait. If it's 500 or 4xx, we report.
                if (res.status !== 503) break;
            }
        } catch (e: any) {
            lastError = e.message;
        }
        await new Promise(r => setTimeout(r, 3000));
    }
    throw new Error(lastError);
  },

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
    } catch (e) {}
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server Error: ${res.statusText}`);
    }
    return res.json();
  },

  async del(path: string, id: string | number): Promise<any> {
    const res = await fetch(`${API_BASE}/${id ? path+'/'+id : path}`, { method: 'DELETE' });
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
  // Added missing deleteLicense method to fix component error
  async deleteLicense(id: string | number) { return this.del('licenses', id); },
  async getAllRequests(): Promise<AssetRequest[]> { return this.get('requests'); },
  async getUsers(): Promise<User[]> { return this.get('users'); },
  async saveUser(u: User) { return this.post('users', u); },
  async deleteUser(id: string) { return this.del('users', id); },
  async getRoles(): Promise<Role[]> { return this.get('roles'); },
  async getNotifications(uid: string): Promise<Notification[]> { return this.get(`notifications/${uid}`); },
  // Added missing createNotification method to fix component error
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
      users: await this.getUsers(),
      settings: await this.getSettings()
    };
  },

  // Added missing importFullDataSnapshot method to fix component error
  async importFullDataSnapshot(data: any) {
    return dbService.bulkImport(data);
  }
};
