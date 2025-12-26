
import React, { useState } from 'react';
import { ItemStatus, InventoryItem, Supplier, LocationRecord } from '../types';

// Updated interface to include suppliers and locations passed from App.tsx
interface PurchaseFormProps {
  onSubmit: (item: InventoryItem) => void;
  suppliers: Supplier[];
  locations: LocationRecord[];
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({ onSubmit, suppliers, locations }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Computers',
    serial: '',
    supplier: '',
    price: '',
    warrantyMonths: '12'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.serial) return;

    // Fixed newItem creation by relying on the updated InventoryItem interface
    const newItem: InventoryItem = {
      id: `IT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: formData.name,
      category: formData.category,
      serial: formData.serial,
      status: ItemStatus.AVAILABLE,
      location: 'IT Store',
      assignedTo: '-',
      department: '-',
      purchaseDate: new Date().toISOString().split('T')[0],
      warranty: new Date(new Date().setMonth(new Date().getMonth() + parseInt(formData.warrantyMonths))).toISOString().split('T')[0],
    };

    onSubmit(newItem);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Item Name</label>
          <input 
            type="text" 
            placeholder="e.g. MacBook Pro 14 M3" 
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
            placeholder="SN-2024-XXXX" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            required
            value={formData.serial}
            onChange={e => setFormData({...formData, serial: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Supplier</label>
          <input 
            type="text" 
            placeholder="e.g. Dell Inc." 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={formData.supplier}
            onChange={e => setFormData({...formData, supplier: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Unit Price ($)</label>
          <input 
            type="number" 
            placeholder="0.00" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={formData.price}
            onChange={e => setFormData({...formData, price: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Warranty (Months)</label>
          <input 
            type="number" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={formData.warrantyMonths}
            onChange={e => setFormData({...formData, warrantyMonths: e.target.value})}
          />
        </div>
      </div>

      <div className="pt-6 border-t border-slate-50">
        <button 
          type="submit" 
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
        >
          <i className="fas fa-save"></i>
          <span>Save to Inventory</span>
        </button>
      </div>
    </form>
  );
};

export default PurchaseForm;
