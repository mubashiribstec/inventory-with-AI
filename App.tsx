
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import InventoryTable from './components/InventoryTable.tsx';
import Login from './components/Login.tsx';
import SettingsModule from './components/SettingsModule.tsx';
import AttendanceModule from './components/AttendanceModule.tsx';
import { ItemStatus, User, InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License, AssetRequest, Role } from './types.ts';
import { apiService } from './api.ts';
import { dbService } from './db.ts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
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
  const [activationKey, setActivationKey] = useState('');
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);

  const licenseState = useMemo(() => {
    const key = settings.license_key;
    if (!key || !key.includes('.')) return { valid: false, reason: 'Missing' };
    try {
      const [payloadBase64] = key.split('.');
      const payload = JSON.parse(atob(payloadBase64));
      const expiry = new Date(payload.expiry);
      return { 
        valid: expiry > new Date(), 
        reason: expiry > new Date() ? 'Active' : 'Expired',
        expiry: payload.expiry
      };
    } catch (e) { return { valid: false, reason: 'Invalid' }; }
  }, [settings.license_key]);

  const fetchSettings = async () => {
    const cloudSettings = await apiService.getSettings();
    if (cloudSettings) setSettings(cloudSettings);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.updateSettings({ ...settings, license_key: activationKey });
      await fetchSettings();
      alert("Activation successful!");
      setActivationKey('');
    } catch (err: any) { alert(err.message); }
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
      const [fItems, fMov, fSup, fLic] = await Promise.all([
        apiService.getAllItems(), apiService.getAllMovements(), 
        apiService.getAllSuppliers(), apiService.getAllLicenses()
      ]);
      setItems(fItems || []); setMovements(fMov || []); 
      setSuppliers(fSup || []); setLicenses(fLic || []);
    } catch (err) { console.warn("Hydration error", err); }
    finally { setDataLoading(false); }
  }, [currentUser, licenseState.valid]);

  // Polling for SID (every 4s) if not loaded
  useEffect(() => {
    if (isInitialized && currentUser && !licenseState.valid && (!settings.system_id)) {
      const interval = setInterval(fetchSettings, 4000);
      return () => clearInterval(interval);
    }
  }, [isInitialized, currentUser, licenseState.valid, settings.system_id]);

  useEffect(() => {
    const startup = async () => {
      try {
        await dbService.init();
        await fetchSettings();
        const sessionToken = localStorage.getItem('smartstock_user');
        if (sessionToken) {
          const user = JSON.parse(sessionToken);
          setCurrentUser(user);
          await fetchRoleData(user.role);
        }
      } catch (e) { console.error("Startup failed", e); }
      finally { setIsInitialized(true); }
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
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Enterprise System Loading...</p>
      </div>
    </div>
  );
  
  if (!currentUser) return (
    <Login 
      onLogin={(u) => { setCurrentUser(u); localStorage.setItem('smartstock_user', JSON.stringify(u)); fetchRoleData(u.role); }} 
      softwareName={settings.software_name} themeColor={settings.primary_color} 
    />
  );

  if (!licenseState.valid) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 poppins">
      <div className="max-w-xl w-full bg-white rounded-[40px] p-10 shadow-2xl text-center relative overflow-hidden">
        {/* Connection Pulse */}
        <div className={`absolute top-0 right-0 p-6 flex items-center gap-2 text-[9px] font-bold ${settings.is_db_connected ? 'text-emerald-500' : 'text-amber-500'}`}>
           <span className={`w-2 h-2 rounded-full ${settings.is_db_connected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
           {settings.is_db_connected ? 'DB ONLINE' : 'DB CONNECTING...'}
        </div>

        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6">
          <i className="fas fa-key"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">License Authentication</h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">Please provide a valid activation key for this installation.</p>

        <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 text-left">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Identification ID</p>
           <p className="font-mono font-bold text-slate-700 select-all text-lg tracking-wider">
             {settings.system_id || 'SYNCHRONIZING...'}
           </p>
        </div>

        <form onSubmit={handleActivate} className="space-y-4">
           <textarea required rows={3} placeholder="Enter License Key..." className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs" value={activationKey} onChange={e => setActivationKey(e.target.value)} />
           <button type="submit" disabled={!settings.system_id} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition disabled:opacity-50 shadow-xl">Activate License</button>
        </form>
        
        <div className="flex items-center justify-center gap-8 mt-10">
          <button onClick={fetchSettings} className="text-indigo-600 text-xs font-bold uppercase hover:underline">Sync State</button>
          <button onClick={() => { setCurrentUser(null); localStorage.removeItem('smartstock_user'); }} className="text-slate-400 text-xs font-bold hover:text-slate-600 uppercase tracking-widest">Logout</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen bg-slate-50 theme-${settings.primary_color}`}>
      <Sidebar userRole={currentUser.role} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => { setCurrentUser(null); localStorage.removeItem('smartstock_user'); }} permissions={currentRole?.permissions?.split(',') || []} appName={settings.software_name} themeColor={settings.primary_color} logoIcon={settings.software_logo} licenseExpiry={licenseState.expiry} />
      <main className="flex-1 lg:ml-64 p-6 lg:p-12 min-w-0">
        {dataLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} onCheckIn={() => setActiveTab('attendance')} themeColor={settings.primary_color} />}
            {activeTab === 'inventory' && <InventoryTable items={items} onUpdate={fetchData} onEdit={() => {}} onView={() => {}} onAddAsset={() => {}} themeColor={settings.primary_color} />}
            {activeTab === 'settings' && <SettingsModule settings={settings} onUpdate={setSettings} />}
            {activeTab === 'attendance' && <AttendanceModule currentUser={currentUser} />}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
