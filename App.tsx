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
import SalaryModule from './components/SalaryModule.tsx';
import Login from './components/Login.tsx';
import { ItemStatus, UserRole, User, UserLog, InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, Category, Employee, Department, License, AssetRequest, Notification, Role, SystemSettings } from './types.ts';
import Modal from './components/Modal.tsx';
import PurchaseForm from './components/PurchaseForm.tsx';
import ManagementForm from './components/ManagementForm.tsx';
import { apiService } from './api.ts';
import { dbService } from './db.ts';

type AppTab = 'dashboard' | 'inventory' | 'maintenance' | 'suppliers' | 'locations' | 'licenses' | 'categories' | 'employees' | 'departments' | 'purchase-history' | 'requests' | 'faulty-reports' | 'budgets' | 'audit-trail' | 'system-logs' | 'attendance' | 'leaves' | 'user-mgmt' | 'role-mgmt' | 'notifications' | 'settings' | 'salaries';

interface Toast {
  id: string;
  message: string;
  type: string;
  sender: string;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({ 
    id: 'GLOBAL', 
    software_name: 'SmartStock Pro', 
    primary_color: 'indigo',
    software_description: 'Enterprise Resource Planning',
    software_logo: 'fa-warehouse'
  });
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
  const [isInitialized, setIsInitialized] = useState(false);
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

