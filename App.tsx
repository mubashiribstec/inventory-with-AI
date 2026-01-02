
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import InventoryTable from './components/InventoryTable.tsx';
import MaintenanceList from './components/MaintenanceList.tsx';
import SupplierList from './components/SupplierList.tsx';
import LicenseList from './components/LicenseList.tsx';
import ItemDetails from './components/ItemDetails.tsx';
import EmployeeDetails from './components/EmployeeDetails.tsx';
import GenericListView from './components/GenericListView.tsx';
import AttendanceModule from './components/AttendanceModule.tsx';
import LeaveModule from './components/LeaveModule.tsx';
import UserManagement from './components/UserManagement.tsx';
import RoleManagement from './components/RoleManagement.tsx';
import NotificationCenter from './components/NotificationCenter.tsx';
import SettingsModule from './components/SettingsModule.tsx';
import SalaryModule from './components/SalaryModule.tsx';
import BudgetModule from './components/BudgetModule.tsx';
import Login from './components/Login.tsx';
import { ItemStatus, UserRole, User, UserLog, InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, Category, Employee, Department, License, AssetRequest, Notification, Role, SystemSettings } from './types.ts';
import Modal from './components/Modal.tsx';
import PurchaseForm from './components/PurchaseForm.tsx';
import ManagementForm from './components/ManagementForm.tsx';
import { apiService } from './api.ts';
import { dbService } from './db.ts';

