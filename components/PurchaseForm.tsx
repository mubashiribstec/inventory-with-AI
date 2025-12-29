
import React, { useState } from 'react';
import { ItemStatus, InventoryItem, Supplier, LocationRecord, Department } from '../types';

interface PurchaseFormProps {
  onSubmit: (item: InventoryItem) => void;
  suppliers: Supplier[];
  locations: LocationRecord[];
  departments: Department[];
  initialData?: InventoryItem;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({ onSubmit, suppliers, locations, departments, initialData }) => {
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    category: initialData?.category || 'Computers',
    serial: initialData?.serial || '',
    status: initialData?.status || ItemStatus.AVAILABLE,
    location: initialData?.location || 'IT Store',
    cost: initialData?.cost?.toString() || '',
    assignedTo: initialData?.assignedTo || '-',
    department: initialData?.department || (departments.length > 0 ? departments[0].name : '-'),
    warrantyMonths: '12'
  });

  const formatDate = (dateInput: string | Date): string => {
    if (!dateInput) return new Date().toISOString().split('T')[0];
    const d = new Date(dateInput);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.serial) return;

    // Calculate warranty if not present
    let warrantyDate = initialData?.warranty;
    if (!warrantyDate) {
      const d = new Date();
      d.setMonth(d.getMonth() + parseInt(formData.warrantyMonths));
      warrantyDate = d.toISOString().split('T')[0];
    }

    const finalItem: InventoryItem = {
      id: formData.id || `IT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: formData.name,
      category: formData.category,
      serial: formData.serial,
      status: formData.status as ItemStatus,
      location: formData.location,
      assignedTo: formData.assignedTo,
      department: formData.department,
      purchaseDate: formatDate(initialData?.purchaseDate || new Date()),
      warranty: formatDate(warrantyDate),
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
            placeholder="e.g. Dell Latitude 5440"
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
            placeholder="SN-XXXXX-XXXX"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Charging Department (Budget)</label>
          <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-indigo-600"
            value={formData.department}
            onChange={e => setFormData({...formData, department: e.target.value})}
            required
          >
            {departments.length > 0 ? (
              departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))
            ) : (
              <option value="-">No Departments Found</option>
            )}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Purchase Cost ($)</label>
          <input 
            type="number" 
            step="0.01"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-mono font-bold"
            value={formData.cost}
            onChange={e => setFormData({...formData, cost: e.target.value})}
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Storage Location</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
            placeholder="e.g. IT Store"
          />
        </div>
      </div>

      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
        <i className="fas fa-info-circle text-amber-500 mt-0.5"></i>
        <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
          Completing this purchase will automatically allocate the cost to the selected department's budget. 
          The Budget Tracker will reflect this deduction immediately.
        </p>
      </div>

      <div className="pt-6 border-t border-slate-50">
        <button 
          type="submit" 
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
        >
          <i className="fas fa-cart-plus"></i>
          <span>{initialData ? 'Update Purchase Record' : 'Execute Purchase'}</span>
        </button>
      </div>
    </form>
  );
};

export default PurchaseForm;
