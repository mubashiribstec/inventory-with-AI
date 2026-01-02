
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License, Category, Employee, Department, PersonalBudget, AssetRequest, User, UserLog, AttendanceRecord, LeaveRequest, Role, Notification, SystemSettings } from './types.ts';
import { dbService } from './db.ts';

declare var google: any;

const BASE_URL = '/api';
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
    if (isGAS) return gasRequest<User>('apiLogin', username, password);
    const users = await dbService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) return user;
    throw new Error("Invalid Credentials");
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
      budgets: await dbService.put('budgets', []), // Placeholder to ensure collection exists
      users: await dbService.getUsers(),
      settings: await dbService.getSettings(),
      attendance: await dbService.getAttendance(),
      leaves: await dbService.getLeaveRequests(),
      roles: await dbService.getRoles()
    };
    return gasRequest<any>('syncFullDatabase', fullData);
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    if (isGAS) return gasRequest<SystemSettings>('getCollection', 'Settings').then(arr => (Array.isArray(arr) ? arr[0] : arr) as SystemSettings);
    return dbService.getSettings();
  },

  async updateSettings(s: SystemSettings) {
    if (isGAS) return gasRequest<void>('apiUpsert', 'Settings', s);
    return dbService.saveSettings(s);
  },

  // Department Management
  async getDepartments(): Promise<Department[]> {
    if (isGAS) return gasRequest<Department[]>('getCollection', 'Departments');
    return dbService.getAllDepartments();
  },

  async saveDepartment(d: Department) {
    if (isGAS) await gasRequest<void>('apiUpsert', 'Departments', d);
    return dbService.saveDepartment(d);
  },

  // Personal Budget Management (Independent)
  async getBudgets(): Promise<PersonalBudget[]> {
    if (isGAS) return gasRequest<PersonalBudget[]>('getCollection', 'Budgets');
    /* Fixed: getAll is now public in dbService */
    return dbService.getAll<PersonalBudget>('budgets' as any);
  },

  async saveBudget(b: PersonalBudget) {
    if (isGAS) await gasRequest<void>('apiUpsert', 'Budgets', b);
    return dbService.put('budgets' as any, b);
  },

  // Generic Inventory & Personnel
  async getAllItems(): Promise<InventoryItem[]> { return isGAS ? gasRequest('getCollection', 'Items') : dbService.getAllItems(); },
  async saveItem(item: InventoryItem) { if (isGAS) await gasRequest('apiUpsert', 'Items', item); return dbService.saveItem(item); },
  async deleteItem(id: string) { if (isGAS) await gasRequest('apiDelete', 'Items', id); return dbService.deleteItem(id); },
  
  async getEmployees(): Promise<Employee[]> { return isGAS ? gasRequest('getCollection', 'Employees') : dbService.getAllEmployees(); },
  async saveEmployee(e: Employee) { if (isGAS) await gasRequest('apiUpsert', 'Employees', e); return dbService.saveEmployee(e); },

  async getCategories(): Promise<Category[]> { return isGAS ? gasRequest('getCollection', 'Categories') : dbService.getAllCategories(); },
  async getAllMovements(): Promise<Movement[]> { return isGAS ? gasRequest('getCollection', 'Movements') : dbService.getAllMovements(); },
  async getAllSuppliers(): Promise<Supplier[]> { return isGAS ? gasRequest('getCollection', 'Suppliers') : dbService.getAllSuppliers(); },
  async getAllLocations(): Promise<LocationRecord[]> { return isGAS ? gasRequest('getCollection', 'Locations') : dbService.getAllLocations(); },
  async getAllMaintenance(): Promise<MaintenanceLog[]> { return isGAS ? gasRequest('getCollection', 'Maintenance') : dbService.getAllMaintenance(); },
  async getAllLicenses(): Promise<License[]> { return isGAS ? gasRequest('getCollection', 'Licenses') : dbService.getAllLicenses(); },
  async getAllRequests(): Promise<AssetRequest[]> { return isGAS ? gasRequest('getCollection', 'Requests') : dbService.getAllRequests(); },
  
  async getUsers(): Promise<User[]> { return isGAS ? gasRequest('getCollection', 'Users') : dbService.getUsers(); },
  async saveUser(u: User) { if (isGAS) await gasRequest('apiUpsert', 'Users', u); return dbService.saveUser(u); },
  async getRoles(): Promise<Role[]> { return isGAS ? gasRequest('getCollection', 'Roles') : dbService.getRoles(); },
  async getNotifications(uid: string): Promise<Notification[]> { return isGAS ? gasRequest('getCollection', 'Notifications') : dbService.getNotifications(uid); },
  async getAttendance(): Promise<AttendanceRecord[]> { return isGAS ? gasRequest('getCollection', 'Attendance') : dbService.getAttendance(); },
  async saveAttendance(r: AttendanceRecord) { if (isGAS) await gasRequest('apiUpsert', 'Attendance', r); return dbService.saveAttendance(r); },
  async getLeaveRequests(): Promise<LeaveRequest[]> { return isGAS ? gasRequest('getCollection', 'Leaves') : dbService.getLeaveRequests(); },
  async saveLeaveRequest(l: LeaveRequest) { if (isGAS) await gasRequest('apiUpsert', 'Leaves', l); return dbService.saveLeaveRequest(l); },

  /* Fixed: Added missing methods needed by components */
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
  async factoryReset() { if (isGAS) return gasRequest('factoryReset'); return dbService.clearAllData(); },
  async put(store: string, data: any) { if (isGAS) await gasRequest('apiUpsert', store, data); return dbService.put(store, data); },
  
  /* Fixed: initDatabase now returns a typed result with success property to avoid TS errors in Login.tsx */
  async initDatabase(): Promise<{ success: boolean }> { 
    if (isGAS) return gasRequest<{ success: boolean }>('setupDatabase');
    await dbService.init(); 
    return { success: true };
  }
};
