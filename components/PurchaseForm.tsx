
import React, { useState, useEffect } from 'react';
import { ItemStatus, InventoryItem, Supplier, LocationRecord } from '../types';

interface PurchaseFormProps {
  onSubmit: (item: InventoryItem) => void;
  suppliers: Supplier[];
  locations: LocationRecord[];
  initialData?: InventoryItem;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({ onSubmit, suppliers, locations, initialData }) => {
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    category: initialData?.category || 'Computers',
    serial: initialData?.serial || '',
    status: initialData?.status || ItemStatus.AVAILABLE,
    location: initialData?.location || 'IT Store',
    cost: initialData?.cost?.toString() || '',
    assignedTo: initialData?.assignedTo || '-',
    department: initialData?.department || '-',
    warrantyMonths: '12'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.serial) return;

    const finalItem: InventoryItem = {
      id: formData.id || `IT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: formData.name,
      category: formData.category,
      serial: formData.serial,
      status: formData.status as ItemStatus,
      location: formData.location,
      assignedTo: formData.assignedTo,
      department: formData.department,
      purchaseDate: initialData?.purchaseDate || new Date().toISOString().split('T')[0],
      warranty: initialData?.warranty || new Date(new Date().setMonth(new Date().getMonth() + parseInt(formData.warrantyMonths))).toISOString().split('T')[0],
      cost: parseFloat(formData.cost) || 0
    };

    onSubmit(finalItem);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Asset Name</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category</label>
          <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
          >
            <option>Computers</option>
            <option>Networking</option>
            <option>Peripherals</option>
            <option>Accessories</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Serial Number</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            required
            value={formData.serial}
            onChange={e => setFormData({...formData, serial: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
          <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value as any})}
          >
            {Object.values(ItemStatus).map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cost ($)</label>
          <input 
            type="number" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={formData.cost}
            onChange={e => setFormData({...formData, cost: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Current Location</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
          />
        </div>
      </div>

      <div className="pt-6 border-t border-slate-50">
        <button 
          type="submit" 
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
        >
          <i className="fas fa-save"></i>
          <span>{initialData ? 'Update Asset' : 'Add to Inventory'}</span>
        </button>
      </div>
    </form>
  );
};

export default PurchaseForm;
