
import React, { useState } from 'react';
import { Supplier } from '../types';

interface LicenseFormProps {
  suppliers: Supplier[];
  onSubmit: (license: any) => void;
  initialData?: any;
}

const LicenseForm: React.FC<LicenseFormProps> = ({ suppliers, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    software_name: initialData?.software_name || '',
    product_key: initialData?.product_key || '',
    total_seats: initialData?.total_seats || 1,
    assigned_seats: initialData?.assigned_seats || 0,
    expiration_date: initialData?.expiration_date || '',
    supplier_id: initialData?.supplier_id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: initialData?.id || Math.floor(Math.random() * 1000000)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Software Package</label>
        <input 
          type="text" 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          value={formData.software_name}
          onChange={(e) => setFormData({...formData, software_name: e.target.value})}
          placeholder="e.g. Adobe Creative Cloud"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">License/Product Key</label>
        <input 
          type="text" 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          value={formData.product_key}
          onChange={(e) => setFormData({...formData, product_key: e.target.value})}
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Total Seats</label>
          <input 
            type="number" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.total_seats}
            onChange={(e) => setFormData({...formData, total_seats: Number(e.target.value)})}
            min="1"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Seats Assigned</label>
          <input 
            type="number" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.assigned_seats}
            onChange={(e) => setFormData({...formData, assigned_seats: Number(e.target.value)})}
            min="0"
            max={formData.total_seats}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Expiration Date</label>
          <input 
            type="date" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.expiration_date}
            onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Vendor/Supplier</label>
          <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.supplier_id}
            onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
          >
            <option value="">Direct/Internal</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-50">
        <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
          <i className="fas fa-key"></i>
          <span>Save License</span>
        </button>
      </div>
    </form>
  );
};

export default LicenseForm;
