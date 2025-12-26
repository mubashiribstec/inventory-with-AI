import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License } from './types.ts';

const BASE_URL = '/api';

/**
 * Enhanced response handler. 
 * Reads text first to avoid stream controller issues and logs raw response on parse failure.
 */
const handleResponse = async (res: Response) => {
  const text = await res.text();
  
  if (!res.ok) {
    throw new Error(`API Error (${res.status}): ${text || 'Unknown Server Error'}`);
  }

  if (!text || text.trim() === '') {
    return {};
  }

  try {
    // Trim to remove any potential trailing whitespace or non-printable chars from stream
    return JSON.parse(text.trim());
  } catch (e) {
    console.error('Invalid JSON response from server:', text);
    throw new Error('The server sent a response that could not be parsed as JSON.');
  }
};

export const apiService = {
  async getAllItems(): Promise<InventoryItem[]> {
    const res = await fetch(`${BASE_URL}/items`);
    return handleResponse(res);
  },

  async saveItem(item: InventoryItem): Promise<void> {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return handleResponse(res);
  },

  async updateItem(id: string, item: Partial<InventoryItem>): Promise<void> {
    const res = await fetch(`${BASE_URL}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return handleResponse(res);
  },

  async deleteItem(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/items/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  async getAllSuppliers(): Promise<Supplier[]> {
    const res = await fetch(`${BASE_URL}/suppliers`);
    return handleResponse(res);
  },

  async getAllLocations(): Promise<LocationRecord[]> {
    const res = await fetch(`${BASE_URL}/locations`);
    return handleResponse(res);
  },

  async getAllMaintenance(): Promise<MaintenanceLog[]> {
    const res = await fetch(`${BASE_URL}/maintenance`);
    return handleResponse(res);
  },

  async getAllMovements(): Promise<Movement[]> {
    const res = await fetch(`${BASE_URL}/movements`);
    return handleResponse(res);
  },

  async saveMovement(movement: Movement): Promise<void> {
    const res = await fetch(`${BASE_URL}/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movement)
    });
    return handleResponse(res);
  },
  
  async getAllLicenses(): Promise<License[]> {
    // Return empty array for now as per current spec
    return [];
  }
};