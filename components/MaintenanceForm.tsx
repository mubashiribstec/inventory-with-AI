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
    status: initialData?.status || 'OPEN'
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
            <option>Hardware</option>
            <option>Software</option>
            <option>Physical Damage</option>
            <option>Connectivity</option>
            <option>Performance</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Issue Description</label>
        <textarea 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Describe the technical issue in detail..."
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
            <option value="OPEN">OPEN</option>
            <option value="PENDING">PENDING</option>
            <option value="FIXED">FIXED</option>
            <option value="SCRAPPED">SCRAPPED</option>
          </select>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-50">
        <button type="submit" className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold transition shadow-lg shadow-rose-100 flex items-center justify-center gap-2">
          <i className="fas fa-tools"></i>
          <span>Save Ticket</span>
        </button>
      </div>
    </form>
  );
};

export default MaintenanceForm;