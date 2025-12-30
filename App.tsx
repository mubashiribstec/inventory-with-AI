
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
import SettingsModule from './components/SettingsModule.tsx';
import Login from './components/Login.tsx';
import { ItemStatus, UserRole, User, UserLog, InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, Category, Employee, Department, License, AssetRequest, Notification, Role, SystemSettings } from './types.ts';
import Modal from './components/Modal.tsx';
import PurchaseForm from './components/PurchaseForm.tsx';
import AssignmentForm from './components/AssignmentForm.tsx';
import ManagementForm from './components/ManagementForm.tsx';
import MaintenanceForm from './components/MaintenanceForm.tsx';
import LicenseForm from './components/LicenseForm.tsx';
import RequestForm from './components/RequestForm.tsx';
import { apiService } from './api.ts';
import { dbService } from './db.ts';

type AppTab = 'dashboard' | 'inventory' | 'maintenance' | 'suppliers' | 'locations' | 'licenses' | 'categories' | 'employees' | 'departments' | 'purchase-history' | 'requests' | 'faulty-reports' | 'budgets' | 'audit-trail' | 'system-logs' | 'attendance' | 'leaves' | 'user-mgmt' | 'role-mgmt' | 'notifications' | 'settings';

interface Toast {
  id: string;
  message: string;
  type: string;
  sender: string;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({ id: 'GLOBAL', software_name: 'SmartStock Pro', primary_color: 'indigo', dark_mode: false });
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
  const [dataLoading, setDataLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastNotificationId, setLastNotificationId] = useState<number | null>(null);
  
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [managementModal, setManagementModal] = useState<{ isOpen: boolean, type: 'Category' | 'Employee' | 'Department' | null }>({ isOpen: false, type: null });
  
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [viewingBudgetBreakdown, setViewingBudgetBreakdown] = useState<Department | null>(null);

