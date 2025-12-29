
import { InventoryItem, Movement, Supplier, LocationRecord, License, MaintenanceLog } from './types';

const DB_NAME = 'SmartStockDB';
const DB_VERSION = 2; // Increment version for new stores

export class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const stores = ['items', 'movements', 'suppliers', 'locations', 'licenses', 'maintenance'];
        
        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id', autoIncrement: store !== 'items' && store !== 'movements' });
          }
        });
        
        // Items and Movements use string IDs, others might use numeric auto-increment
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAllItems(): Promise<InventoryItem[]> {
    return this.getAll<InventoryItem>('items');
  }

  async saveItem(item: InventoryItem): Promise<void> {
    return this.put('items', item);
  }

  // Add deleteItem to support asset removal
  async deleteItem(id: string): Promise<void> {
    return this.delete('items', id);
  }

  async getAllMovements(): Promise<Movement[]> {
    const movements = await this.getAll<Movement>('movements');
    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async saveMovement(movement: Movement): Promise<void> {
    return this.put('movements', movement);
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return this.getAll<Supplier>('suppliers');
  }

  async saveSupplier(supplier: Supplier): Promise<void> {
    return this.put('suppliers', supplier);
  }

  async getAllLocations(): Promise<LocationRecord[]> {
    return this.getAll<LocationRecord>('locations');
  }

  async saveLocation(location: LocationRecord): Promise<void> {
    return this.put('locations', location);
  }

  async getAllLicenses(): Promise<License[]> {
    return this.getAll<License>('licenses');
  }

  async saveLicense(license: License): Promise<void> {
    return this.put('licenses', license);
  }

  async getAllMaintenance(): Promise<MaintenanceLog[]> {
    return this.getAll<MaintenanceLog>('maintenance');
  }

  async saveMaintenance(log: MaintenanceLog): Promise<void> {
    return this.put('maintenance', log);
  }

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

  // Generic delete method for IndexedDB stores
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
