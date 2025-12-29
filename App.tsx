
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
import { ItemStatus, InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, Category, Employee, Department, License, AssetRequest } from './types.ts';
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

type AppTab = 'dashboard' | 'inventory' | 'maintenance' | 'suppliers' | 'locations' | 'licenses' | 'categories' | 'employees' | 'departments' | 'purchase-history' | 'requests' | 'faulty-reports' | 'budgets' | 'audit-trail';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  const fetchData = useCallback(async () => {
    try {
      setError(null);
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
      
      const safeItems = fItems || [];
      setItems(safeItems);
      setMovements(fMovements || []);
      setSuppliers(fSuppliers || []);
      setLocations(fLocations || []);
      setMaintenance(fMaintenance || []);
      setLicenses(fLicenses || []);
      setRequests(fRequests || []);
      
      // Derive categories if API returns empty
      setCategories(fCats && fCats.length > 0 ? fCats : [...new Set(safeItems.map(i => i.category))].map((name, i) => ({
        id: `CAT-${i}`,
        name,
        icon: name.toLowerCase().includes('comp') ? 'fa-laptop' : 'fa-tags',
        itemCount: safeItems.filter(item => item.category === name).length
      })));

      // Derive employees if API returns empty
      setEmployees(fEmps && fEmps.length > 0 ? fEmps : [...new Set(safeItems.map(i => i.assignedTo))].filter(e => e && e !== '-').map((name, i) => ({
        id: `EMP-${100 + i}`,
        name,
        email: `${name.toLowerCase().replace(' ', '.')}@enterprise.com`,
        department: safeItems.find(item => item.assignedTo === name)?.department || 'IT',
        role: 'Professional Staff'
      })));

      // Department logic
      const rawDepts = (fDepts && fDepts.length > 0) 
        ? fDepts 
        : ['IT Infrastructure', 'Marketing & Creative', 'Finance', 'Human Resources', 'Sales'].map((name, i) => ({
            id: `DEPT-${i}`,
            name,
            head: 'Department Lead',
            budget: 50000 + (i * 10000),
            spent: 0,
            budget_month: new Date().toISOString().substring(0, 7)
          }));

      const enrichedDepts = rawDepts.map(dept => {
        const spent = safeItems
          .filter(item => item.department === dept.name)
          .reduce((acc, item) => acc + (Number(item.cost) || 0), 0);
        
        const budget = Number(dept.budget) || 0;
        const remaining = budget - spent;
        const utilization = budget > 0 ? (spent / budget) * 100 : 0;
        
        let budget_status = 'ON TRACK';
        if (utilization > 100) budget_status = 'OVER BUDGET';
        else if (utilization > 85) budget_status = 'NEAR LIMIT';

        return { ...dept, spent, remaining, utilization, budget_status };
      });

      setDepartments(enrichedDepts);

    } catch (err: any) {
      setError("ERP server connectivity issues. Local sync active.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInitDB = async () => {
    setSyncing(true);
    try {
      const result = await apiService.initDatabase();
      alert(result.message);
      await fetchData();
    } catch (err: any) {
      alert("Database initialization failed: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveItem = async (item: InventoryItem) => {
    try {
      if (editingItem) {
        await apiService.updateItem(item.id, item);
      } else {
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
    } catch (err) { alert("Error saving item: " + err); }
  };

  const handleManagementSubmit = async (data: any) => {
    try {
      if (managementModal.type === 'Category') await apiService.saveCategory(data);
      if (managementModal.type === 'Employee') await apiService.saveEmployee(data);
      if (managementModal.type === 'Department') await apiService.saveDepartment(data);
      setManagementModal({ isOpen: false, type: null });
      fetchData();
    } catch (err) { alert("Error saving " + managementModal.type + ": " + err); }
  };

  const handleMaintenanceSubmit = async (log: MaintenanceLog) => {
    try {
      await apiService.saveMaintenance(log);
      setIsMaintenanceModalOpen(false);
      fetchData();
    } catch (err) { alert("Error saving ticket: " + err); }
  };

  const handleLicenseSubmit = async (license: License) => {
    try {
      await apiService.saveLicense(license);
      setIsLicenseModalOpen(false);
      fetchData();
    } catch (err) { alert("Error saving license: " + err); }
  };

  const handleRequestSubmit = async (req: AssetRequest) => {
    try {
      await apiService.saveRequest(req);
      setIsRequestModalOpen(false);
      fetchData();
    } catch (err) { alert("Error saving request: " + err); }
  };

  const handleManagementDelete = async (item: any, type: string) => {
    if (window.confirm(`Permanently delete this ${type}?`)) {
      try {
        if (type === 'Category') await apiService.deleteCategory(item.id);
        if (type === 'Employee') await apiService.deleteEmployee(item.id);
        if (type === 'Department') await apiService.deleteDepartment(item.id);
        if (type === 'License') await apiService.deleteLicense(item.id);
        if (type === 'Maintenance') await apiService.deleteMaintenance(item.id);
        if (type === 'Request') await apiService.deleteRequest(item.id);
        if (type === 'Movement') await apiService.genericDelete('movements', item.id);
        fetchData();
      } catch (err) { alert(`Error deleting ${type}: ${err}`); }
    }
  };

  const handleEditPurchase = (movement: Movement) => {
    // Find the item associated with the name in the movement log
    const asset = items.find(i => i.name === movement.item);
    if (asset) {
      setEditingItem(asset);
    } else {
      alert("Asset record for this purchase could not be located.");
    }
  };

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} />;
      case 'inventory': return <InventoryTable items={items} onUpdate={fetchData} onEdit={setEditingItem} onView={setViewingItem} />;
      case 'maintenance': return <MaintenanceList logs={maintenance} items={items} onUpdate={fetchData} onAdd={() => setIsMaintenanceModalOpen(true)} />;
      case 'suppliers': return <SupplierList suppliers={suppliers} />;
      case 'licenses': return <LicenseList licenses={licenses} suppliers={suppliers} onAdd={() => setIsLicenseModalOpen(true)} />;
      case 'categories': return (
        <GenericListView 
          title="Asset Categories" icon="fa-tags" items={categories} columns={['id', 'name', 'itemCount']} 
          onAdd={() => setManagementModal({ isOpen: true, type: 'Category' })} 
          onDelete={(item) => handleManagementDelete(item, 'Category')}
        />
      );
      case 'employees': return (
        <GenericListView 
          title="Employee Registry" icon="fa-users" items={employees} columns={['id', 'name', 'email', 'department', 'role']} 
          onAdd={() => setManagementModal({ isOpen: true, type: 'Employee' })} 
          onDelete={(item) => handleManagementDelete(item, 'Employee')}
          onView={(emp) => setViewingEmployee(emp)}
        />
      );
      case 'departments': return (
        <GenericListView 
          title="Departmental Overview" icon="fa-building" items={departments} columns={['id', 'name', 'budget_month', 'head', 'spent', 'budget']} 
          onAdd={() => setManagementModal({ isOpen: true, type: 'Department' })} 
          onDelete={(item) => handleManagementDelete(item, 'Department')}
        />
      );
      case 'purchase-history': return (
        <GenericListView 
          title="Procurement History" icon="fa-history" items={movements.filter(m => m.status === 'PURCHASED')} columns={['date', 'item', 'from', 'to']} 
          onAdd={() => setIsPurchaseModalOpen(true)} 
          onEdit={handleEditPurchase}
          onDelete={(m) => handleManagementDelete(m, 'Movement')}
        />
      );
      case 'requests': return (
        <GenericListView 
          title="Employee Asset Requests" 
          icon="fa-clipboard-list" 
          items={requests} 
          columns={['item', 'employee', 'urgency', 'status', 'request_date']} 
          onAdd={() => setIsRequestModalOpen(true)}
          onDelete={(item) => handleManagementDelete(item, 'Request')}
          onView={(item) => alert(`Request Notes: ${item.notes || 'No notes provided.'}`)}
        />
      );
      case 'faulty-reports': return (
        <GenericListView 
          title="Faulty Reports" icon="fa-exclamation-circle" items={maintenance} columns={['item_id', 'issue_type', 'description', 'status']} 
          onAdd={() => setIsMaintenanceModalOpen(true)} 
          onView={(item) => { setActiveTab('maintenance'); }} 
        />
      );
      case 'budgets': return (
        <GenericListView 
          title="Budget Tracker" 
          icon="fa-wallet" 
          items={departments} 
          columns={['name', 'budget_month', 'budget', 'spent', 'remaining', 'utilization', 'budget_status']} 
          onAdd={() => setManagementModal({ isOpen: true, type: 'Department' })} 
          onDelete={(item) => handleManagementDelete(item, 'Department')}
          onView={(dept) => setViewingBudgetBreakdown(dept)}
        />
      );
      case 'audit-trail': return (
        <GenericListView 
          title="Comprehensive Audit Trail" 
          icon="fa-history" 
          items={movements} 
          columns={['date', 'item', 'from', 'to', 'employee', 'department', 'status']} 
          onDelete={(item) => handleManagementDelete(item, 'Movement')}
        />
      );
      default: return <Dashboard stats={stats} movements={movements} items={items} onFullAudit={() => setActiveTab('audit-trail')} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="font-bold text-slate-600 uppercase tracking-widest text-[10px]">Synchronizing SmartStock ERP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        activeTab={activeTab as any} 
        setActiveTab={setActiveTab as any} 
        openPurchase={() => setIsPurchaseModalOpen(true)}
        openAssign={() => setIsAssignModalOpen(true)} 
        runAnalysis={fetchData}
      />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-10 transition-all duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
            <p className="text-slate-500 mt-1">SmartStock Enterprise Resource Planning</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleInitDB} disabled={syncing} className={`px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-bold text-sm shadow-sm flex items-center gap-2 ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <i className={`fas fa-database ${syncing ? 'animate-spin' : ''}`}></i> Sync & Init
            </button>
            <button onClick={() => { setEditingItem(null); setIsPurchaseModalOpen(true); }} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold text-sm shadow-lg shadow-indigo-100 flex items-center gap-2">
              <i className="fas fa-plus"></i> New Asset
            </button>
          </div>
        </header>

        {renderContent()}
      </main>

      <Chatbot items={items} stats={stats} />

      {isPurchaseModalOpen && (
        <Modal title="🛒 ERP - Procurement" onClose={() => setIsPurchaseModalOpen(false)}>
          <PurchaseForm 
            onSubmit={handleSaveItem} 
            suppliers={suppliers} 
            locations={locations} 
            departments={departments}
          />
        </Modal>
      )}

      {isAssignModalOpen && (
        <Modal title="👥 Asset Handover" onClose={() => setIsAssignModalOpen(false)}>
          <AssignmentForm items={items} onSubmit={async (item) => { 
            await apiService.saveItem(item); 
            await apiService.saveMovement({
              id: `MOV-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              item: item.name,
              from: 'Central Store',
              to: item.assignedTo,
              employee: item.assignedTo,
              department: item.department,
              status: 'ASSIGNED'
            });
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

      {isMaintenanceModalOpen && (
        <Modal title="🔧 Maintenance Ticket" onClose={() => setIsMaintenanceModalOpen(false)}>
          <MaintenanceForm items={items} onSubmit={handleMaintenanceSubmit} />
        </Modal>
      )}

      {isLicenseModalOpen && (
        <Modal title="🔑 Software License" onClose={() => setIsLicenseModalOpen(false)}>
          <LicenseForm suppliers={suppliers} onSubmit={handleLicenseSubmit} />
        </Modal>
      )}

      {isRequestModalOpen && (
        <Modal title="📋 New Asset Request" onClose={() => setIsRequestModalOpen(false)}>
          <RequestForm 
            employees={employees} 
            departments={departments} 
            categories={categories} 
            onSubmit={handleRequestSubmit} 
          />
        </Modal>
      )}

      {(editingItem) && (
        <Modal title="✏️ Edit Asset / Purchase" onClose={() => setEditingItem(null)}>
          <PurchaseForm 
            initialData={editingItem} 
            onSubmit={handleSaveItem} 
            suppliers={suppliers} 
            locations={locations} 
            departments={departments}
          />
        </Modal>
      )}

      {viewingItem && (
        <Modal title="🔍 Intelligence View" onClose={() => setViewingItem(null)}>
          <ItemDetails item={viewingItem} />
        </Modal>
      )}

      {viewingEmployee && (
        <Modal title="👤 Staff Profile" onClose={() => setViewingEmployee(null)}>
          <EmployeeDetails employee={viewingEmployee} items={items} />
        </Modal>
      )}

      {viewingBudgetBreakdown && (
        <Modal title="💰 Spend Breakdown" onClose={() => setViewingBudgetBreakdown(null)}>
          <BudgetBreakdown department={viewingBudgetBreakdown} items={items} />
        </Modal>
      )}
    </div>
  );
};

export default App;
