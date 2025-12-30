
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import InventoryTable from './components/InventoryTable.tsx';
import MaintenanceList from './components/MaintenanceList.tsx';
import SupplierList from './components/SupplierList.tsx';
import LicenseList from './components/LicenseList.tsx';
import ItemDetails from './components/ItemDetails.tsx';
import EmployeeDetails from './components/EmployeeDetails.tsx';
import BudgetBreakdown from './components/BudgetBreakdown.tsx';
import GenericListView from './components/GenericListView.tsx';
import AttendanceModule from './components/AttendanceModule.tsx';
import LeaveModule from './components/LeaveModule.tsx';
import UserManagement from './components/UserManagement.tsx';
import RoleManagement from './components/RoleManagement.tsx';
import NotificationCenter from './components/NotificationCenter.tsx';
import Login from './components/Login.tsx';
import { ItemStatus, UserRole, User, UserLog, InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, Category, Employee, Department, License, AssetRequest, Notification, Role } from './types.ts';
import Modal from './components/Modal.tsx';
import PurchaseForm from './components/PurchaseForm.tsx';
import AssignmentForm from './components/AssignmentForm.tsx';
import ManagementForm from './components/ManagementForm.tsx';
import MaintenanceForm from './components/MaintenanceForm.tsx';
import LicenseForm from './components/LicenseForm.tsx';
import RequestForm from './components/RequestForm.tsx';
import { apiService } from './api.ts';
import { dbService } from './db.ts';

type AppTab = 'dashboard' | 'inventory' | 'maintenance' | 'suppliers' | 'locations' | 'licenses' | 'categories' | 'employees' | 'departments' | 'purchase-history' | 'requests' | 'faulty-reports' | 'budgets' | 'audit-trail' | 'system-logs' | 'attendance' | 'leaves' | 'user-mgmt' | 'role-mgmt' | 'notifications';

