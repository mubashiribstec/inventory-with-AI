
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types.ts';

interface ManagementFormProps {
  type: 'Category' | 'Employee' | 'Department';
  onSubmit: (data: any) => void;
  initialData?: any;
}

const ManagementForm: React.FC<ManagementFormProps> = ({ type, onSubmit, initialData }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    email: '',
    department: 'General',
    role: '',
    joining_date: new Date().toISOString().split('T')[0],
    is_active: true,
    create_user: false,
    username: '',
    password: '',
    manager: '', 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = formData.id || `${type.substring(0, 3).toUpperCase()}-${Math.floor(Date.now() % 10000)}`;
    
    // Clean specific fields based on type
    const submissionData = { ...formData, id };
    
    if (type === 'Department') {
       delete (submissionData as any).email;
       delete (submissionData as any).role;
       delete (submissionData as any).joining_date;
       delete (submissionData as any).is_active;
    }

    onSubmit(submissionData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type: inputType } = e.target;
    const val = inputType === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: val });
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
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <input name="name" type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.name || ''} onChange={handleChange} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Official Email</label>
                <input name="email" type="email" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.email || ''} onChange={handleChange} placeholder="john@company.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Department</label>
                <input name="department" type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.department || ''} onChange={handleChange} placeholder="e.g. IT, Finance" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Designation / Role</label>
                <input name="role" type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-indigo-600" value={formData.role || ''} onChange={handleChange} placeholder="e.g. Senior Software Engineer" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Joining Date</label>
                <input name="joining_date" type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.joining_date || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Staff Status</label>
                <div className="flex items-center gap-3 h-[50px] px-4 bg-slate-50 border border-slate-100 rounded-xl">
                   <input 
                      id="is_active_emp"
                      name="is_active" 
                      type="checkbox" 
                      className="w-5 h-5 accent-emerald-500 rounded" 
                      checked={formData.is_active !== false} 
                      onChange={handleChange} 
                   />
                   <label htmlFor="is_active_emp" className="text-xs font-bold text-slate-700 cursor-pointer">Account Enabled</label>
                </div>
              </div>
            </div>
          </div>
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
