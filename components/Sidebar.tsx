import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'inventory' | 'maintenance' | 'suppliers' | 'locations' | 'licenses';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'maintenance' | 'suppliers' | 'locations' | 'licenses') => void;
  openPurchase: () => void;
  openAssign: () => void;
  runAnalysis: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, openPurchase, openAssign, runAnalysis }) => {
  const navItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Overview' },
    { id: 'inventory', icon: 'fa-boxes', label: 'Hardware' },
    { id: 'licenses', icon: 'fa-key', label: 'Licenses' },
    { id: 'maintenance', icon: 'fa-tools', label: 'Maintenance' },
    { id: 'suppliers', icon: 'fa-truck', label: 'Suppliers' },
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col z-30 shadow-sm">
      <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-100">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-100">
          <i className="fas fa-cube"></i>
        </div>
        <h2 className="text-xl font-bold text-slate-800 poppins">
          SmartStock<span className="text-indigo-600 italic">.ERP</span>
        </h2>
      </div>

      <div className="space-y-1 mb-8">
        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Core Modules</p>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <i className={`fas ${item.icon} w-5 text-center ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`}></i>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-1 mb-8">
        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Procurement</p>
        <button onClick={openPurchase} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl transition group">
          <i className="fas fa-plus-circle w-5 text-center text-slate-400 group-hover:text-emerald-500"></i>
          <span className="font-medium">Quick Purchase</span>
        </button>
        <button onClick={openAssign} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl transition group">
          <i className="fas fa-user-plus w-5 text-center text-slate-400 group-hover:text-blue-500"></i>
          <span className="font-medium">Handover</span>
        </button>
      </div>

      <div className="mt-auto p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <i className="fas fa-brain text-xs"></i>
          </div>
          <span className="text-[10px] font-bold text-indigo-900 uppercase">Gemini Audit</span>
        </div>
        <p className="text-[10px] text-indigo-700 leading-relaxed mb-3 font-medium">
          Predict asset failure and optimize replenishment.
        </p>
        <button 
          onClick={runAnalysis}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
        >
          Generate Report
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