  const getLandingTab = useCallback((user: User): AppTab => {
    if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) return 'dashboard';
    return 'attendance';
  }, []);

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
        const landing = getLandingTab(user);
        setActiveTab(prev => (prev === 'dashboard' || prev === 'attendance') ? landing : prev);
      }
    } catch (e) {
      console.error("Error fetching role info", e);
    } finally {
      setLoading(false);
    }
  }, [getLandingTab]);

  const fetchSettings = useCallback(async () => {
    try {
      const s = await apiService.getSettings();
      if (s && s.software_name) setSettings(s);
    } catch (e) { 
      console.error("Settings fetch failed", e); 
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      const savedUserString = localStorage.getItem('smartstock_user');
      await fetchSettings();
      if (savedUserString) {
        try {
          const savedUser = JSON.parse(savedUserString);
          setCurrentUser(savedUser);
          await fetchRoleData(savedUser.role, savedUser);
        } catch (e) {
          console.error("Failed to parse saved user", e);
          localStorage.removeItem('smartstock_user');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    initApp();
  }, [fetchRoleData, fetchSettings]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.dark_mode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.dark_mode]);

  const toggleDarkMode = async () => {
    const newDarkMode = !settings.dark_mode;
    const newSettings = { ...settings, dark_mode: newDarkMode };
    setSettings(newSettings);
    try {
      await apiService.updateSettings(newSettings);
    } catch (e) {
      console.error("Failed to persist theme preference", e);
    }
  };

  const handleLogin = (user: User) => {
    setLoading(true);
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
      setDataLoading(true);
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
    } catch (err) { 
      console.error("Data fetch error", err); 
    } finally { 
      setDataLoading(false); 
    }
  }, [currentUser]);

  useEffect(() => { if (currentUser) fetchData(); }, [currentUser, fetchData]);

  const visibleUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.ADMIN) return users;
    if (currentUser.role === UserRole.MANAGER) {
      return users.filter(u => u.department === currentUser.department);
    }
    if (currentUser.role === UserRole.TEAM_LEAD) {
      return users.filter(u => u.team_lead_id === currentUser.id);
    }
    return users.filter(u => u.id === currentUser.id);
  }, [users, currentUser]);

  const visibleEmployees = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.ADMIN) return employees;
    const subordinateNames = visibleUsers.map(u => u.full_name);
    if (currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.TEAM_LEAD) {
        return employees.filter(e => subordinateNames.includes(e.name));
    }
    return [];
  }, [employees, currentUser, visibleUsers]);

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

  const renderContent = () => {
    if (!currentUser) return null;
    
    switch (activeTab) {
      case 'dashboard': return !hasPermission('analytics.view') ? <AttendanceModule currentUser={currentUser} /> : <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} onCheckIn={() => setActiveTab('attendance')} />;
      case 'attendance': return <AttendanceModule currentUser={currentUser} />;
      case 'notifications': return <NotificationCenter currentUser={currentUser} />;
      case 'leaves': return !hasPermission('hr.leaves') && currentUser.role === UserRole.STAFF ? <LeaveModule currentUser={currentUser} allUsers={users} /> : (hasPermission('hr.leaves') ? <LeaveModule currentUser={currentUser} allUsers={users} /> : null);
      case 'user-mgmt': return hasPermission('hr.users') ? <UserManagement usersOverride={visibleUsers} /> : null;
      case 'role-mgmt': return hasPermission('system.roles') ? <RoleManagement /> : null;
      case 'settings': return hasPermission('system.settings') ? <SettingsModule settings={settings} onUpdate={setSettings} /> : null;
      case 'inventory': return !hasPermission('inventory.view') ? null : <InventoryTable items={items} onUpdate={fetchData} onEdit={hasPermission('inventory.edit') ? setEditingItem : undefined} onView={setViewingItem} />;
      case 'maintenance': return !hasPermission('inventory.edit') ? null : <MaintenanceList logs={maintenance} items={items} onUpdate={fetchData} onAdd={() => setActiveTab('requests')} />;
      case 'suppliers': return !hasPermission('inventory.view') ? null : <SupplierList suppliers={suppliers} />;
      case 'locations': return !hasPermission('inventory.view') ? null : <GenericListView title="Physical Sites" icon="fa-map-marker-alt" items={locations} columns={['id', 'building', 'floor', 'room', 'manager']} />;
      case 'licenses': return !hasPermission('inventory.view') ? null : <LicenseList licenses={licenses} suppliers={suppliers} onUpdate={fetchData} onAdd={() => fetchData()} />;
      case 'categories': return !hasPermission('inventory.view') ? null : <GenericListView title="Asset Categories" icon="fa-tags" items={categories} columns={['id', 'name', 'itemCount']} onAdd={hasPermission('inventory.edit') ? () => setManagementModal({ isOpen: true, type: 'Category' }) : undefined} onDelete={hasPermission('inventory.edit') ? (item) => handleManagementDelete(item, 'Category') : undefined} />;
      case 'employees': return !hasPermission('hr.view') ? null : <GenericListView title="Staff Directory" icon="fa-users" items={visibleEmployees} columns={['id', 'name', 'email', 'department', 'role']} onAdd={hasPermission('hr.users') ? () => setManagementModal({ isOpen: true, type: 'Employee' }) : undefined} onDelete={hasPermission('hr.users') ? (item) => handleManagementDelete(item, 'Employee') : undefined} onView={(emp) => setViewingEmployee(emp)} />;
      case 'departments': return !hasPermission('hr.view') ? null : <GenericListView title="Departmental Overview" icon="fa-building" items={departments} columns={['id', 'name', 'head']} onAdd={hasPermission('hr.users') ? () => setManagementModal({ isOpen: true, type: 'Department' }) : undefined} onDelete={hasPermission('hr.users') ? (item) => handleManagementDelete(item, 'Department') : undefined} /> ;
      case 'purchase-history': return !hasPermission('inventory.procure') ? null : <GenericListView title="Procurement History" icon="fa-history" items={movements.filter(m => m.status === 'PURCHASED')} columns={['date', 'item', 'from', 'to']} onAdd={hasPermission('inventory.procure') ? () => setIsPurchaseModalOpen(true) : undefined} onDelete={currentUser.role === UserRole.ADMIN ? (m) => handleManagementDelete(m, 'Movement') : undefined} />;
      case 'requests': return <GenericListView title="Asset Requests" icon="fa-clipboard-list" items={currentUser.role === UserRole.STAFF ? requests.filter(r => r.employee === currentUser.full_name) : requests} columns={['item', 'employee', 'urgency', 'status', 'request_date']} onDelete={currentUser.role === UserRole.ADMIN ? (item) => handleManagementDelete(item, 'Request') : undefined} onView={(item) => alert(item.notes)} />;
      case 'faulty-reports': return !hasPermission('inventory.view') ? null : <GenericListView title="Faulty Reports" icon="fa-exclamation-circle" items={maintenance} columns={['item_id', 'issue_type', 'description', 'status']} onView={() => setActiveTab('maintenance')} />;
      case 'budgets': return !hasPermission('analytics.financials') ? null : <GenericListView title="Department Asset Analytics" icon="fa-wallet" items={departments} columns={['id', 'name', 'head']} onView={(dept) => setViewingBudgetBreakdown(dept)} />;
      case 'audit-trail': return !hasPermission('analytics.logs') ? null : <GenericListView title="Movement Ledger" icon="fa-history" items={movements} columns={['date', 'item', 'from', 'to', 'employee', 'department', 'status']} onDelete={currentUser.role === UserRole.ADMIN ? (item) => handleManagementDelete(item, 'Movement') : undefined} />;
      case 'system-logs': return hasPermission('analytics.logs') && currentUser.role === UserRole.ADMIN ? <GenericListView title="System Audit Logs" icon="fa-shield-alt" items={systemLogs} columns={['timestamp', 'username', 'action', 'target_type', 'target_id', 'details']} /> : null;
      default: return <AttendanceModule currentUser={currentUser} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing SmartStock...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl rounded-2xl p-4 flex items-start gap-4 min-w-[320px] animate-toastIn">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 bg-${settings.primary_color}-500`}>
              <i className={`fas ${toast.type === 'ATTENDANCE' ? 'fa-clock' : 'fa-bell'}`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{toast.sender}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug mt-0.5">{toast.message}</p>
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
        appName={settings.software_name}
        themeColor={settings.primary_color}
      />
      <main className="flex-1 lg:ml-64 p-6 lg:p-10 transition-all duration-300 min-w-0">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 bg-${settings.primary_color}-50 dark:bg-${settings.primary_color}-900/20 rounded-2xl flex items-center justify-center text-${settings.primary_color}-600 dark:text-${settings.primary_color}-400 border border-${settings.primary_color}-100 dark:border-${settings.primary_color}-800 lg:hidden`}><i className="fas fa-bars"></i></div>
             <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-50 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                   <span className={`font-bold text-${settings.primary_color}-600 dark:text-${settings.primary_color}-400`}>{currentUser.full_name}</span>
                   <span className={`px-2 py-0.5 text-[10px] rounded-full border font-bold uppercase ${currentRole ? `bg-${currentRole.color}-50 dark:bg-${currentRole.color}-900/20 text-${currentRole.color}-600 dark:text-${currentRole.color}-400 border-${currentRole.color}-100 dark:border-${currentRole.color}-800` : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                    {currentRole?.label || currentUser.role.replace('_', ' ')}
                   </span>
                </p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleDarkMode}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm group"
              title={settings.dark_mode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <i className={`fas ${settings.dark_mode ? 'fa-sun' : 'fa-moon'} group-active:scale-90 transition-transform`}></i>
            </button>
            
            {hasPermission('system.db') && <button onClick={handleInitDB} disabled={syncing} className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition font-bold text-sm shadow-sm flex items-center gap-2 disabled:opacity-50"><i className={`fas fa-database ${syncing ? 'animate-spin' : ''}`}></i> Sync & Init</button>}
            {hasPermission('inventory.procure') && <button onClick={() => { setEditingItem(null); setIsPurchaseModalOpen(true); }} className={`px-4 py-2.5 bg-${settings.primary_color}-600 text-white rounded-xl hover:bg-${settings.primary_color}-700 transition font-bold text-sm shadow-lg shadow-${settings.primary_color}-100 dark:shadow-none flex items-center gap-2`}><i className="fas fa-plus"></i> New Asset</button>}
          </div>
        </header>
        
        {dataLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <div className={`animate-spin rounded-full h-10 w-10 border-4 border-${settings.primary_color}-600 border-t-transparent`}></div>
          </div>
        ) : renderContent()}
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
