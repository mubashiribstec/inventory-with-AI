

export enum ItemStatus {
  PURCHASED = 'purchased',
  ASSIGNED = 'assigned',
  IN_USE = 'in-use',
  BACKUP = 'backup',
  FAULTY = 'faulty',
  AVAILABLE = 'available',
  ARCHIVED = 'archived'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  HR = 'HR',
  STAFF = 'STAFF'
}

export interface SystemSettings {
  id: string;
  software_name: string;
  primary_color: string;
  software_description?: string;
  software_logo?: string;
}

export interface Role {
  id: string; 
  label: string;
  description: string;
  permissions: string; 
  color: string;
  icon?: string;
  updated_at?: string;
}

export const PERMISSION_GROUPS = {
  INVENTORY: [
    { key: 'inventory.view', label: 'View Assets', desc: 'Read-only access to hardware registry' },
    { key: 'inventory.edit', label: 'Modify Assets', desc: 'Edit details, transfer or delete assets' },
    { key: 'inventory.procure', label: 'Procurement', desc: 'Create new purchase records' },
  ],
  HR: [
    { key: 'hr.view', label: 'View Staff', desc: 'Access to staff directory and hierarchy' },
    { key: 'hr.attendance', label: 'Manage Attendance', desc: 'Edit or delete attendance logs' },
    { key: 'hr.leaves', label: 'Approve Leaves', desc: 'Approve or reject leave applications' },
    { key: 'hr.users', label: 'Manage Accounts', desc: 'Create and configure user credentials' },
    { key: 'hr.salaries', label: 'Salary Management', desc: 'Access to payroll and tenure-based earnings' },
  ],
  ANALYTICS: [
    { key: 'analytics.view', label: 'View Dashboards', desc: 'Access to high-level metric summaries' },
    { key: 'analytics.financials', label: 'Budget Tracking', desc: 'View departmental budget spending' },
    { key: 'analytics.logs', label: 'System Audit', desc: 'Read-only access to system activity logs' },
  ],
  SYSTEM: [
    { key: 'system.roles', label: 'Role Configuration', desc: 'Modify permissions for all system roles' },
    { key: 'system.db', label: 'Database Control', desc: 'Initialize or wipe system datasets' },
    { key: 'system.settings', label: 'System Settings', desc: 'Modify software name and visual themes' },
  ]
};

export interface Notification {
  id: number;
  recipient_id: string;
  sender_name: string;
  message: string;
  type: 'ATTENDANCE' | 'SYSTEM' | 'LEAVE' | 'REQUEST';
  is_read: boolean;
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  full_name: string;
  department: string;
  avatar?: string;
  shift_start_time?: string; 
  team_lead_id?: string;
  manager_id?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  team_lead_id?: string;
  manager_id?: string;
  joining_date?: string;
}

export interface UserLog {
  id: number;
  user_id: string;
  username: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  timestamp: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  username: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'PRESENT' | 'LATE' | 'ON-LEAVE' | 'ABSENT' | 'HALF-DAY';
  location?: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  username: string;
  start_date: string;
  end_date: string;
  leave_type: 'VACATION' | 'SICK' | 'CASUAL' | 'OTHER';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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

// Added head property to match database schema used in departmental views
export interface Department {
  id: string;
  name: string;
  manager: string;
  head?: string;
}

export interface PersonalBudget {
  id: string;
  person_name: string;
  total_limit: number;
  spent_amount: number;
  category: string;
  notes?: string;
}

export interface AssetRequest {
  id: string;
  item: string;
  employee: string;
  department: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Fulfilled';
  request_date: string;
  notes?: string;
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