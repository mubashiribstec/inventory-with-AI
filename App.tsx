
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
import { dbService } from './db.ts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [settings, setSettings] = useState<any>({ id: 'GLOBAL', software_name: 'Inventory System', primary_color: 'indigo' });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [activationKey, setActivationKey] = useState('');
  
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

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [managementModal, setManagementModal] = useState<{ isOpen: boolean, type: 'Category' | 'Employee' | 'Department' | null }>({ isOpen: false, type: null });
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // --- CRYPTO VALIDATION ON FRONTEND ---
  const licenseState = useMemo(() => {
    const key = settings.license_key;
    if (!key || !key.includes('.')) return { valid: false, reason: 'Key Missing' };
    
    try {
      const [payloadBase64] = key.split('.');
      const payload = JSON.parse(atob(payloadBase64));
      const expiry = new Date(payload.expiry);
      const isExpired = expiry < new Date();
      
      const diff = expiry.getTime() - new Date().getTime();
      const days = Math.ceil(diff / (1000 * 3600 * 24));
      
      return { 
        valid: !isExpired, 
        reason: isExpired ? 'Expired' : 'Active',
        expiry: payload.expiry,
        daysRemaining: days
      };
    } catch (e) {
      return { valid: false, reason: 'Invalid Format' };
    }
  }, [settings.license_key]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.updateSettings({ ...settings, license_key: activationKey });
      const fresh = await apiService.getSettings();
      setSettings(fresh);
      alert("License successfully activated!");
      setActivationKey('');
    } catch (err: any) {
      alert(err.message || "Activation failed. Incorrect signature.");
    }
  };

  const fetchRoleData = useCallback(async (roleId: string) => {
    try {
      const allRoles = await apiService.getRoles();
      const role = allRoles.find(r => r.id === roleId);
      if (role) setCurrentRole(role);
    } catch (e) {}
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser || !licenseState.valid) return;
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
      console.warn("Hydration error", err);
    } finally {
      setDataLoading(false);
    }
  }, [currentUser, licenseState.valid]);

  useEffect(() => {
    const startup = async () => {
      try {
        await dbService.init();
        const cloudSettings = await apiService.getSettings();
        if (cloudSettings) setSettings(cloudSettings);
        const sessionToken = localStorage.getItem('smartstock_user');
        if (sessionToken) {
          const user = JSON.parse(sessionToken);
          setCurrentUser(user);
          await fetchRoleData(user.role);
        }
      } catch (e) {} finally { setIsInitialized(true); }
    };
    startup();
  }, [fetchRoleData]);

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

  if (!isInitialized) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!currentUser) return <Login onLogin={(u) => { setCurrentUser(u); localStorage.setItem('smartstock_user', JSON.stringify(u)); fetchRoleData(u.role); }} softwareName={settings.software_name} themeColor={settings.primary_color} />;

  // --- RENDER LICENSE LOCK SCREEN ---
  if (!licenseState.valid) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 poppins">
      <div className="max-w-xl w-full bg-white rounded-[40px] p-10 shadow-2xl animate-fadeIn text-center">
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-8 border border-rose-100">
          <i className="fas fa-shield-virus"></i>
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Access Restricted</h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          The software license for <span className="font-bold text-indigo-600">{settings.software_name}</span> is {licenseState.reason.toLowerCase()}. Please provide a valid activation key to resume operations.
        </p>

        <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100 text-left">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Identification ID</p>
           <p className="font-mono font-bold text-slate-700 select-all">{settings.system_id || 'NOT_GEN'}</p>
           <p className="text-[9px] text-slate-400 mt-2 italic">Provide this ID to your vendor to receive a new Signed Yearly Key.</p>
        </div>

        <form onSubmit={handleActivate} className="space-y-4">
           <textarea 
             required
             rows={3}
             placeholder="Paste your signed activation key here..."
             className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
             value={activationKey}
             onChange={e => setActivationKey(e.target.value)}
           />
           <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2">
              <i className="fas fa-key"></i> Verify & Unlock System
           </button>
        </form>
        <button onClick={() => { setCurrentUser(null); localStorage.removeItem('smartstock_user'); }} className="mt-6 text-slate-400 text-xs font-bold hover:text-slate-600 uppercase tracking-widest">Logout & Return</button>
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen bg-slate-50 theme-${settings.primary_color}`}>
      <Sidebar 
        userRole={currentUser.role} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={() => { setCurrentUser(null); localStorage.removeItem('smartstock_user'); }} 
        permissions={currentRole?.permissions?.split(',') || []} 
        appName={settings.software_name} 
        themeColor={settings.primary_color} 
        logoIcon={settings.software_logo} 
        licenseExpiry={licenseState.expiry}
      />
      <main className="flex-1 lg:ml-64 p-6 lg:p-12 min-w-0">
        {licenseState.daysRemaining !== null && licenseState.daysRemaining < 15 && (
           <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between text-amber-800">
              <p className="text-xs font-bold"><i className="fas fa-exclamation-triangle mr-2"></i> Yearly License expiring in {licenseState.daysRemaining} days. Plan your renewal to avoid downtime.</p>
           </div>
        )}
        {dataLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} onCheckIn={() => setActiveTab('attendance')} themeColor={settings.primary_color} />}
            {activeTab === 'inventory' && <InventoryTable items={items} onUpdate={fetchData} onEdit={() => {}} onView={setViewingItem} onAddAsset={() => setIsPurchaseModalOpen(true)} themeColor={settings.primary_color} />}
            {activeTab === 'settings' && <SettingsModule settings={settings} onUpdate={setSettings} />}
            {/* ... other modules ... */}
          </>
        )}
      </main>
      
      {/* Modals remain same ... */}
    </div>
  );
};

export default App;
