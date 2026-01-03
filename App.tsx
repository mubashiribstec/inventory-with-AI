
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
import RequestForm from './components/RequestForm.tsx';
import { ItemStatus, UserRole, User, InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, Category, Employee, Department, License, AssetRequest, Role, SystemSettings } from './types.ts';
import Modal from './components/Modal.tsx';
import PurchaseForm from './components/PurchaseForm.tsx';
import ManagementForm from './components/ManagementForm.tsx';
import { apiService } from './api.ts';

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

  const [isInitialized, setIsInitialized] = useState(false);
  const [bootStatus, setBootStatus] = useState('Checking connectivity...');
  const [dataLoading, setDataLoading] = useState(false);
  
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [managementModal, setManagementModal] = useState<{ isOpen: boolean, type: 'Category' | 'Employee' | 'Department' | null }>({ isOpen: false, type: null });
  
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  const fetchRoleData = useCallback(async (roleId: string) => {
    try {
      const allRoles = await apiService.getRoles();
      const role = allRoles.find(r => r.id === roleId);
      if (role) setCurrentRole(role);
    } catch (e) {}
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setDataLoading(true);
      const [fItems, fMov, fSup, fLoc, fMaint, fLic, fCat, fEmp, fDept, fReq, fUsers] = await Promise.all([
        apiService.getAllItems(), apiService.getAllMovements(), apiService.getAllSuppliers(),
        apiService.getAllLocations(), apiService.getAllMaintenance(), apiService.getAllLicenses(),
        apiService.getCategories(), apiService.getEmployees(), apiService.getDepartments(),
        apiService.getAllRequests(), apiService.getUsers()
      ]);
      setItems(fItems || []); setMovements(fMov || []); setSuppliers(fSup || []); setLocations(fLoc || []);
      setMaintenance(fMaint || []); setLicenses(fLic || []); setCategories(fCat || []);
      setEmployees(fEmp || []); setDepartments(fDept || []); setRequests(fReq || []); setUsers(fUsers || []);
    } catch (err) {
      console.warn("Hydration incomplete - DB might need manual initialization.");
    } finally {
      setDataLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const startupSequence = async () => {
      try {
        setBootStatus("Probing backend...");
        apiService.initDatabase().catch(e => console.log("Auto-init postponed:", e.message));
        
        const cloudSettings = await apiService.getSettings();
        if (cloudSettings) setSettings(cloudSettings);
        
        const sessionToken = localStorage.getItem('smartstock_user');
        if (sessionToken) {
          const user = JSON.parse(sessionToken);
          setCurrentUser(user);
          await fetchRoleData(user.role);
        }
      } catch (e) {
        console.warn("Soft startup - Proceeding to Login");
      } finally {
        setIsInitialized(true);
      }
    };
    startupSequence();
  }, [fetchRoleData]);

  useEffect(() => {
    document.title = `${settings.software_name} | Enterprise`;
  }, [settings.software_name]);

  useEffect(() => { if (currentUser) fetchData(); }, [currentUser, fetchData]);

  const stats = useMemo(() => ({
    purchased: items.length,
    assigned: items.filter(i => i.status === ItemStatus.ASSIGNED || i.status === ItemStatus.IN_USE).length,
    inUse: items.filter(i => i.status === ItemStatus.IN_USE).length,
    backup: items.filter(i => i.status === ItemStatus.BACKUP).length,
    faulty: items.filter(i => i.status === ItemStatus.FAULTY).length,
    available: items.filter(i => i.status === ItemStatus.AVAILABLE).length,
    licenses_total: licenses.length,
    expiring_soon: 0
  }), [items, licenses]);

  const handleManagementSubmit = async (data: any) => {
    try {
      if (managementModal.type === 'Employee') {
        const employeePayload: Employee = {
          id: data.id,
          name: data.name,
          email: data.email,
          department: data.department,
          role: data.role,
          joining_date: data.joining_date,
          is_active: !!data.is_active
        };
        await apiService.saveEmployee(employeePayload);
        
        if (data.create_user && data.username && data.password) {
           await apiService.saveUser({
              id: `U-${data.id.split('-').pop()}`,
              username: data.username,
              password: data.password,
              role: UserRole.STAFF,
              full_name: data.name,
              department: data.department,
              is_active: true
           });
        }
      } 
      else if (managementModal.type === 'Department') {
        const departmentPayload: Department = {
          id: data.id,
          name: data.name,
          manager: data.manager,
          budget: parseFloat(data.budget) || 0,
          budget_month: data.budget_month
        };
        await apiService.saveDepartment(departmentPayload);
      } 
      else if (managementModal.type === 'Category') {
        await apiService.genericSave('categories', {
          id: data.id,
          name: data.name,
          icon: data.icon
        });
      }
      
      setManagementModal({ isOpen: false, type: null });
      fetchData();
    } catch (err: any) {
      alert(`Database Error: ${err.message}`);
    }
  };

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} onCheckIn={() => setActiveTab('attendance')} themeColor={settings.primary_color} />;
      case 'inventory': return <InventoryTable items={items} onUpdate={fetchData} onEdit={() => {}} onView={setViewingItem} onAddAsset={() => setIsPurchaseModalOpen(true)} themeColor={settings.primary_color} />;
      case 'attendance': return <AttendanceModule currentUser={currentUser} />;
      case 'notifications': return <NotificationCenter currentUser={currentUser} />;
      case 'leaves': return <LeaveModule currentUser={currentUser} allUsers={users} />;
      case 'salaries': return <SalaryModule employees={employees} />;
      case 'user-mgmt': return <UserManagement usersOverride={users} />;
      case 'role-mgmt': return <RoleManagement />;
      case 'settings': return <SettingsModule settings={settings} onUpdate={setSettings} />;
      case 'requests': return <GenericListView title="Employee Requests" icon="fa-clipboard-list" items={requests} columns={['id', 'item', 'employee', 'urgency', 'status', 'request_date']} onAdd={() => setIsRequestModalOpen(true)} />;
      case 'maintenance': return <MaintenanceList logs={maintenance} items={items} onUpdate={fetchData} onAdd={() => setActiveTab('requests')} />;
      case 'suppliers': return <SupplierList suppliers={suppliers} />;
      case 'employees': return <GenericListView title="Staff Directory" icon="fa-users" items={employees} columns={['id', 'name', 'email', 'department', 'role', 'is_active']} onView={setViewingEmployee} onAdd={() => setManagementModal({ isOpen: true, type: 'Employee' })} />;
      case 'departments': return <GenericListView title="Departments & Units" icon="fa-sitemap" items={departments} columns={['id', 'name', 'manager', 'budget']} onAdd={() => setManagementModal({ isOpen: true, type: 'Department' })} />;
      case 'budgets': return <BudgetModule />;
      case 'audit-trail': return <GenericListView title="Audit Trail" icon="fa-history" items={movements} columns={['date', 'item', 'from', 'to', 'status']} />;
      default: return <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} onCheckIn={() => setActiveTab('attendance')} themeColor={settings.primary_color} />;
    }
  };

  const themeColor = settings.primary_color || 'indigo';

  if (!isInitialized) return (
    <div className="flex flex-col h-screen items-center justify-center bg-white poppins">
      <div className={`w-12 h-12 border-4 border-${themeColor}-600 border-t-transparent rounded-full animate-spin mb-4`}></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{bootStatus}</p>
    </div>
  );
  
  if (!currentUser) return (
    <Login 
      onLogin={(u) => { setCurrentUser(u); localStorage.setItem('smartstock_user', JSON.stringify(u)); fetchRoleData(u.role); }} 
      softwareName={settings.software_name} 
      themeColor={themeColor} 
      logoIcon={settings.software_logo}
      description={settings.software_description}
    />
  );

  return (
    <div className={`flex min-h-screen bg-slate-50 theme-${themeColor}`}>
      <Sidebar 
        userRole={currentUser.role} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={() => { setCurrentUser(null); localStorage.removeItem('smartstock_user'); }} 
        permissions={currentRole?.permissions?.split(',') || []} 
        appName={settings.software_name} 
        themeColor={themeColor} 
        logoIcon={settings.software_logo} 
      />
      <main className="flex-1 lg:ml-64 p-6 lg:p-12 min-w-0">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div>
                <h1 className="text-4xl font-bold text-slate-900 capitalize tracking-tight poppins">{activeTab.replace('-', ' ')}</h1>
                <p className="text-slate-500 font-semibold mt-1">Hello, {currentUser.full_name} <span className="mx-2 opacity-20">|</span> <span className={`text-${themeColor}-600 font-bold text-xs uppercase`}>{currentUser.role}</span></p>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Server Status</span>
                  <span className="text-emerald-500 font-bold text-xs flex items-center gap-1.5 justify-end">
                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                     LIVE SYNC
                  </span>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400">
                  <i className="fas fa-search"></i>
               </div>
            </div>
        </header>
        {dataLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className={`w-10 h-10 border-4 border-${themeColor}-600 border-t-transparent rounded-full animate-spin`}></div>
          </div>
        ) : renderContent()}
      </main>

      {isPurchaseModalOpen && <Modal title="Execute Procurement" onClose={() => setIsPurchaseModalOpen(false)}><PurchaseForm onSubmit={async (i) => { await apiService.saveItem(i); setIsPurchaseModalOpen(false); fetchData(); }} suppliers={suppliers} locations={locations} departments={departments} /></Modal>}
      {isRequestModalOpen && <Modal title="New Asset Request" onClose={() => setIsRequestModalOpen(false)}><RequestForm employees={employees} departments={departments} categories={categories} onSubmit={async (req) => { await apiService.genericSave('requests', req); setIsRequestModalOpen(false); fetchData(); }} /></Modal>}
      {managementModal.isOpen && <Modal title={`Manage ${managementModal.type}`} onClose={() => setManagementModal({ isOpen: false, type: null })}><ManagementForm type={managementModal.type!} onSubmit={handleManagementSubmit} /></Modal>}
      {viewingItem && <Modal title="Asset Profile" onClose={() => setViewingItem(null)}><ItemDetails item={viewingItem} /></Modal>}
      {viewingEmployee && <Modal title="Staff Profile" onClose={() => setViewingEmployee(null)}><EmployeeDetails employee={viewingEmployee} items={items} allUsers={users} /></Modal>}
    </div>
  );
};

export default App;
