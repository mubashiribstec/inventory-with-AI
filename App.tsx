
import React, { useState, useEffect, useCallback } from 'react';
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
import Login from './components/Login.tsx';
import { ItemStatus, UserRole, User, UserLog, InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, Category, Employee, Department, License, AssetRequest } from './types.ts';
import Modal from './components/Modal.tsx';
import PurchaseForm from './components/PurchaseForm.tsx';
import AssignmentForm from './components/AssignmentForm.tsx';
import ManagementForm from './components/ManagementForm.tsx';
import MaintenanceForm from './components/MaintenanceForm.tsx';
import LicenseForm from './components/LicenseForm.tsx';
import RequestForm from './components/RequestForm.tsx';
import Chatbot from './components/Chatbot.tsx';
import { apiService } from './api.ts';
import { dbService } from './db.ts';

type AppTab = 'dashboard' | 'inventory' | 'maintenance' | 'suppliers' | 'locations' | 'licenses' | 'categories' | 'employees' | 'departments' | 'purchase-history' | 'requests' | 'faulty-reports' | 'budgets' | 'audit-trail' | 'system-logs';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [systemLogs, setSystemLogs] = useState<UserLog[]>([]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
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

  // Load session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('smartstock_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('smartstock_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smartstock_user');
  };

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await dbService.init(); 
      
      const [fItems, fMovements, fSuppliers, fLocations, fMaintenance, fLicenses, fCats, fEmps, fDepts, fRequests] = await Promise.all([
        apiService.getAllItems(),
        apiService.getAllMovements(),
        apiService.getAllSuppliers(),
        apiService.getAllLocations(),
        apiService.getAllMaintenance(),
        apiService.getAllLicenses(),
        apiService.getCategories(),
        apiService.getEmployees(),
        apiService.getDepartments(),
        apiService.getAllRequests()
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

      const rawDepts = fDepts || [];
      const enrichedDepts = rawDepts.map(dept => {
        const spent = (fItems || []).filter(item => item.department === dept.name).reduce((acc, item) => acc + (Number(item.cost) || 0), 0);
        const budget = Number(dept.budget) || 0;
        const utilization = budget > 0 ? (spent / budget) * 100 : 0;
        return { ...dept, spent, remaining: budget - spent, utilization, budget_status: utilization > 100 ? 'OVER BUDGET' : utilization > 85 ? 'NEAR LIMIT' : 'ON TRACK' };
      });
      setDepartments(enrichedDepts);

      if (currentUser.role === UserRole.ADMIN) {
        const logs = await apiService.getSystemLogs();
        setSystemLogs(logs);
      }

    } catch (err) {
      console.error("Fetch data error", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser, fetchData]);

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

  const canEdit = currentUser?.role !== UserRole.STAFF;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const renderContent = () => {
    if (!currentUser) return null;
    
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} />;
      case 'inventory': return <InventoryTable items={items} onUpdate={fetchData} onEdit={canEdit ? setEditingItem : undefined} onView={setViewingItem} />;
      case 'maintenance': return <MaintenanceList logs={maintenance} items={items} onUpdate={fetchData} onAdd={canEdit ? () => setIsMaintenanceModalOpen(true) : undefined} />;
      case 'suppliers': return <SupplierList suppliers={suppliers} />;
      case 'licenses': return <LicenseList licenses={licenses} suppliers={suppliers} onAdd={canEdit ? () => setIsLicenseModalOpen(true) : undefined} />;
      case 'categories': return <GenericListView title="Asset Categories" icon="fa-tags" items={categories} columns={['id', 'name', 'itemCount']} onAdd={canEdit ? () => setManagementModal({ isOpen: true, type: 'Category' }) : undefined} onDelete={canEdit ? (item) => handleManagementDelete(item, 'Category') : undefined} />;
      case 'employees': return <GenericListView title="Employee Registry" icon="fa-users" items={employees} columns={['id', 'name', 'email', 'department', 'role']} onAdd={isAdmin ? () => setManagementModal({ isOpen: true, type: 'Employee' }) : undefined} onDelete={isAdmin ? (item) => handleManagementDelete(item, 'Employee') : undefined} onView={(emp) => setViewingEmployee(emp)} />;
      case 'departments': return <GenericListView title="Departmental Overview" icon="fa-building" items={departments} columns={['id', 'name', 'budget_month', 'head', 'spent', 'budget']} onAdd={isAdmin ? () => setManagementModal({ isOpen: true, type: 'Department' }) : undefined} onDelete={isAdmin ? (item) => handleManagementDelete(item, 'Department') : undefined} />;
      case 'purchase-history': return <GenericListView title="Procurement History" icon="fa-history" items={movements.filter(m => m.status === 'PURCHASED')} columns={['date', 'item', 'from', 'to']} onAdd={canEdit ? () => setIsPurchaseModalOpen(true) : undefined} onEdit={canEdit ? handleEditPurchase : undefined} onDelete={isAdmin ? (m) => handleManagementDelete(m, 'Movement') : undefined} />;
      case 'requests': return <GenericListView title="Employee Asset Requests" icon="fa-clipboard-list" items={requests} columns={['item', 'employee', 'urgency', 'status', 'request_date']} onAdd={() => setIsRequestModalOpen(true)} onDelete={canEdit ? (item) => handleManagementDelete(item, 'Request') : undefined} onView={(item) => alert(item.notes)} />;
      case 'faulty-reports': return <GenericListView title="Faulty Reports" icon="fa-exclamation-circle" items={maintenance} columns={['item_id', 'issue_type', 'description', 'status']} onAdd={() => setIsMaintenanceModalOpen(true)} onView={() => setActiveTab('maintenance')} />;
      case 'budgets': return <GenericListView title="Budget Tracker" icon="fa-wallet" items={departments} columns={['name', 'budget_month', 'budget', 'spent', 'remaining', 'utilization', 'budget_status']} onAdd={isAdmin ? () => setManagementModal({ isOpen: true, type: 'Department' }) : undefined} onView={(dept) => setViewingBudgetBreakdown(dept)} />;
      case 'audit-trail': return <GenericListView title="Movement Ledger" icon="fa-history" items={movements} columns={['date', 'item', 'from', 'to', 'employee', 'department', 'status']} onDelete={isAdmin ? (item) => handleManagementDelete(item, 'Movement') : undefined} />;
      case 'system-logs': return <GenericListView title="System Audit Logs" icon="fa-shield-alt" items={systemLogs} columns={['timestamp', 'username', 'action', 'target_type', 'target_id', 'details']} />;
      default: return <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} />;
    }
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

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

  const handleManagementDelete = async (item, type) => {
    if (window.confirm(`Permanently delete this ${type}?`)) {
      try {
        if (type === 'Category') await apiService.deleteCategory(item.id);
        if (type === 'Employee') await apiService.deleteEmployee(item.id);
        if (type === 'Department') await apiService.deleteDepartment(item.id);
        if (type === 'Movement') await apiService.genericDelete('movements', item.id);
        fetchData();
      } catch (err) { alert(err); }
    }
  };

  const handleEditPurchase = (movement) => {
    const asset = items.find(i => i.name === movement.item);
    if (asset) setEditingItem(asset);
    else alert("Record not found");
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        userRole={currentUser.role}
        activeTab={activeTab as any} 
        setActiveTab={setActiveTab as any} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-10 transition-all duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 lg:hidden">
                <i className="fas fa-bars"></i>
             </div>
             <div>
                <h1 className="text-3xl font-bold text-slate-800 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
                <p className="text-slate-500 mt-1 flex items-center gap-2">
                   <span className="font-bold text-indigo-600">{currentUser.full_name}</span>
                   <span className="px-2 py-0.5 bg-slate-100 text-[10px] rounded-full border border-slate-200 font-bold uppercase">{currentUser.role}</span>
                </p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button onClick={handleInitDB} disabled={syncing} className={`px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold text-sm shadow-sm flex items-center gap-2 ${syncing ? 'opacity-50' : ''}`}>
                <i className={`fas fa-database ${syncing ? 'animate-spin' : ''}`}></i> Sync & Init
              </button>
            )}
            {canEdit && (
              <button onClick={() => { setEditingItem(null); setIsPurchaseModalOpen(true); }} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold text-sm shadow-lg shadow-indigo-100 flex items-center gap-2">
                <i className="fas fa-plus"></i> New Asset
              </button>
            )}
          </div>
        </header>

        {loading ? (
           <div className="flex h-64 w-full items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
           </div>
        ) : renderContent()}
      </main>

      <Chatbot items={items} stats={stats} />

      {/* Modals from before - with minor role checks */}
      {isPurchaseModalOpen && canEdit && (
        <Modal title="🛒 Procurement" onClose={() => setIsPurchaseModalOpen(false)}>
          <PurchaseForm onSubmit={handleSaveItem} suppliers={suppliers} locations={locations} departments={departments} />
        </Modal>
      )}

      {isAssignModalOpen && canEdit && (
        <Modal title="👥 Asset Handover" onClose={() => setIsAssignModalOpen(false)}>
          <AssignmentForm items={items} onSubmit={async (item) => { 
            await apiService.saveItem(item); 
            await apiService.saveMovement({ id: `MOV-${Date.now()}`, date: new Date().toISOString().split('T')[0], item: item.name, from: 'Central Store', to: item.assignedTo, employee: item.assignedTo, department: item.department, status: 'ASSIGNED' });
            setIsAssignModalOpen(false); 
            fetchData();
          }} />
        </Modal>
      )}

      {managementModal.isOpen && (
        <Modal title={`➕ Add ${managementModal.type}`} onClose={() => setManagementModal({ isOpen: false, type: null })}>
          <ManagementForm type={managementModal.type!} onSubmit={handleManagementSubmit} />
        </Modal>
      )}
      {/* ... Other modals */}
    </div>
  );
};

export default App;
