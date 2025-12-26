
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import InventoryTable from './components/InventoryTable.tsx';
import MaintenanceList from './components/MaintenanceList.tsx';
import SupplierList from './components/SupplierList.tsx';
import LicenseList from './components/LicenseList.tsx';
import { ItemStatus, InventoryItem, Movement, Supplier, LocationRecord, MaintenanceLog, License } from './types.ts';
import Modal from './components/Modal.tsx';
import PurchaseForm from './components/PurchaseForm.tsx';
import AssignmentForm from './components/AssignmentForm.tsx';
import Chatbot from './components/Chatbot.tsx';
import { apiService } from './api.ts';

type AppTab = 'dashboard' | 'inventory' | 'maintenance' | 'suppliers' | 'locations' | 'licenses';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [fItems, fMovements, fSuppliers, fLocations, fMaintenance] = await Promise.all([
        apiService.getAllItems(),
        apiService.getAllMovements(),
        apiService.getAllSuppliers(),
        apiService.getAllLocations(),
        apiService.getAllMaintenance()
      ]);
      setItems(fItems || []);
      setMovements(fMovements || []);
      setSuppliers(fSuppliers || []);
      setLocations(fLocations || []);
      setMaintenance(fMaintenance || []);
    } catch (err) {
      console.error("ERP Connectivity Error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = {
    purchased: items.length,
    assigned: items.filter(i => i.status === ItemStatus.ASSIGNED).length,
    inUse: items.filter(i => i.status === ItemStatus.IN_USE).length,
    backup: items.filter(i => i.status === ItemStatus.BACKUP).length,
    faulty: items.filter(i => i.status === ItemStatus.FAULTY).length,
    available: items.filter(i => i.status === ItemStatus.AVAILABLE).length,
    licenses_total: 0,
    expiring_soon: 0
  };

  const handleSaveItem = async (item: InventoryItem) => {
    try {
      if (editingItem) {
        await apiService.updateItem(item.id, item);
      } else {
        await apiService.saveItem(item);
      }
      setIsPurchaseModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      alert("Error saving item: " + err);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} movements={movements} items={items} />;
      case 'inventory': return <InventoryTable items={items} onUpdate={fetchData} onEdit={setEditingItem} />;
      case 'maintenance': return <MaintenanceList logs={maintenance} items={items} onUpdate={fetchData} />;
      case 'suppliers': return <SupplierList suppliers={suppliers} />;
      case 'licenses': return <LicenseList licenses={[]} suppliers={suppliers} />;
      default: return <Dashboard stats={stats} movements={movements} items={items} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="font-bold text-slate-600 poppins uppercase tracking-widest text-[10px]">Synchronizing ERP Modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        activeTab={activeTab as any} 
        setActiveTab={setActiveTab as any} 
        openPurchase={() => { setEditingItem(null); setIsPurchaseModalOpen(true); }}
        openAssign={() => setIsAssignModalOpen(true)} 
        runAnalysis={fetchData}
      />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-10 transition-all duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 capitalize tracking-tight">
              {activeTab} Module
            </h1>
            <p className="text-slate-500 mt-1">SmartStock Enterprise Resource Planning</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition">
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </header>

        {renderContent()}
      </main>

      <Chatbot items={items} stats={stats} />

      {isPurchaseModalOpen && (
        <Modal title="🛒 ERP - New Procurement" onClose={() => setIsPurchaseModalOpen(false)}>
          <PurchaseForm onSubmit={handleSaveItem} suppliers={suppliers} locations={locations} />
        </Modal>
      )}

      {isAssignModalOpen && (
        <Modal title="👥 Asset Handover" onClose={() => setIsAssignModalOpen(false)}>
          <AssignmentForm items={items} onSubmit={async (item) => { await apiService.saveItem(item); setIsAssignModalOpen(false); fetchData();}} />
        </Modal>
      )}

      {editingItem && (
        <Modal title="✏️ Edit Asset" onClose={() => setEditingItem(null)}>
          <PurchaseForm 
            initialData={editingItem} 
            onSubmit={handleSaveItem} 
            suppliers={suppliers} 
            locations={locations} 
          />
        </Modal>
      )}
    </div>
  );
};

export default App;
