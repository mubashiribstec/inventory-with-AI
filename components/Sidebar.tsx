
import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'inventory' | 'maintenance' | 'suppliers' | 'locations' | 'licenses' | 'categories' | 'employees' | 'departments' | 'purchase-history' | 'requests' | 'faulty-reports' | 'budgets' | 'audit-trail';
  setActiveTab: (tab: any) => void;
  openPurchase: () => void;
  openAssign: () => void;
  runAnalysis: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, openPurchase, openAssign, runAnalysis }) => {
  const navGroups = [
    {
      title: 'Analytics',
      items: [
        { id: 'dashboard', icon: 'fa-chart-line', label: 'Overview' },
        { id: 'budgets', icon: 'fa-wallet', label: 'Budget Tracker' },
        { id: 'audit-trail', icon: 'fa-history', label: 'Movement Ledger' },
      ]
    },
    {
      title: 'Inventory Control',
      items: [
        { id: 'inventory', icon: 'fa-boxes', label: 'Hardware Registry' },
        { id: 'categories', icon: 'fa-tags', label: 'Asset Categories' },
        { id: 'licenses', icon: 'fa-key', label: 'License Compliance' },
      ]
    },
    {
      title: 'Procurement & Ops',
      items: [
        { id: 'purchase-history', icon: 'fa-history', label: 'Purchase Ledger' },
        { id: 'requests', icon: 'fa-clipboard-list', label: 'Employee Requests' },
        { id: 'maintenance', icon: 'fa-tools', label: 'Maintenance Hub' },
        { id: 'faulty-reports', icon: 'fa-exclamation-triangle', label: 'Faulty Reports' },
      ]
    },
    {
      title: 'Organization',
      items: [
        { id: 'employees', icon: 'fa-users', label: 'Staff Directory' },
        { id: 'departments', icon: 'fa-building', label: 'Departments' },
        { id: 'suppliers', icon: 'fa-truck', label: 'Vendor Scorecard' },
        { id: 'locations', icon: 'fa-map-marker-alt', label: 'Site Map' },
      ]
    }
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-30 shadow-sm hidden lg:flex custom-scrollbar overflow-y-auto">
      <div className="p-6 sticky top-0 bg-white z-10 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-100">
            <i className="fas fa-warehouse"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800 poppins">
            SmartStock<span className="text-indigo-600 italic">.PRO</span>
          </h2>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-6">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{group.title}</p>
            <div className="space-y-1">
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                    activeTab === item.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <i className={`fas ${item.icon} w-5 text-center ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`}></i>
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-6 bg-slate-50 border-t border-slate-100">
        <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-robot text-xs"></i>
            <span className="text-[10px] font-bold uppercase">Proactive Insight</span>
          </div>
          <p className="text-[10px] text-indigo-100 mb-3 line-clamp-2">
            AI analysis suggests 3 departments are near budget capacity.
          </p>
          <button 
            onClick={runAnalysis}
            className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-2 backdrop-blur-sm"
          >
            <i className="fas fa-calculator text-[8px]"></i> Verify Budgets
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
