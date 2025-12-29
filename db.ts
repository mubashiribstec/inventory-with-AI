
import { InventoryItem, Movement, Supplier, LocationRecord, License, MaintenanceLog, Category, Employee, Department, AssetRequest } from './types';

const DB_NAME = 'SmartStockDB';
const DB_VERSION = 4; // Bump version for requests store

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
          'employees', 'departments', 'requests'
        ];
        
        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id', autoIncrement: false });
          }
        });
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
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
  async saveSupplier(supplier: Supplier): Promise<void> { return this.put('suppliers', supplier); }

  async getAllLocations(): Promise<LocationRecord[]> { return this.getAll<LocationRecord>('locations'); }
  async saveLocation(location: LocationRecord): Promise<void> { return this.put('locations', location); }

  async getAllLicenses(): Promise<License[]> { return this.getAll<License>('licenses'); }
  async saveLicense(license: License): Promise<void> { return this.put('licenses', license); }

  async getAllMaintenance(): Promise<MaintenanceLog[]> { return this.getAll<MaintenanceLog>('maintenance'); }
  async saveMaintenance(log: MaintenanceLog): Promise<void> { return this.put('maintenance', log); }

  async getAllCategories(): Promise<Category[]> { return this.getAll<Category>('categories'); }
  async saveCategory(cat: Category): Promise<void> { return this.put('categories', cat); }

  async getAllEmployees(): Promise<Employee[]> { return this.getAll<Employee>('employees'); }
  async saveEmployee(emp: Employee): Promise<void> { return this.put('employees', emp); }

  async getAllDepartments(): Promise<Department[]> { return this.getAll<Department>('departments'); }
  async saveDepartment(dept: Department): Promise<void> { return this.put('departments', dept); }

  async getAllRequests(): Promise<AssetRequest[]> { return this.getAll<AssetRequest>('requests'); }
  async saveRequest(req: AssetRequest): Promise<void> { return this.put('requests', req); }
  async deleteRequest(id: string): Promise<void> { return this.delete('requests', id); }

  private async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async put(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async delete(storeName: string, id: any): Promise<void> {
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
