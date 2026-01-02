
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License, Category, Employee, Department, PersonalBudget, AssetRequest, User, UserLog, AttendanceRecord, LeaveRequest, Role, Notification, SystemSettings } from './types.ts';
import { dbService } from './db.ts';

declare var google: any;

const isGAS = typeof google !== 'undefined' && google.script && google.script.run;

const gasRequest = <T>(funcName: string, ...args: any[]): Promise<T> => {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((res: T) => resolve(res))
      .withFailureHandler((err: Error) => reject(err))
      [funcName](...args);
  });
};

export const apiService = {
  // Authentication
  async login(username, password): Promise<User> {
    // 1. Always try backend login first for cross-browser support
    try {
      if (isGAS) {
        const user = await gasRequest<User>('apiLogin', username, password);
        // Sync this user locally for offline access
        await dbService.saveUser(user);
        return user;
      } else {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (response.ok) {
          const user = await response.json();
          await dbService.saveUser(user);
          return user;
        }
      }
    } catch (e) {
      console.warn("Backend login failed, attempting local fallback...");
    }

    // 2. Fallback to local DB if backend is unreachable
    const users = await dbService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      if (user.is_active === false) throw new Error("Account is disabled. Contact administrator.");
      return user;
    }
    throw new Error("Invalid Credentials or Backend Unreachable");
  },

  // Cloud Sync Feature
  async syncToCloud() {
    if (!isGAS) return { success: false, error: "Cloud sync only available in Google Drive mode." };
    const fullData = {
      items: await dbService.getAllItems(),
      movements: await dbService.getAllMovements(),
      suppliers: await dbService.getAllSuppliers(),
      locations: await dbService.getAllLocations(),
      maintenance: await dbService.getAllMaintenance(),
      licenses: await dbService.getAllLicenses(),
      categories: await dbService.getAllCategories(),
      employees: await dbService.getAllEmployees(),
      departments: await dbService.getAllDepartments(),
      budgets: await dbService.getAll<PersonalBudget>('budgets' as any),
      users: await dbService.getUsers(),
      settings: [await dbService.getSettings()], // Wrapped in array for GAS collection logic
      attendance: await dbService.getAttendance(),
      leaves: await dbService.getLeaveRequests(),
      roles: await dbService.getRoles()
    };
    return gasRequest<any>('syncFullDatabase', fullData);
  },

  // Settings - Priority given to Backend
  async getSettings(): Promise<SystemSettings> {
    try {
      if (isGAS) {
        const arr = await gasRequest<SystemSettings[]>('getCollection', 'Settings');
        if (arr && arr.length > 0) {
          const s = arr[0];
          await dbService.saveSettings(s); // Update local cache
          return s;
        }
      } else {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const s = await res.json();
          if (s.id) {
            await dbService.saveSettings(s);
            return s;
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch remote settings, using local.");
    }
    return dbService.getSettings();
  },

  async updateSettings(s: SystemSettings) {
    // 1. Update Remote
    if (isGAS) {
      await gasRequest<void>('apiUpsert', 'Settings', s);
    } else {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s)
      });
    }
    // 2. Update Local Cache
    return dbService.saveSettings(s);
  },

  // Generic Inventory & Personnel
  async getAllItems(): Promise<InventoryItem[]> { return isGAS ? gasRequest('getCollection', 'Items') : dbService.getAllItems(); },
  async saveItem(item: InventoryItem) { if (isGAS) await gasRequest('apiUpsert', 'Items', item); return dbService.saveItem(item); },
  async deleteItem(id: string) { if (isGAS) await gasRequest('apiDelete', 'Items', id); return dbService.deleteItem(id); },
  
  async getEmployees(): Promise<Employee[]> { return isGAS ? gasRequest('getCollection', 'Employees') : dbService.getAllEmployees(); },
  async saveEmployee(e: Employee) { if (isGAS) await gasRequest('apiUpsert', 'Employees', e); return dbService.saveEmployee(e); },
  async deleteEmployee(id: string) { if (isGAS) await gasRequest('apiDelete', 'Employees', id); return dbService.deleteEmployee(id); },

  async getDepartments(): Promise<Department[]> { return isGAS ? gasRequest('getCollection', 'Departments') : dbService.getAllDepartments(); },
  async saveDepartment(d: Department) { if (isGAS) await gasRequest('apiUpsert', 'Departments', d); return dbService.saveDepartment(d); },

  async getBudgets(): Promise<PersonalBudget[]> { return isGAS ? gasRequest('getCollection', 'Budgets') : dbService.getAll<PersonalBudget>('budgets' as any); },
  async saveBudget(b: PersonalBudget) { if (isGAS) await gasRequest('apiUpsert', 'Budgets', b); return dbService.put('budgets' as any, b); },

  async getCategories(): Promise<Category[]> { return isGAS ? gasRequest('getCollection', 'Categories') : dbService.getAllCategories(); },
  async getAllMovements(): Promise<Movement[]> { return isGAS ? gasRequest('getCollection', 'Movements') : dbService.getAllMovements(); },
  async getAllSuppliers(): Promise<Supplier[]> { return isGAS ? gasRequest('getCollection', 'Suppliers') : dbService.getAllSuppliers(); },
  async getAllLocations(): Promise<LocationRecord[]> { return isGAS ? gasRequest('getCollection', 'Locations') : dbService.getAllLocations(); },
  async getAllMaintenance(): Promise<MaintenanceLog[]> { return isGAS ? gasRequest('getCollection', 'Maintenance') : dbService.getAllMaintenance(); },
  async getAllLicenses(): Promise<License[]> { return isGAS ? gasRequest('getCollection', 'Licenses') : dbService.getAllLicenses(); },
  async getAllRequests(): Promise<AssetRequest[]> { return isGAS ? gasRequest('getCollection', 'Requests') : dbService.getAllRequests(); },
  
  // Users fetch prioritized from backend
  async getUsers(): Promise<User[]> { 
    if (isGAS) return gasRequest<User[]>('getCollection', 'Users').then(async users => {
      for (const u of users) await dbService.saveUser(u);
      return users;
    });
    return dbService.getUsers(); 
  },
  
  async saveUser(u: User) { if (isGAS) await gasRequest('apiUpsert', 'Users', u); return dbService.saveUser(u); },
  async getRoles(): Promise<Role[]> { return isGAS ? gasRequest('getCollection', 'Roles') : dbService.getRoles(); },
  async getNotifications(uid: string): Promise<Notification[]> { return isGAS ? gasRequest('getCollection', 'Notifications') : dbService.getNotifications(uid); },
  async getAttendance(): Promise<AttendanceRecord[]> { return isGAS ? gasRequest('getCollection', 'Attendance') : dbService.getAttendance(); },
  async saveAttendance(r: AttendanceRecord) { if (isGAS) await gasRequest('apiUpsert', 'Attendance', r); return dbService.saveAttendance(r); },
  async getLeaveRequests(): Promise<LeaveRequest[]> { return isGAS ? gasRequest('getCollection', 'Leaves') : dbService.getLeaveRequests(); },
  async saveLeaveRequest(l: LeaveRequest) { if (isGAS) await gasRequest('apiUpsert', 'Leaves', l); return dbService.saveLeaveRequest(l); },

  async deleteLicense(id: any) { if (isGAS) await gasRequest('apiDelete', 'Licenses', id); return dbService.deleteLicense(id); },
  async deleteUser(id: string) { if (isGAS) await gasRequest('apiDelete', 'Users', id); return dbService.deleteUser(id); },
  async deleteAttendance(id: string) { if (isGAS) await gasRequest('apiDelete', 'Attendance', id); return dbService.deleteAttendance(id); },
  async deleteLeaveRequest(id: string) { if (isGAS) await gasRequest('apiDelete', 'Leaves', id); return dbService.deleteLeaveRequest(id); },
  async createNotification(notif: any) { if (isGAS) await gasRequest('apiUpsert', 'Notifications', notif); return dbService.saveNotification(notif); },
  async genericSave(store: string, data: any) { if (isGAS) await gasRequest('apiUpsert', store, data); return dbService.put(store, data); },
  async genericDelete(store: string, id: any) { if (isGAS) await gasRequest('apiDelete', store, id); return dbService.delete(store, id); },
  async markNotificationsAsRead(ids: number[]) {
    if (isGAS) return gasRequest('markNotificationsRead', ids);
    for (const id of ids) {
      const n = await dbService.getNotification(id);
      if (n) {
        n.is_read = true;
        await dbService.put('notifications', n);
      }
    }
  },
  
  async factoryReset() { 
    localStorage.removeItem('smartstock_user');
    await dbService.clearAllData();
    if (isGAS) return gasRequest('factoryReset'); 
    return { success: true };
  },

  async initDatabase(): Promise<{ success: boolean }> { 
    await dbService.init(); 
    if (isGAS) {
      const res = await gasRequest<{ success: boolean }>('setupDatabase');
      // Trigger a silent sync of users and settings on init
      this.getSettings();
      this.getUsers();
      return res;
    }
    return { success: true };
  }
};
