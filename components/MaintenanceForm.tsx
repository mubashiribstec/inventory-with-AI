
import React, { useState } from 'react';
import { InventoryItem, MaintenanceLog } from '../types';

interface MaintenanceFormProps {
  items: InventoryItem[];
  onSubmit: (log: any) => void;
  initialData?: any;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ items, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    item_id: initialData?.item_id || '',
    issue_type: initialData?.issue_type || 'Hardware',
    description: initialData?.description || '',
    cost: initialData?.cost || 0,
    status: initialData?.status || 'OPEN',
    is_repairable: initialData?.is_repairable ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: initialData?.id || Math.floor(Math.random() * 1000000),
      start_date: initialData?.start_date || new Date().toISOString().split('T')[0]
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Asset Reference</label>
          <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.item_id}
            onChange={(e) => setFormData({...formData, item_id: e.target.value})}
            required
          >
            <option value="">Select Asset...</option>
            {items.map(i => (
              <option key={i.id} value={i.id}>{i.name} ({i.serial})</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Issue Category</label>
          <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.issue_type}
            onChange={(e) => setFormData({...formData, issue_type: e.target.value})}
          >
            <option>Hardware Failure</option>
            <option>Physical Damage</option>
            <option>Software Corruption</option>
            <option>Screen Damage</option>
            <option>Battery Issue</option>
          </select>
        </div>
      </div>

      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
         <div className="flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-slate-800">Repair Assessment</p>
               <p className="text-[10px] text-slate-400 font-medium">Is this asset fixable or should it be scrapped?</p>
            </div>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
               <button 
                  type="button" 
                  onClick={() => setFormData({...formData, is_repairable: true, status: 'OPEN'})}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition ${formData.is_repairable ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  Repairable
               </button>
               <button 
                  type="button" 
                  onClick={() => setFormData({...formData, is_repairable: false, status: 'SCRAPPED'})}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition ${!formData.is_repairable ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  Non-Repairable
               </button>
            </div>
         </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Issue Description</label>
        <textarea 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Describe the damage or fault..."
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Estimated Cost (Rs.)</label>
          <input 
            type="number" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.cost}
            onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Ticket Status</label>
          <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
          >
            <option value="OPEN">OPEN (Awaiting Action)</option>
            <option value="PENDING">PENDING (In Workshop)</option>
            <option value="FIXED">FIXED (Restored to Stock)</option>
            <option value="SCRAPPED">SCRAPPED (Non-Functional)</option>
          </select>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-50">
        <button type="submit" className={`w-full py-4 text-white rounded-2xl font-bold transition shadow-lg flex items-center justify-center gap-2 ${formData.is_repairable ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'}`}>
          <i className="fas fa-tools"></i>
          <span>Save Log Entry</span>
        </button>
      </div>
    </form>
  );
};

export default MaintenanceForm;
