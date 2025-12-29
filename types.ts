
export enum ItemStatus {
  PURCHASED = 'purchased',
  ASSIGNED = 'assigned',
  IN_USE = 'in-use',
  BACKUP = 'backup',
  FAULTY = 'faulty',
  AVAILABLE = 'available',
  ARCHIVED = 'archived'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  serial: string;
  status: ItemStatus;
  location_id?: number;
  supplier_id?: number;
  assignedTo: string;
  department: string;
  purchaseDate: string;
  warranty: string;
  cost?: number;
  location?: string;
  qr_code?: string;
}

export interface Movement {
  id: string;
  date: string;
  item: string;
  from: string;
  to: string;
  employee: string;
  department: string;
  status: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  rating: number;
}

export interface LocationRecord {
  id: number;
  building: string;
  floor: string;
  room: string;
  manager: string;
}

export interface License {
  id: number;
  software_name: string;
  product_key: string;
  total_seats: number;
  assigned_seats: number;
  expiration_date: string;
  supplier_id?: number;
}

export interface MaintenanceLog {
  id: number;
  item_id: string;
  issue_type: string;
  description: string;
  status: 'OPEN' | 'PENDING' | 'FIXED' | 'SCRAPPED';
  cost: number;
  start_date: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  budget: number;
  spent: number;
}

export interface DashboardStats {
  purchased: number;
  assigned: number;
  inUse: number;
  backup: number;
  faulty: number;
  available: number;
  licenses_total: number;
  expiring_soon: number;
}
