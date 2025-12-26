
import { ItemStatus, InventoryItem, Movement } from '../types';

export const initialItems: InventoryItem[] = [
  {
    id: 'IT-001',
    name: 'Dell Latitude 5440',
    category: 'Computers',
    serial: 'DL-2024-001',
    status: ItemStatus.IN_USE,
    location: 'IT Dept',
    assignedTo: 'John Smith',
    department: 'IT',
    purchaseDate: '2024-01-15',
    warranty: '2025-01-15'
  },
  {
    id: 'IT-002',
    name: 'Apple MacBook Pro 16',
    category: 'Computers',
    serial: 'MBP-2024-001',
    status: ItemStatus.ASSIGNED,
    location: 'Marketing Office',
    assignedTo: 'Sarah Johnson',
    department: 'Marketing',
    purchaseDate: '2024-02-10',
    warranty: '2025-02-10'
  },
  {
    id: 'IT-003',
    name: 'Cisco Catalyst Switch',
    category: 'Networking',
    serial: 'CS-2024-001',
    status: ItemStatus.BACKUP,
    location: 'Server Room',
    assignedTo: '-',
    department: '-',
    purchaseDate: '2024-03-05',
    warranty: '2025-03-05'
  },
  {
    id: 'IT-004',
    name: 'HP LaserJet Enterprise',
    category: 'Peripherals',
    serial: 'HP-2024-001',
    status: ItemStatus.FAULTY,
    location: 'Maintenance Hub',
    assignedTo: '-',
    department: '-',
    purchaseDate: '2024-01-20',
    warranty: '2025-01-20'
  },
  {
    id: 'IT-005',
    name: 'USB-C Universal Dock',
    category: 'Accessories',
    serial: 'UD-2024-001',
    status: ItemStatus.AVAILABLE,
    location: 'IT Store',
    assignedTo: '-',
    department: '-',
    purchaseDate: '2024-02-28',
    warranty: '2025-02-28'
  },
  {
    id: 'IT-006',
    name: 'Logitech MX Master 3S',
    category: 'Accessories',
    serial: 'MX-2024-882',
    status: ItemStatus.IN_USE,
    location: 'Finance Suite',
    assignedTo: 'Robert Chen',
    department: 'Finance',
    purchaseDate: '2024-03-12',
    warranty: '2025-03-12'
  }
];

export const initialMovements: Movement[] = [
  {
    id: 'MOV-001',
    date: '2024-03-20',
    item: 'Dell Latitude 5440',
    from: 'IT Store',
    to: 'John Smith',
    employee: 'John Smith',
    department: 'IT',
    status: 'ASSIGNED'
  },
  {
    id: 'MOV-002',
    date: '2024-03-19',
    item: 'Cisco Catalyst Switch',
    from: 'Server Room',
    to: 'Backup',
    employee: '-',
    department: '-',
    status: 'TRANSFERRED'
  },
  {
    id: 'MOV-003',
    date: '2024-03-18',
    item: 'HP LaserJet Enterprise',
    from: 'Marketing',
    to: 'Maintenance',
    employee: '-',
    department: '-',
    status: 'FAULTY'
  }
];
