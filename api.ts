
import { InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License } from './types';
import { dbService } from './db';
import { initialItems, initialMovements } from './services/mockData';

// This service now acts as a bridge to IndexedDB to ensure the app works in environments without a running backend.
export const apiService = {
  async ensureInitialized() {
    await dbService.init();
    const items = await dbService.getAllItems();
    if (items.length === 0) {
      // Seed initial data
      for (const item of initialItems) await dbService.saveItem(item);
      for (const mov of initialMovements) await dbService.saveMovement(mov);
      
      // Seed some mock suppliers and licenses since we don't have them in mockData.ts yet
      await dbService.saveSupplier({ id: 1, name: 'Dell Technologies', contact_person: 'Michael Dell', email: 'support@dell.com', rating: 5 });
      await dbService.saveSupplier({ id: 2, name: 'Apple Inc.', contact_person: 'Tim Cook', email: 'business@apple.com', rating: 4 });
      
      await dbService.saveLicense({ 
        id: 1, 
        software_name: 'Microsoft Office 365', 
        product_key: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', 
        total_seats: 100, 
        assigned_seats: 45, 
        expiration_date: '2025-12-31', 
        supplier_id: 1 
      });

      await dbService.saveLocation({
        id: 1,
        building: 'Headquarters',
        floor: '4th Floor',
        room: 'IT Operations',
        manager: 'Sarah Jenkins'
      });
    }
  },

  async getAllItems(): Promise<InventoryItem[]> {
    await this.ensureInitialized();
    return dbService.getAllItems();
  },

  async saveItem(item: InventoryItem): Promise<void> {
    await this.ensureInitialized();
    await dbService.saveItem(item);
  },

  async getAllSuppliers(): Promise<Supplier[]> {
    await this.ensureInitialized();
    return dbService.getAllSuppliers();
  },

  async getAllLocations(): Promise<LocationRecord[]> {
    await this.ensureInitialized();
    return dbService.getAllLocations();
  },

  async getAllLicenses(): Promise<License[]> {
    await this.ensureInitialized();
    return dbService.getAllLicenses();
  },

  async getAllMaintenance(): Promise<MaintenanceLog[]> {
    await this.ensureInitialized();
    return dbService.getAllMaintenance();
  },

  async saveMaintenance(log: Partial<MaintenanceLog>): Promise<void> {
    await this.ensureInitialized();
    // In a real app we'd handle ID generation better
    const fullLog = { ...log, id: Math.floor(Math.random() * 1000000) } as MaintenanceLog;
    await dbService.saveMaintenance(fullLog);
  },

  async getAllMovements(): Promise<Movement[]> {
    await this.ensureInitialized();
    return dbService.getAllMovements();
  },

  async saveMovement(movement: Movement): Promise<void> {
    await this.ensureInitialized();
    await dbService.saveMovement(movement);
  }
};
