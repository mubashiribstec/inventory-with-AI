
import React, { useState } from 'react';

interface ManagementFormProps {
  type: 'Category' | 'Employee' | 'Department';
  onSubmit: (data: any) => void;
  initialData?: any;
}

const ManagementForm: React.FC<ManagementFormProps> = ({ type, onSubmit, initialData }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    manager: '',
    joining_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = formData.id || `${type.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    onSubmit({ ...formData, id });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {type === 'Category' && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category Name</label>
              <input name="name" type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name || ''} onChange={handleChange} placeholder="e.g. Laptops" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Icon Class (FontAwesome)</label>
              <input name="icon" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.icon || 'fa-tag'} onChange={handleChange} placeholder="fa-laptop" />
            </div>
          </>
        )}

        {type === 'Employee' && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
              <input name="name" type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name || ''} onChange={handleChange} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <input name="email" type="email" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.email || ''} onChange={handleChange} placeholder="john@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Department</label>
                <input name="department" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.department || ''} onChange={handleChange} placeholder="IT" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Role</label>
                <input name="role" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.role || ''} onChange={handleChange} placeholder="Engineer" />
              </div>
            </div>
          </>
        )}

        {type === 'Department' && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Business Unit / Department Name</label>
              <input name="name" type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.name || ''} onChange={handleChange} placeholder="e.g. Operations & Logistics" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Unit Manager</label>
              <input name="manager" type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.manager || ''} onChange={handleChange} placeholder="Enter full name of manager" />
            </div>
          </>
        )}
      </div>

      <div className="pt-6 border-t border-slate-50">
        <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
          <i className="fas fa-save"></i>
          <span>Save {type} Information</span>
        </button>
      </div>
    </form>
  );
};

export default ManagementForm;
