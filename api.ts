
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License, Category, Employee, Department } from './types.ts';
import { dbService } from './db.ts';

const BASE_URL = '/api';

const handleRequest = async <T>(url: string, options?: RequestInit, fallbackAction?: () => Promise<T>): Promise<T> => {
  try {
    const res = await fetch(url, options);
    
    if (!res.ok) {
      if (res.status === 404 && fallbackAction) {
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
      return await fallbackAction();
    }
    throw e;
  }
};

export const apiService = {
  async initDatabase(): Promise<{ success: boolean; message: string }> {
    return handleRequest<{ success: boolean; message: string }>(`${BASE_URL}/init-db`, {
      method: 'POST'
    });
  },

  // Items
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
    return handleRequest<void>(`${BASE_URL}/items`, {
      method: 'POST', // Using standard POST with ON DUPLICATE KEY UPDATE in server
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, id })
    });
  },
  async deleteItem(id: string): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/items/${id}`, { method: 'DELETE' }, () => dbService.deleteItem(id));
  },

  // Movements
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

  // Management Entities
  async getCategories(): Promise<Category[]> { return handleRequest<Category[]>(`${BASE_URL}/categories`, {}); },
  async saveCategory(cat: Category): Promise<void> { return handleRequest<void>(`${BASE_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cat) }); },
  
  async getEmployees(): Promise<Employee[]> { return handleRequest<Employee[]>(`${BASE_URL}/employees`, {}); },
  async saveEmployee(emp: Employee): Promise<void> { return handleRequest<void>(`${BASE_URL}/employees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emp) }); },

  async getDepartments(): Promise<Department[]> { return handleRequest<Department[]>(`${BASE_URL}/departments`, {}); },
  async saveDepartment(dept: Department): Promise<void> { return handleRequest<void>(`${BASE_URL}/departments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dept) }); },

  // Others
  async getAllSuppliers(): Promise<Supplier[]> { return handleRequest<Supplier[]>(`${BASE_URL}/suppliers`, {}, () => dbService.getAllSuppliers()); },
  async getAllLocations(): Promise<LocationRecord[]> { return handleRequest<LocationRecord[]>(`${BASE_URL}/locations`, {}, () => dbService.getAllLocations()); },
  async getAllMaintenance(): Promise<MaintenanceLog[]> { return handleRequest<MaintenanceLog[]>(`${BASE_URL}/maintenance_logs`, {}, () => dbService.getAllMaintenance()); }
};
