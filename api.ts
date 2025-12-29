
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License, Category, Employee, Department, AssetRequest } from './types.ts';
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

  // Generic Save/Delete Helper
  async genericSave(endpoint: string, data: any): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },
  async genericDelete(endpoint: string, id: string | number): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/${endpoint}/${id}`, { method: 'DELETE' });
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, id })
    }, async () => {
      const all = await dbService.getAllItems();
      const match = all.find(i => i.id === id);
      if (match) await dbService.saveItem({ ...match, ...item });
    });
  },
  async deleteItem(id: string): Promise<void> {
    return handleRequest<void>(`${BASE_URL}/items/${id}`, { method: 'DELETE' }, () => dbService.deleteItem(id));
  },

  // Management Entities
  async getCategories(): Promise<Category[]> { return handleRequest<Category[]>(`${BASE_URL}/categories`, {}, () => dbService.getAllCategories()); },
  async saveCategory(cat: Category): Promise<void> { return this.genericSave('categories', cat); },
  async deleteCategory(id: string): Promise<void> { return this.genericDelete('categories', id); },
  
  async getEmployees(): Promise<Employee[]> { return handleRequest<Employee[]>(`${BASE_URL}/employees`, {}, () => dbService.getAllEmployees()); },
  async saveEmployee(emp: Employee): Promise<void> { return this.genericSave('employees', emp); },
  async deleteEmployee(id: string): Promise<void> { return this.genericDelete('employees', id); },

  async getDepartments(): Promise<Department[]> { return handleRequest<Department[]>(`${BASE_URL}/departments`, {}, () => dbService.getAllDepartments()); },
  async saveDepartment(dept: Department): Promise<void> { return this.genericSave('departments', dept); },
  async deleteDepartment(id: string): Promise<void> { return this.genericDelete('departments', id); },

  // Maintenance & Tickets
  async getAllMaintenance(): Promise<MaintenanceLog[]> { return handleRequest<MaintenanceLog[]>(`${BASE_URL}/maintenance_logs`, {}, () => dbService.getAllMaintenance()); },
  async saveMaintenance(log: MaintenanceLog): Promise<void> { return this.genericSave('maintenance_logs', log); },
  async deleteMaintenance(id: number): Promise<void> { return this.genericDelete('maintenance_logs', id); },

  // Licenses
  async getAllLicenses(): Promise<License[]> { return handleRequest<License[]>(`${BASE_URL}/licenses`, {}, () => dbService.getAllLicenses()); },
  async saveLicense(license: License): Promise<void> { return this.genericSave('licenses', license); },
  async deleteLicense(id: number): Promise<void> { return this.genericDelete('licenses', id); },

  // Requests
  async getAllRequests(): Promise<AssetRequest[]> { return handleRequest<AssetRequest[]>(`${BASE_URL}/requests`, {}, () => dbService.getAllRequests()); },
  async saveRequest(req: AssetRequest): Promise<void> { return handleRequest<void>(`${BASE_URL}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  }, () => dbService.saveRequest(req)); },
  async deleteRequest(id: string): Promise<void> { return handleRequest<void>(`${BASE_URL}/requests/${id}`, { method: 'DELETE' }, () => dbService.deleteRequest(id)); },

  // Others
  async getAllMovements(): Promise<Movement[]> { return handleRequest<Movement[]>(`${BASE_URL}/movements`, {}, () => dbService.getAllMovements()); },
  async saveMovement(movement: Movement): Promise<void> { return this.genericSave('movements', movement); },
  async getAllSuppliers(): Promise<Supplier[]> { return handleRequest<Supplier[]>(`${BASE_URL}/suppliers`, {}, () => dbService.getAllSuppliers()); },
  async getAllLocations(): Promise<LocationRecord[]> { return handleRequest<LocationRecord[]>(`${BASE_URL}/locations`, {}, () => dbService.getAllLocations()); }
};
