
import { InventoryItem, Movement, Supplier, LocationRecord, License, MaintenanceLog, Category, Employee, Department, AssetRequest, User, UserRole, AttendanceRecord, LeaveRequest, Role, Notification, UserLog } from './types.ts';
import { initialItems, initialMovements } from './services/mockData.ts';

const DB_NAME = 'SmartStockDB';
const DB_VERSION = 6; 

export class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const stores = [
          'items', 'movements', 'suppliers', 'locations', 
          'licenses', 'maintenance', 'categories', 
          'employees', 'departments', 'requests', 'users', 'settings',
          'attendance', 'leave_requests', 'roles', 'notifications', 'user_logs'
        ];
        
        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id', autoIncrement: false });
          }
        });
      };

      request.onsuccess = async () => {
        this.db = request.result;
        await this.seedIfEmpty();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Seeds the local database with mock data for testing purposes
   */
  private async seedIfEmpty(): Promise<void> {
    const items = await this.getAllItems();
    if (items.length === 0) {
      console.log("[DB] Seeding default test data...");
      for (const item of initialItems) await this.saveItem(item);
      for (const mov of initialMovements) await this.saveMovement(mov);
      
      // Default Admin for Demo Mode
      await this.put('users', {
        id: 'U-001',
        username: 'admin',
        password: 'admin123',
        role: UserRole.ADMIN,
        full_name: 'Demo Administrator',
        department: 'IT Infrastructure'
      });

      await this.put('categories', { id: 'CAT-01', name: 'Computers', icon: 'fa-laptop', itemCount: 3 });
      await this.put('settings', { id: 'GLOBAL', software_name: 'SmartStock Demo', primary_color: 'indigo' });
    }
  }

  /**
   * PERMANENTLY clears all data from all object stores
   */
  async clearAllData(): Promise<void> {
    if (!this.db) return;
    const stores = Array.from(this.db.objectStoreNames);
    const transaction = this.db.transaction(stores, 'readwrite');
    
    return new Promise((resolve, reject) => {
      stores.forEach(storeName => {
        transaction.objectStore(storeName).clear();
      });
      transaction.oncomplete = () => {
        localStorage.removeItem('smartstock_user');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAllItems(): Promise<InventoryItem[]> { return this.getAll<InventoryItem>('items'); }
  async saveItem(item: InventoryItem): Promise<void> { return this.put('items', item); }
  async deleteItem(id: string): Promise<void> { return this.delete('items', id); }

  async getAllMovements(): Promise<Movement[]> {
    const movements = await this.getAll<Movement>('movements');
    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  async saveMovement(movement: Movement): Promise<void> { return this.put('movements', movement); }

  async getAllSuppliers(): Promise<Supplier[]> { return this.getAll<Supplier>('suppliers'); }
  async getAllLocations(): Promise<LocationRecord[]> { return this.getAll<LocationRecord>('locations'); }
  async getAllLicenses(): Promise<License[]> { return this.getAll<License>('licenses'); }
  async getAllMaintenance(): Promise<MaintenanceLog[]> { return this.getAll<MaintenanceLog>('maintenance'); }
  async getAllCategories(): Promise<Category[]> { return this.getAll<Category>('categories'); }
  async getAllEmployees(): Promise<Employee[]> { return this.getAll<Employee>('employees'); }
  async getAllDepartments(): Promise<Department[]> { return this.getAll<Department>('departments'); }
  async getAllRequests(): Promise<AssetRequest[]> { return this.getAll<AssetRequest>('requests'); }

  // Attendance management fallback
  async getAttendance(): Promise<AttendanceRecord[]> { return this.getAll<AttendanceRecord>('attendance'); }
  async saveAttendance(record: AttendanceRecord): Promise<void> { return this.put('attendance', record); }
  async deleteAttendance(id: string): Promise<void> { return this.delete('attendance', id); }

  // Leave requests management fallback
  async getLeaveRequests(): Promise<LeaveRequest[]> { return this.getAll<LeaveRequest>('leave_requests'); }
  async saveLeaveRequest(request: LeaveRequest): Promise<void> { return this.put('leave_requests', request); }
  async deleteLeaveRequest(id: string): Promise<void> { return this.delete('leave_requests', id); }

  // Role management fallback
  async getRoles(): Promise<Role[]> { return this.getAll<Role>('roles'); }

  // Notification management fallback
  async getNotifications(userId: string): Promise<Notification[]> { 
    const all = await this.getAll<Notification>('notifications');
    if (userId === 'ADMIN' || userId.startsWith('U-001')) return all;
    return all.filter(n => n.recipient_id === userId);
  }
  async saveNotification(notif: any): Promise<void> { 
    if (!notif.id) notif.id = Date.now();
    return this.put('notifications', notif); 
  }
  async getNotification(id: number): Promise<Notification | undefined> {
    const all = await this.getAll<Notification>('notifications');
    return all.find(n => n.id === id);
  }

  // System logs fallback
  async getSystemLogs(): Promise<UserLog[]> { return this.getAll<UserLog>('user_logs'); }

  // User management for mock login
  async getUsers(): Promise<User[]> { return this.getAll<User>('users'); }
  async saveUser(user: User): Promise<void> { return this.put('users', user); }
  async deleteUser(id: string): Promise<void> { return this.delete('users', id); }

  // Employee management fallback
  async saveEmployee(employee: Employee): Promise<void> { return this.put('employees', employee); }

  // License management fallback
  async deleteLicense(id: any): Promise<void> { return this.delete('licenses', id); }

  async getSettings(): Promise<any> { 
    const all = await this.getAll<any>('settings');
    return all[0] || { id: 'GLOBAL', software_name: 'SmartStock Pro', primary_color: 'indigo' };
  }
  async saveSettings(settings: any): Promise<void> { return this.put('settings', settings); }

  private async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async put(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async delete(storeName: string, id: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbService = new DatabaseService();
