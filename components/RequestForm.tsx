
import React, { useState } from 'react';
import { Employee, Department, Category } from '../types';

interface RequestFormProps {
  employees: Employee[];
  departments: Department[];
  categories: Category[];
  onSubmit: (request: any) => void;
  initialData?: any;
}

const RequestForm: React.FC<RequestFormProps> = ({ employees, departments, categories, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    item: initialData?.item || '',
    employee: initialData?.employee || '',
    department: initialData?.department || '',
    urgency: initialData?.urgency || 'Medium',
    status: initialData?.status || 'Pending',
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: initialData?.id || `REQ-${Date.now()}`,
      request_date: initialData?.request_date || new Date().toISOString().split('T')[0]
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Asset Needed</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.item}
            onChange={(e) => setFormData({...formData, item: e.target.value})}
            placeholder="e.g. Dual Monitor Setup"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Requesting Employee</label>
          <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.employee}
            onChange={(e) => {
              const emp = employees.find(ev => ev.name === e.target.value);
              setFormData({...formData, employee: e.target.value, department: emp?.department || formData.department});
            }}
            required
          >
            <option value="">Select Employee...</option>
            {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Department</label>
          <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            required
          >
            <option value="">Select Department...</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Urgency Level</label>
          <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.urgency}
            onChange={(e) => setFormData({...formData, urgency: e.target.value as any})}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Request Notes</label>
        <textarea 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Reason for request, preferred specs, etc..."
        />
      </div>

      <div className="pt-6 border-t border-slate-50">
        <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
          <i className="fas fa-paper-plane"></i>
          <span>Submit Request</span>
        </button>
      </div>
    </form>
  );
};

export default RequestForm;