interface Toast {
  id: string;
  message: string;
  type: string;
  sender: string;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [systemLogs, setSystemLogs] = useState<UserLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastNotificationId, setLastNotificationId] = useState<number | null>(null);
  
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [managementModal, setManagementModal] = useState<{ isOpen: boolean, type: 'Category' | 'Employee' | 'Department' | null }>({ isOpen: false, type: null });
  
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [viewingBudgetBreakdown, setViewingBudgetBreakdown] = useState<Department | null>(null);

  // Helper to determine landing page
  const getLandingTab = useCallback((user: User): AppTab => {
    if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) return 'dashboard';
    return 'attendance';
  }, []);

  // Permission helper
  const hasPermission = useCallback((perm: string) => {
    if (currentUser?.role === UserRole.ADMIN) return true;
    if (!currentRole?.permissions) return false;
    return currentRole.permissions.split(',').map(p => p.trim()).includes(perm);
  }, [currentUser, currentRole]);

  const addToast = (message: string, type: string, sender: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, sender }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const pollNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const notifs = await apiService.getNotifications(currentUser.id);
      const unread = notifs.filter(n => !n.is_read);
      
      if (unread.length > 0) {
        const latest = Math.max(...unread.map(n => n.id));
        if (lastNotificationId === null) {
          setLastNotificationId(latest);
        } else if (latest > lastNotificationId) {
          const newNotifs = unread.filter(n => n.id > lastNotificationId);
          newNotifs.forEach(n => {
            addToast(n.message, n.type, n.sender_name);
          });
          setLastNotificationId(latest);
        }
      }
    } catch (e) {
      console.error("Poll Error", e);
    }
  }, [currentUser, lastNotificationId]);

  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(pollNotifications, 10000); 
      return () => clearInterval(interval);
    }
  }, [currentUser, pollNotifications]);

  const fetchRoleData = useCallback(async (roleId: string, user: User) => {
    try {
      const allRoles = await apiService.getRoles();
      const role = allRoles.find(r => r.id === roleId);
      if (role) {
        setCurrentRole(role);
        // Ensure landing page respects permissions
        const landing = getLandingTab(user);
        // Only set active tab if not already on a valid tab (e.g. initial load)
        setActiveTab(prev => (prev === 'dashboard' || prev === 'attendance') ? landing : prev);
      }
    } catch (e) {
      console.error("Error fetching role info", e);
    }
  }, [getLandingTab]);

  useEffect(() => {
    const savedUserString = localStorage.getItem('smartstock_user');
    if (savedUserString) {
      const savedUser = JSON.parse(savedUserString);
      setCurrentUser(savedUser);
      fetchRoleData(savedUser.role, savedUser);
    }
  }, [fetchRoleData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('smartstock_user', JSON.stringify(user));
    const landing = getLandingTab(user);
    setActiveTab(landing);
    fetchRoleData(user.role, user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRole(null);
    localStorage.removeItem('smartstock_user');
  };

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await dbService.init(); 
      
      const [fItems, fMovements, fSuppliers, fLocations, fMaintenance, fLicenses, fCats, fEmps, fDepts, fRequests, fUsers] = await Promise.all([
        apiService.getAllItems(),
        apiService.getAllMovements(),
        apiService.getAllSuppliers(),
        apiService.getAllLocations(),
        apiService.getAllMaintenance(),
        apiService.getAllLicenses(),
        apiService.getCategories(),
        apiService.getEmployees(),
        apiService.getDepartments(),
        apiService.getAllRequests(),
        apiService.getUsers()
      ]);
      
      setItems(fItems || []);
      setMovements(fMovements || []);
      setSuppliers(fSuppliers || []);
      setLocations(fLocations || []);
      setMaintenance(fMaintenance || []);
      setLicenses(fLicenses || []);
      setRequests(fRequests || []);
      setCategories(fCats || []);
      setEmployees(fEmps || []);
      setUsers(fUsers || []);
      setDepartments(fDepts || []);

      if (currentUser.role === UserRole.ADMIN) {
        const logs = await apiService.getSystemLogs();
        setSystemLogs(logs);
      }
    } catch (err) { console.error("Fetch error", err); }
    finally { setLoading(false); }
  }, [currentUser]);

  useEffect(() => { if (currentUser) fetchData(); }, [currentUser, fetchData]);

  const visibleUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.ADMIN || hasPermission('hr.users')) return users;
    if (currentUser.role === UserRole.MANAGER) {
      return users.filter(u => u.department === currentUser.department);
    }
    if (currentUser.role === UserRole.TEAM_LEAD) {
      return users.filter(u => u.team_lead_id === currentUser.id);
    }
    return users.filter(u => u.id === currentUser.id);
  }, [users, currentUser, hasPermission]);

  const visibleEmployees = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.ADMIN || hasPermission('hr.view')) return employees;
    if (currentUser.role === UserRole.MANAGER) {
      return employees.filter(e => e.department === currentUser.department);
    }
    if (currentUser.role === UserRole.TEAM_LEAD) {
      return employees.filter(e => e.team_lead_id === currentUser.id);
    }
    return [];
  }, [employees, currentUser, hasPermission]);

  const stats = {
    purchased: items.length,
    assigned: items.filter(i => i.status === ItemStatus.ASSIGNED).length,
    inUse: items.filter(i => i.status === ItemStatus.IN_USE).length,
    backup: items.filter(i => i.status === ItemStatus.BACKUP).length,
    faulty: items.filter(i => i.status === ItemStatus.FAULTY).length,
    available: items.filter(i => i.status === ItemStatus.AVAILABLE).length,
    licenses_total: licenses.length,
    expiring_soon: 0
  };

  const handleInitDB = async () => {
    setSyncing(true);
    try {
      const result = await apiService.initDatabase();
      alert(result.message);
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setSyncing(false); }
  };

  const handleSaveItem = async (item: InventoryItem) => {
    try {
      if (editingItem) await apiService.updateItem(item.id, item);
      else {
        await apiService.saveItem(item);
        await apiService.saveMovement({
          id: `MOV-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          item: item.name,
          from: 'Procurement',
          to: item.location || 'Central Store',
          employee: 'System',
          department: item.department,
          status: 'PURCHASED'
        });
      }
      setIsPurchaseModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) { alert(err); }
  };

  const handleManagementDelete = async (item, type) => {
    if (window.confirm(`Permanently delete this ${type}?`)) {
      try {
        if (type === 'Category') await apiService.deleteCategory(item.id);
        if (type === 'Employee') await apiService.deleteEmployee(item.id);
        if (type === 'Department') await apiService.deleteDepartment(item.id);
        if (type === 'Movement') await apiService.genericDelete('movements', item.id);
        if (type === 'Request') await apiService.deleteRequest(item.id);
        fetchData();
      } catch (err) { alert(err); }
    }
  };

  const handleManagementSubmit = async (data: any) => {
    try {
      if (managementModal.type === 'Category') await apiService.saveCategory(data);
      if (managementModal.type === 'Employee') await apiService.saveEmployee(data);
      if (managementModal.type === 'Department') await apiService.saveDepartment(data);
      setManagementModal({ isOpen: false, type: null });
      fetchData();
    } catch (err) { alert(err); }
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const renderContent = () => {
    if (!currentUser) return null;
    
    switch (activeTab) {
      case 'dashboard': return !hasPermission('analytics.view') ? <AttendanceModule currentUser={currentUser} /> : <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} onCheckIn={() => setActiveTab('attendance')} />;
      case 'attendance': return <AttendanceModule currentUser={currentUser} />;
      case 'notifications': return <NotificationCenter currentUser={currentUser} />;
      case 'leaves': return !hasPermission('hr.leaves') && currentUser.role === UserRole.STAFF ? <LeaveModule currentUser={currentUser} /> : (hasPermission('hr.leaves') ? <LeaveModule currentUser={currentUser} /> : null);
      case 'user-mgmt': return hasPermission('hr.users') ? <UserManagement usersOverride={visibleUsers} /> : null;
      case 'role-mgmt': return hasPermission('system.roles') ? <RoleManagement /> : null;
      case 'inventory': return !hasPermission('inventory.view') ? null : <InventoryTable items={items} onUpdate={fetchData} onEdit={hasPermission('inventory.edit') ? setEditingItem : undefined} onView={setViewingItem} />;
      case 'maintenance': return !hasPermission('inventory.edit') ? null : <MaintenanceList logs={maintenance} items={items} onUpdate={fetchData} onAdd={() => setIsMaintenanceModalOpen(true)} />;
      case 'suppliers': return !hasPermission('inventory.view') ? null : <SupplierList suppliers={suppliers} />;
      case 'locations': return !hasPermission('inventory.view') ? null : <GenericListView title="Physical Sites" icon="fa-map-marker-alt" items={locations} columns={['id', 'building', 'floor', 'room', 'manager']} />;
      case 'licenses': return !hasPermission('inventory.view') ? null : <LicenseList licenses={licenses} suppliers={suppliers} onUpdate={fetchData} onAdd={hasPermission('inventory.procure') ? () => setIsLicenseModalOpen(true) : undefined} />;
      case 'categories': return !hasPermission('inventory.view') ? null : <GenericListView title="Asset Categories" icon="fa-tags" items={categories} columns={['id', 'name', 'itemCount']} onAdd={hasPermission('inventory.edit') ? () => setManagementModal({ isOpen: true, type: 'Category' }) : undefined} onDelete={hasPermission('inventory.edit') ? (item) => handleManagementDelete(item, 'Category') : undefined} />;
      case 'employees': return !hasPermission('hr.view') ? null : <GenericListView title="Staff Directory" icon="fa-users" items={visibleEmployees} columns={['id', 'name', 'email', 'department', 'role']} onAdd={hasPermission('hr.users') ? () => setManagementModal({ isOpen: true, type: 'Employee' }) : undefined} onDelete={hasPermission('hr.users') ? (item) => handleManagementDelete(item, 'Employee') : undefined} onView={(emp) => setViewingEmployee(emp)} />;
      case 'departments': return !hasPermission('hr.view') ? null : <GenericListView title="Departmental Overview" icon="fa-building" items={departments} columns={['id', 'name', 'head']} onAdd={hasPermission('hr.users') ? () => setManagementModal({ isOpen: true, type: 'Department' }) : undefined} onDelete={hasPermission('hr.users') ? (item) => handleManagementDelete(item, 'Department') : undefined} /> ;
      case 'purchase-history': return !hasPermission('inventory.procure') ? null : <GenericListView title="Procurement History" icon="fa-history" items={movements.filter(m => m.status === 'PURCHASED')} columns={['date', 'item', 'from', 'to']} onAdd={hasPermission('inventory.procure') ? () => setIsPurchaseModalOpen(true) : undefined} onDelete={isAdmin ? (m) => handleManagementDelete(m, 'Movement') : undefined} />;
      case 'requests': return <GenericListView title="Asset Requests" icon="fa-clipboard-list" items={currentUser.role === UserRole.STAFF ? requests.filter(r => r.employee === currentUser.full_name) : requests} columns={['item', 'employee', 'urgency', 'status', 'request_date']} onAdd={() => setIsRequestModalOpen(true)} onDelete={isAdmin ? (item) => handleManagementDelete(item, 'Request') : undefined} onView={(item) => alert(item.notes)} />;
      case 'faulty-reports': return !hasPermission('inventory.view') ? null : <GenericListView title="Faulty Reports" icon="fa-exclamation-circle" items={maintenance} columns={['item_id', 'issue_type', 'description', 'status']} onAdd={() => setIsMaintenanceModalOpen(true)} onView={() => setActiveTab('maintenance')} />;
      case 'budgets': return !hasPermission('analytics.financials') ? null : <GenericListView title="Department Asset Analytics" icon="fa-wallet" items={departments} columns={['id', 'name', 'head']} onAdd={isAdmin ? () => setManagementModal({ isOpen: true, type: 'Department' }) : undefined} onView={(dept) => setViewingBudgetBreakdown(dept)} />;
      case 'audit-trail': return !hasPermission('analytics.logs') ? null : <GenericListView title="Movement Ledger" icon="fa-history" items={movements} columns={['date', 'item', 'from', 'to', 'employee', 'department', 'status']} onDelete={isAdmin ? (item) => handleManagementDelete(item, 'Movement') : undefined} />;
      case 'system-logs': return hasPermission('analytics.logs') && isAdmin ? <GenericListView title="System Audit Logs" icon="fa-shield-alt" items={systemLogs} columns={['timestamp', 'username', 'action', 'target_type', 'target_id', 'details']} /> : null;
      default: return <AttendanceModule currentUser={currentUser} />;
    }
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Toast Popups */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 flex items-start gap-4 min-w-[320px] animate-toastIn">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${toast.type === 'ATTENDANCE' ? 'bg-indigo-500' : 'bg-rose-500'}`}>
              <i className={`fas ${toast.type === 'ATTENDANCE' ? 'fa-clock' : 'fa-bell'}`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{toast.sender}</p>
              <p className="text-sm font-bold text-slate-800 leading-snug mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-slate-300 hover:text-slate-500">
              <i className="fas fa-times"></i>
            </button>
          </div>
        ))}
      </div>

      <Sidebar 
        userRole={currentUser.role} 
        activeTab={activeTab as any} 
        setActiveTab={setActiveTab as any} 
        onLogout={handleLogout}
        permissions={currentRole?.permissions?.split(',').map(p => p.trim()) || []}
      />
      <main className={`flex-1 lg:ml-64 p-6 lg:p-10 transition-all duration-300`}>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 lg:hidden"><i className="fas fa-bars"></i></div>
             <div>
                <h1 className="text-3xl font-bold text-slate-800 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
                <p className="text-slate-500 mt-1 flex items-center gap-2">
                   <span className="font-bold text-indigo-600">{currentUser.full_name}</span>
                   <span className={`px-2 py-0.5 text-[10px] rounded-full border font-bold uppercase ${currentRole ? `bg-${currentRole.color}-50 text-${currentRole.color}-600 border-${currentRole.color}-100` : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {currentRole?.label || currentUser.role.replace('_', ' ')}
                   </span>
                   {currentUser.department && <span className="text-[10px] text-slate-400 font-bold">({currentUser.department})</span>}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            {hasPermission('system.db') && <button onClick={handleInitDB} disabled={syncing} className={`px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold text-sm shadow-sm flex items-center gap-2 ${syncing ? 'opacity-50' : ''}`}><i className={`fas fa-database ${syncing ? 'animate-spin' : ''}`}></i> Sync & Init</button>}
            {hasPermission('inventory.procure') && <button onClick={() => { setEditingItem(null); setIsPurchaseModalOpen(true); }} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold text-sm shadow-lg shadow-indigo-100 flex items-center gap-2"><i className="fas fa-plus"></i> New Asset</button>}
          </div>
        </header>
        {loading && !currentRole ? <div className="flex h-64 w-full items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div></div> : renderContent()}
      </main>
      {isPurchaseModalOpen && hasPermission('inventory.procure') && (
        <Modal title="🛒 Procurement" onClose={() => setIsPurchaseModalOpen(false)}>
          <PurchaseForm onSubmit={handleSaveItem} suppliers={suppliers} locations={locations} departments={departments} />
        </Modal>
      )}
      {managementModal.isOpen && (
        <Modal title={`➕ Add ${managementModal.type}`} onClose={() => setManagementModal({ isOpen: false, type: null })}>
          <ManagementForm type={managementModal.type!} onSubmit={handleManagementSubmit} />
        </Modal>
      )}
      {viewingItem && <Modal title="Asset Profile" onClose={() => setViewingItem(null)}><ItemDetails item={viewingItem} /></Modal>}
      {viewingEmployee && (
        <Modal title="Staff Profile" onClose={() => setViewingEmployee(null)}>
          <EmployeeDetails employee={viewingEmployee} items={items} linkedUser={users.find(u => u.full_name === viewingEmployee.name)} allUsers={users} />
        </Modal>
      )}
      {viewingBudgetBreakdown && <Modal title="Department Asset Breakdown" onClose={() => setViewingBudgetBreakdown(null)}><BudgetBreakdown department={viewingBudgetBreakdown} items={items} /></Modal>}
    </div>
  );
};

export default App;
