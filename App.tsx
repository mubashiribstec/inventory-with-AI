
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import InventoryTable from './components/InventoryTable.tsx';
import Login from './components/Login.tsx';
import SettingsModule from './components/SettingsModule.tsx';
import AttendanceModule from './components/AttendanceModule.tsx';
import LeaveModule from './components/LeaveModule.tsx';
import UserManagement from './components/UserManagement.tsx';
import SalaryModule from './components/SalaryModule.tsx';
import BudgetModule from './components/BudgetModule.tsx';
import NotificationCenter from './components/NotificationCenter.tsx';
import RoleManagement from './components/RoleManagement.tsx';
import LicenseList from './components/LicenseList.tsx';
import MaintenanceList from './components/MaintenanceList.tsx';
import GenericListView from './components/GenericListView.tsx';
import SupplierList from './components/SupplierList.tsx';
import Modal from './components/Modal.tsx';
import ManagementForm from './components/ManagementForm.tsx';

import { ItemStatus, User, InventoryItem, Movement, Supplier, License, Role, Department, LocationRecord, MaintenanceLog, Employee } from './types.ts';
import { apiService } from './api.ts';
import { dbService } from './db.ts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<any>({ 
    id: 'GLOBAL', 
    software_name: 'SmartStock Pro', 
    primary_color: 'indigo', 
    system_id: null,
    is_db_connected: false
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationKey, setActivationKey] = useState('');
  
  // Generic Management State
  const [mgmtModal, setMgmtModal] = useState<{ open: boolean; type: 'Employee' | 'Department' | 'Category'; data?: any }>({ open: false, type: 'Employee' });

  // Enterprise Data State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);

  const fetchSettings = useCallback(async () => {
    try {
      const cloudSettings = await apiService.getSettings();
      if (cloudSettings) {
        setSettings(cloudSettings);
        return cloudSettings.system_id;
      }
    } catch (e) { console.warn("Sync pending..."); }
    return null;
  }, []);

  const licenseState = useMemo(() => {
    const key = settings.license_key;
    if (!key || !key.includes('.')) return { valid: false, reason: 'Unlicensed' };
    try {
      const [payloadBase64] = key.split('.');
      const normalizedBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(normalizedBase64));
      const expiry = new Date(payload.expiry);
      return { 
        valid: expiry > new Date(), 
        reason: expiry > new Date() ? 'Active' : 'Expired',
        expiry: payload.expiry
      };
    } catch (e) { return { valid: false, reason: 'Invalid Key' }; }
  }, [settings.license_key]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isActivating || !activationKey) return;
    setIsActivating(true);
    try {
      await apiService.updateSettings({ ...settings, license_key: activationKey });
      await fetchSettings();
      alert("System activated.");
      setActivationKey('');
    } catch (err: any) { 
      alert(err.message || "Activation Error."); 
    } finally { setIsActivating(false); }
  };

  const fetchCoreData = useCallback(async () => {
    if (!currentUser || !licenseState.valid) return;
    try {
      setDataLoading(true);
      const [fItems, fMov, fSup, fLic, fUsers, fEmp, fDepts, fLocs, fMaint] = await Promise.all([
        apiService.getAllItems(), apiService.getAllMovements(), 
        apiService.getAllSuppliers(), apiService.getAllLicenses(),
        apiService.getUsers(), apiService.get<Employee>("employees"),
        apiService.get<Department>("departments"), apiService.get<LocationRecord>("locations"),
        apiService.get<MaintenanceLog>("maintenance_logs")
      ]);
      setItems(fItems || []); 
      setMovements(fMov || []); 
      setSuppliers(fSup || []); 
      setLicenses(fLic || []);
      setAllUsers(fUsers || []);
      setEmployees(fEmp || []);
      setDepartments(fDepts || []);
      setLocations(fLocs || []);
      setMaintenanceLogs(fMaint || []);
    } catch (err) { console.warn("Refresh failed", err); }
    finally { setDataLoading(false); }
  }, [currentUser, licenseState.valid]);

  useEffect(() => {
    const startup = async () => {
      try {
        await dbService.init();
        await fetchSettings();
        const sessionToken = localStorage.getItem('smartstock_user');
        if (sessionToken) {
          const user = JSON.parse(sessionToken);
          setCurrentUser(user);
          const allRoles = await apiService.getRoles();
          const role = allRoles.find(r => r.id === user.role);
          if (role) setCurrentRole(role);
        }
      } catch (e) { console.error("Identity Error", e); }
      finally { setIsInitialized(true); }
    };
    startup();
  }, [fetchSettings]);

  useEffect(() => { if (currentUser) fetchCoreData(); }, [currentUser, fetchCoreData]);

  // Generic Persistence Logic
  const handleSaveGeneric = async (data: any) => {
    try {
      const store = mgmtModal.type === 'Employee' ? 'employees' : mgmtModal.type === 'Department' ? 'departments' : 'categories';
      await apiService.genericSave(store, data);
      setMgmtModal({ ...mgmtModal, open: false });
      fetchCoreData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteGeneric = async (type: string, id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        const store = type === 'Employee' ? 'employees' : 'departments';
        await apiService.genericDelete(store, id);
        fetchCoreData();
      } catch (err: any) { alert(err.message); }
    }
  };

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

  // Modular Component Router
  const renderModule = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} onCheckIn={() => setActiveTab('attendance')} themeColor={settings.primary_color} />;
      case 'inventory': return <InventoryTable items={items} onUpdate={fetchCoreData} onEdit={() => {}} onView={() => {}} onAddAsset={() => {}} themeColor={settings.primary_color} />;
      case 'attendance': return <AttendanceModule currentUser={currentUser!} />;
      case 'leaves': return <LeaveModule currentUser={currentUser!} allUsers={allUsers} />;
      case 'user-mgmt': return <UserManagement />;
      case 'salaries': return <SalaryModule employees={employees} />;
      case 'budgets': return <BudgetModule />;
      case 'notifications': return <NotificationCenter currentUser={currentUser!} />;
      case 'roles': return <RoleManagement />;
      case 'settings': return <SettingsModule settings={settings} onUpdate={setSettings} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'licenses': return <LicenseList licenses={licenses} suppliers={suppliers} onAdd={() => {}} onUpdate={fetchCoreData} />;
      case 'audit-trail': return <GenericListView title="System Audit Ledger" icon="fa-stream" items={movements} columns={['date', 'item', 'from', 'to', 'status']} />;
      case 'employees': return (
        <GenericListView 
          title="Staff Directory" 
          icon="fa-users-cog" 
          items={employees} 
          columns={['id', 'name', 'department', 'role', 'joining_date', 'is_active']} 
          onAdd={() => setMgmtModal({ open: true, type: 'Employee' })}
          onEdit={(item) => setMgmtModal({ open: true, type: 'Employee', data: item })}
          onDelete={(item) => handleDeleteGeneric('Employee', item.id)}
        />
      );
      case 'departments': return (
        <GenericListView 
          title="Organizational Units" 
          icon="fa-sitemap" 
          items={departments} 
          columns={['id', 'name', 'manager']} 
          onAdd={() => setMgmtModal({ open: true, type: 'Department' })}
          onEdit={(item) => setMgmtModal({ open: true, type: 'Department', data: item })}
          onDelete={(item) => handleDeleteGeneric('Department', item.id)}
        />
      );
      case 'maintenance': return <MaintenanceList logs={maintenanceLogs} items={items} onUpdate={fetchCoreData} onAdd={() => {}} />;
      case 'suppliers': return <SupplierList suppliers={suppliers} />;
      case 'locations': return <GenericListView title="Physical Locations" icon="fa-map-marker-alt" items={locations} columns={['id', 'building', 'floor', 'room', 'manager']} />;
      default: return <div className="p-20 text-center text-slate-400 poppins">Module <b>{activeTab}</b> is currently being initialized...</div>;
    }
  };

  if (!isInitialized) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!currentUser) return (
    <Login onLogin={(u) => { setCurrentUser(u); localStorage.setItem('smartstock_user', JSON.stringify(u)); window.location.reload(); }} softwareName={settings.software_name} themeColor={settings.primary_color} />
  );

  if (!licenseState.valid) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 poppins">
      <div className="max-w-xl w-full bg-white rounded-[40px] p-10 text-center shadow-2xl">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl">
          <i className="fas fa-lock"></i>
        </div>
        <h2 className="text-2xl font-bold mb-4">Software Activation</h2>
        <p className="text-slate-500 mb-6">Your system is currently locked. Provide your System ID to your administrator to receive an activation key.</p>
        <div className="bg-slate-50 p-4 rounded-xl mb-6 font-mono text-sm border border-slate-100">{settings.system_id || 'Generating ID...'}</div>
        <textarea required rows={3} placeholder="Activation Key" className="w-full p-4 border rounded-xl mb-4 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none" value={activationKey} onChange={e => setActivationKey(e.target.value)} />
        <button onClick={handleActivate} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100">Activate Enterprise Access</button>
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen bg-slate-50 theme-${settings.primary_color}`}>
      <Sidebar 
        userRole={currentUser.role} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={() => { setCurrentUser(null); localStorage.removeItem('smartstock_user'); window.location.reload(); }} 
        permissions={currentRole?.permissions?.split(',') || []} 
        appName={settings.software_name} 
        themeColor={settings.primary_color} 
        logoIcon={settings.software_logo} 
        licenseExpiry={licenseState.expiry} 
      />
      <main className="flex-1 lg:ml-64 p-6 lg:p-12">
        {dataLoading && <div className="fixed top-0 left-0 w-full h-1 bg-indigo-600 animate-pulse z-50"></div>}
        <div className="max-w-[1440px] mx-auto">
          {renderModule()}
        </div>
      </main>

      {mgmtModal.open && (
        <Modal title={`${mgmtModal.data ? 'Update' : 'Register'} ${mgmtModal.type}`} onClose={() => setMgmtModal({ ...mgmtModal, open: false })}>
          <ManagementForm type={mgmtModal.type} initialData={mgmtModal.data} onSubmit={handleSaveGeneric} />
        </Modal>
      )}
    </div>
  );
};

export default App;