type AppTab = 'dashboard' | 'inventory' | 'maintenance' | 'suppliers' | 'locations' | 'licenses' | 'categories' | 'employees' | 'departments' | 'purchase-history' | 'requests' | 'faulty-reports' | 'budgets' | 'audit-trail' | 'system-logs' | 'attendance' | 'leaves' | 'user-mgmt' | 'role-mgmt' | 'notifications' | 'settings' | 'salaries';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({ id: 'GLOBAL', software_name: 'SmartStock Pro', primary_color: 'indigo' });
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [managementModal, setManagementModal] = useState<{ isOpen: boolean, type: 'Category' | 'Employee' | 'Department' | null }>({ isOpen: false, type: null });
  
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  useEffect(() => { document.title = `${settings.software_name} | Enterprise Portal`; }, [settings.software_name]);

  const fetchRoleData = useCallback(async (roleId: string) => {
    try {
      const allRoles = await apiService.getRoles();
      const role = allRoles.find(r => r.id === roleId);
      if (role) setCurrentRole(role);
    } catch (e) { console.error(e); }
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setDataLoading(true);
      await dbService.init(); 
      const [fItems, fMov, fSup, fLoc, fMaint, fLic, fCat, fEmp, fDept, fReq, fUsers] = await Promise.all([
        apiService.getAllItems(), apiService.getAllMovements(), apiService.getAllSuppliers(),
        apiService.getAllLocations(), apiService.getAllMaintenance(), apiService.getAllLicenses(),
        apiService.getCategories(), apiService.getEmployees(), apiService.getDepartments(),
        apiService.getAllRequests(), apiService.getUsers()
      ]);
      setItems(fItems || []); setMovements(fMov || []); setSuppliers(fSup || []); setLocations(fLoc || []);
      setMaintenance(fMaint || []); setLicenses(fLic || []); setCategories(fCat || []);
      setEmployees(fEmp || []); setDepartments(fDept || []); setRequests(fReq || []); setUsers(fUsers || []);
    } catch (err) { console.error(err); } finally { setDataLoading(false); }
  }, [currentUser]);

  useEffect(() => {
    const initApp = async () => {
      try {
        const s = await apiService.getSettings();
        if (s) setSettings(s);
        const saved = localStorage.getItem('smartstock_user');
        if (saved) {
          const user = JSON.parse(saved);
          setCurrentUser(user);
          await fetchRoleData(user.role);
        }
      } catch (e) { console.error(e); } finally { setIsInitialized(true); setLoading(false); }
    };
    initApp();
  }, [fetchRoleData]);

  useEffect(() => { if (currentUser) fetchData(); }, [currentUser, fetchData]);

  const handleCloudSync = async () => {
    setSyncing(true);
    try {
      const res = await apiService.syncToCloud();
      if (res.success) alert(`Cloud Sync Successful: Data backed up to Drive at ${new Date().toLocaleTimeString()}`);
      else alert("Cloud Sync Failed: " + res.error);
    } catch (e) { alert("Cloud Sync Error: " + e); }
    finally { setSyncing(false); }
  };

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} onCheckIn={() => setActiveTab('attendance')} />;
      case 'inventory': return <InventoryTable items={items} onUpdate={fetchData} onEdit={() => {}} onView={setViewingItem} onAddAsset={() => setIsPurchaseModalOpen(true)} />;
      case 'attendance': return <AttendanceModule currentUser={currentUser} />;
      case 'notifications': return <NotificationCenter currentUser={currentUser} />;
      case 'leaves': return <LeaveModule currentUser={currentUser} allUsers={users} />;
      case 'salaries': return <SalaryModule employees={employees} />;
      case 'user-mgmt': return <UserManagement usersOverride={users} />;
      case 'role-mgmt': return <RoleManagement />;
      case 'settings': return <SettingsModule settings={settings} onUpdate={setSettings} />;
      case 'maintenance': return <MaintenanceList logs={maintenance} items={items} onUpdate={fetchData} onAdd={() => setActiveTab('requests')} />;
      case 'suppliers': return <SupplierList suppliers={suppliers} />;
      case 'locations': return <GenericListView title="Operational Sites" icon="fa-map-marker-alt" items={locations} columns={['id', 'building', 'room', 'manager']} />;
      case 'licenses': return <LicenseList licenses={licenses} suppliers={suppliers} onUpdate={fetchData} onAdd={() => fetchData()} />;
      case 'categories': return <GenericListView title="Asset Categories" icon="fa-tags" items={categories} columns={['id', 'name', 'itemCount']} />;
      case 'employees': return <GenericListView title="Employee Directory" icon="fa-users" items={employees} columns={['id', 'name', 'email', 'department']} onView={setViewingEmployee} onAdd={() => setManagementModal({ isOpen: true, type: 'Employee' })} />;
      case 'departments': return <GenericListView title="Departments & Business Units" icon="fa-building" items={departments} columns={['id', 'name', 'manager']} onAdd={() => setManagementModal({ isOpen: true, type: 'Department' })} />;
      case 'budgets': return <BudgetModule />;
      case 'audit-trail': return <GenericListView title="Movement Ledger" icon="fa-history" items={movements} columns={['date', 'item', 'from', 'to', 'status']} />;
      default: return <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} onCheckIn={() => setActiveTab('attendance')} />;
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

  const themeColor = settings.primary_color || 'indigo';

  if (!isInitialized || (loading && !currentUser)) return <div className="flex h-screen items-center justify-center bg-slate-50 poppins font-bold text-slate-400">Loading Enterprise Core...</div>;
  
  if (!currentUser) return <Login onLogin={(u) => { setCurrentUser(u); localStorage.setItem('smartstock_user', JSON.stringify(u)); fetchRoleData(u.role); }} softwareName={settings.software_name} themeColor={themeColor} />;

  return (
    <div className={`flex min-h-screen bg-slate-50 theme-${themeColor}`}>
      <Sidebar userRole={currentUser.role} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => { setCurrentUser(null); localStorage.removeItem('smartstock_user'); }} permissions={currentRole?.permissions?.split(',') || []} appName={settings.software_name} themeColor={themeColor} logoIcon={settings.software_logo} />
      <main className="flex-1 lg:ml-64 p-6 lg:p-10 min-w-0">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 capitalize tracking-tight poppins">{activeTab.replace('-', ' ')}</h1>
                <p className="text-slate-500 font-medium text-sm">Authenticated: <span className={`text-${themeColor}-600 font-bold`}>{currentUser.full_name}</span></p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleCloudSync} 
                disabled={syncing}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
              >
                <i className={`fas ${syncing ? 'fa-spinner animate-spin' : 'fa-cloud-upload-alt'}`}></i>
                {syncing ? 'Syncing...' : 'Backup to Cloud'}
              </button>
            </div>
        </header>
        {dataLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className={`w-10 h-10 border-4 border-${themeColor}-600 border-t-transparent rounded-full animate-spin`}></div>
          </div>
        ) : renderContent()}
      </main>

      {isPurchaseModalOpen && <Modal title="Execute Procurement" onClose={() => setIsPurchaseModalOpen(false)}><PurchaseForm onSubmit={async (i) => { await apiService.saveItem(i); setIsPurchaseModalOpen(false); fetchData(); }} suppliers={suppliers} locations={locations} departments={departments} /></Modal>}
      
      {managementModal.isOpen && (
        <Modal title={`Create ${managementModal.type}`} onClose={() => setManagementModal({ isOpen: false, type: null })}>
          <ManagementForm type={managementModal.type!} onSubmit={async (data) => {
            if (managementModal.type === 'Employee') await apiService.saveEmployee(data);
            if (managementModal.type === 'Department') await apiService.saveDepartment(data);
            if (managementModal.type === 'Category') await apiService.put('categories' as any, data);
            setManagementModal({ isOpen: false, type: null });
            fetchData();
          }} />
        </Modal>
      )}

      {viewingItem && <Modal title="Asset DNA Profile" onClose={() => setViewingItem(null)}><ItemDetails item={viewingItem} /></Modal>}
      {viewingEmployee && <Modal title="Employee Record" onClose={() => setViewingEmployee(null)}><EmployeeDetails employee={viewingEmployee} items={items} /></Modal>}
    </div>
  );
};

export default App;
