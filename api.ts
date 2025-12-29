
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License } from './types.ts';
import { dbService } from './db.ts';

const BASE_URL = '/api';

/**
 * Enhanced response handler with Local Fallback.
 * If the API is missing (404) or unreachable, we fallback to the local Edge Database (IndexedDB).
 */
const handleRequest = async <T>(url: string, options?: RequestInit, fallbackAction?: () => Promise<T>): Promise<T> => {
  try {
    const res = await fetch(url, options);
    
    // If we get a 404 or other server errors, and we have a fallback, use it.
    if (!res.ok) {
      if (res.status === 404 && fallbackAction) {
        console.warn(`API Route ${url} not found. Falling back to local database.`);
        return await fallbackAction();
      }
      const text = await res.text();
      throw new Error(`API Error (${res.status}): ${text || 'Unknown Server Error'}`);
    }

    const text = await res.text();
    if (!text || text.trim() === '') return {} as T;
    return JSON.parse(text.trim());
  } catch (e) {
    if (fallbackAction) {
      console.warn(`Connection to ${url} failed. Using local storage.`, e);
      return await fallbackAction();
    }
    throw e;
  }
};

export const apiService = {
  async getAllItems(): Promise<InventoryItem[]> {
    return handleRequest<InventoryItem[]>(`${BASE_URL}/items`, {}, () => dbService.getAllItems());
  },

  async saveItem(item: InventoryItem): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }, () => dbService.saveItem(item));
  },

  async updateItem(id: string, item: Partial<InventoryItem>): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }, async () => {
      const existing = await dbService.getAllItems();
      const itemToUpdate = existing.find(i => i.id === id);
      if (itemToUpdate) {
        await dbService.saveItem({ ...itemToUpdate, ...item } as InventoryItem);
      }
    });
  },

  async deleteItem(id: string): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/items/${id}`, {
      method: 'DELETE'
    }, async () => {
      // IndexedDB delete implementation would go here if needed
      console.log("Local delete requested for", id);
    });
  },

  async getAllSuppliers(): Promise<Supplier[]> {
    return handleRequest<Supplier[]>(`${BASE_URL}/suppliers`, {}, () => dbService.getAllSuppliers());
  },

  async getAllLocations(): Promise<LocationRecord[]> {
    return handleRequest<LocationRecord[]>(`${BASE_URL}/locations`, {}, () => dbService.getAllLocations());
  },

  async getAllMaintenance(): Promise<MaintenanceLog[]> {
    return handleRequest<MaintenanceLog[]>(`${BASE_URL}/maintenance`, {}, () => dbService.getAllMaintenance());
  },

  async getAllMovements(): Promise<Movement[]> {
    return handleRequest<Movement[]>(`${BASE_URL}/movements`, {}, () => dbService.getAllMovements());
  },

  async saveMovement(movement: Movement): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movement)
    }, () => dbService.saveMovement(movement));
  },
  
  async getAllLicenses(): Promise<License[]> {
    return handleRequest<License[]>(`${BASE_URL}/licenses`, {}, () => dbService.getAllLicenses());
  }
};