  // Update document title when branding changes
  useEffect(() => {
    document.title = `${settings.software_name} | Enterprise Portal`;
  }, [settings.software_name]);

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
    }
  }, [getLandingTab]);

  const fetchSettings = useCallback(async () => {
    try {
      const s = await apiService.getSettings();
      if (s && s.software_name) {
        setSettings(prev => ({ 
          ...prev, 
          ...s,
          primary_color: (s.primary_color || prev.primary_color).toLowerCase() 
        }));
      }
    } catch (e) { 
      console.error("Settings fetch failed", e); 
    }
  }, []);

  // System Initialization Sequence
  useEffect(() => {
    const initApp = async () => {
      try {
        setLoading(true);
        await fetchSettings();
        
        const savedUserString = localStorage.getItem('smartstock_user');
        if (savedUserString) {
          try {
            const savedUser = JSON.parse(savedUserString);
            setCurrentUser(savedUser);
            await fetchRoleData(savedUser.role, savedUser);
          } catch (e) {
            localStorage.removeItem('smartstock_user');
          }
        }
      } catch (e) {
        console.error("Initialization failure", e);
      } finally {
        setIsInitialized(true);
        setLoading(false);
      }
    };
    initApp();
  }, [fetchSettings, fetchRoleData]);

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

  const handleLogin = (user: User) => {
    setLoading(true);
    setCurrentUser(user);
    localStorage.setItem('smartstock_user', JSON.stringify(user));
    const landing = getLandingTab(user);
    setActiveTab(landing);
    fetchRoleData(user.role, user).finally(() => setLoading(false));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRole(null);
    localStorage.removeItem('smartstock_user');
  };

  const renderContent = () => {
    if (!currentUser) return null;
    
    switch (activeTab) {
      case 'dashboard': return !hasPermission('analytics.view') ? <AttendanceModule currentUser={currentUser} /> : <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} onCheckIn={() => setActiveTab('attendance')} themeColor={themeColor} />;
      case 'attendance': return <AttendanceModule currentUser={currentUser} />;
      case 'notifications': return <NotificationCenter currentUser={currentUser} />;
      case 'leaves': return <LeaveModule currentUser={currentUser} allUsers={users} />;
      case 'salaries': return hasPermission('hr.salaries') ? <SalaryModule employees={employees} /> : null;
      case 'user-mgmt': return hasPermission('hr.users') ? <UserManagement usersOverride={users} /> : null;
      case 'role-mgmt': return hasPermission('system.roles') ? <RoleManagement /> : null;
      case 'settings': return hasPermission('system.settings') ? <SettingsModule settings={settings} onUpdate={setSettings} /> : null;
      case 'inventory': return !hasPermission('inventory.view') ? null : <InventoryTable items={items} onUpdate={fetchData} onEdit={hasPermission('inventory.edit') ? setEditingItem : undefined} onView={setViewingItem} onAddAsset={hasPermission('inventory.procure') ? () => setIsPurchaseModalOpen(true) : undefined} themeColor={themeColor} />;
      case 'maintenance': return !hasPermission('inventory.edit') ? null : <MaintenanceList logs={maintenance} items={items} onUpdate={fetchData} onAdd={() => setActiveTab('requests')} />;
      case 'suppliers': return !hasPermission('inventory.view') ? null : <SupplierList suppliers={suppliers} />;
      case 'locations': return !hasPermission('inventory.view') ? null : <GenericListView title="Physical Sites" icon="fa-map-marker-alt" items={locations} columns={['id', 'building', 'floor', 'room', 'manager']} />;
      case 'licenses': return !hasPermission('inventory.view') ? null : <LicenseList licenses={licenses} suppliers={suppliers} onUpdate={fetchData} onAdd={() => fetchData()} />;
      case 'categories': return !hasPermission('inventory.view') ? null : <GenericListView title="Asset Categories" icon="fa-tags" items={categories} columns={['id', 'name', 'itemCount']} />;
      case 'employees': return !hasPermission('hr.view') ? null : <GenericListView title="Staff Directory" icon="fa-users" items={employees} columns={['id', 'name', 'email', 'department', 'role', 'joining_date']} onView={(emp) => setViewingEmployee(emp)} onAdd={() => setManagementModal({ isOpen: true, type: 'Employee' })} />;
      case 'departments': return !hasPermission('hr.view') ? null : <GenericListView title="Departmental Overview" icon="fa-building" items={departments} columns={['id', 'name', 'head']} />;
      case 'purchase-history': return !hasPermission('inventory.procure') ? null : <GenericListView title="Procurement History" icon="fa-history" items={movements.filter(m => m.status === 'PURCHASED')} columns={['date', 'item', 'from', 'to']} />;
      case 'requests': return <GenericListView title="Asset Requests" icon="fa-clipboard-list" items={requests} columns={['item', 'employee', 'urgency', 'status', 'request_date']} />;
      case 'audit-trail': return !hasPermission('analytics.logs') ? null : <GenericListView title="Movement Ledger" icon="fa-history" items={movements} columns={['date', 'item', 'from', 'to', 'employee', 'department', 'status']} />;
      case 'system-logs': return hasPermission('analytics.logs') && currentUser.role === UserRole.ADMIN ? <GenericListView title="System Audit Logs" icon="fa-shield-alt" items={systemLogs} columns={['timestamp', 'username', 'action', 'target_type', 'target_id', 'details']} /> : null;
      default: return <AttendanceModule currentUser={currentUser} />;
    }
  };

  const stats = useMemo(() => ({
    purchased: items.length,
    assigned: items.filter(i => i.status === ItemStatus.ASSIGNED).length,
    inUse: items.filter(i => i.status === ItemStatus.IN_USE).length,
    backup: items.filter(i => i.status === ItemStatus.BACKUP).length,
    faulty: items.filter(i => i.status === ItemStatus.FAULTY).length,
    available: items.filter(i => i.status === ItemStatus.AVAILABLE).length,
    licenses_total: licenses.length,
    expiring_soon: 0
  }), [items, licenses]);

  const themeColor = (settings.primary_color || 'indigo').toLowerCase();

  if (!isInitialized || (loading && !currentUser)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className={`w-12 h-12 border-4 border-${themeColor}-600 border-t-transparent rounded-full animate-spin`}></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading ERP Workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Login onLogin={handleLogin} softwareName={settings.software_name} themeColor={themeColor} logoIcon={settings.software_logo} description={settings.software_description} />;

  return (
    <div className={`flex min-h-screen bg-slate-50 theme-${themeColor}`}>
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 flex items-start gap-4 min-w-[320px] animate-toastIn">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 bg-${themeColor}-500`}>
              <i className="fas fa-bell"></i>
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
        appName={settings.software_name}
        themeColor={themeColor}
        logoIcon={settings.software_logo}
      />
      <main className="flex-1 lg:ml-64 p-6 lg:p-10 transition-all duration-300 min-w-0">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 bg-${themeColor}-50 rounded-2xl flex items-center justify-center text-${themeColor}-600 border border-${themeColor}-100 lg:hidden`}><i className="fas fa-bars"></i></div>
             <div>
                <h1 className="text-3xl font-bold text-slate-800 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
                <p className="text-slate-500 mt-1 flex items-center gap-2">
                   <span className={`font-bold text-${themeColor}-600`}>{currentUser.full_name}</span>
                   <span className={`px-2 py-0.5 text-[10px] rounded-full border font-bold uppercase ${currentRole ? `bg-${currentRole.color}-50 text-${currentRole.color}-600 border-${currentRole.color}-100` : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {currentRole?.label || currentUser.role.replace('_', ' ')}
                   </span>
                </p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Global buttons removed as per request for contextual action */}
          </div>
        </header>
        
        {dataLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <div className={`animate-spin rounded-full h-10 w-10 border-4 border-${themeColor}-600 border-t-transparent`}></div>
          </div>
        ) : renderContent()}
      </main>
      
      {isPurchaseModalOpen && (
        <Modal title="🛒 Procurement" onClose={() => setIsPurchaseModalOpen(false)}>
          <PurchaseForm onSubmit={async (item) => {
            await apiService.saveItem(item);
            setIsPurchaseModalOpen(false);
            fetchData();
          }} suppliers={suppliers} locations={locations} departments={departments} />
        </Modal>
      )}

      {managementModal.isOpen && (
        <Modal title={`Add ${managementModal.type}`} onClose={() => setManagementModal({ isOpen: false, type: null })}>
          <ManagementForm type={managementModal.type!} onSubmit={async (data) => {
            if (managementModal.type === 'Employee') await apiService.saveEmployee(data);
            setManagementModal({ isOpen: false, type: null });
            fetchData();
          }} />
        </Modal>
      )}

      {viewingItem && <Modal title="Asset Profile" onClose={() => setViewingItem(null)}><ItemDetails item={viewingItem} /></Modal>}
      {viewingEmployee && (
        <Modal title="Staff Profile" onClose={() => setViewingEmployee(null)}>
          <EmployeeDetails employee={viewingEmployee} items={items} allUsers={users} />
        </Modal>
      )}
      {viewingBudgetBreakdown && <Modal title="Department Asset Breakdown" onClose={() => setViewingBudgetBreakdown(null)}><BudgetBreakdown department={viewingBudgetBreakdown} items={items} /></Modal>}
    </div>
  );
};

export default App;
