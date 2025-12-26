
import React, { useState } from 'react';
import { ItemStatus, InventoryItem } from '../types';

interface AssignmentFormProps {
  items: InventoryItem[];
  onSubmit: (updatedItem: InventoryItem) => void;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({ items, onSubmit }) => {
  const availableItems = items.filter(i => i.status === ItemStatus.AVAILABLE || i.status === ItemStatus.BACKUP);
  
  const [selectedItemId, setSelectedItemId] = useState('');
  const [employee, setEmployee] = useState('');
  const [department, setDepartment] = useState('IT');
  const [markInUse, setMarkInUse] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !employee) return;

    const originalItem = items.find(i => i.id === selectedItemId);
    if (!originalItem) return;

    const updatedItem: InventoryItem = {
      ...originalItem,
      status: markInUse ? ItemStatus.IN_USE : ItemStatus.ASSIGNED,
      assignedTo: employee,
      department: department,
      location: department + ' Area'
    };

    onSubmit(updatedItem);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Select Item</label>
          <select 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={selectedItemId}
            onChange={e => setSelectedItemId(e.target.value)}
            required
          >
            <option value="">Select an available asset...</option>
            {availableItems.map(item => (
              <option key={item.id} value={item.id}>{item.name} ({item.serial})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Employee Name</label>
            <input 
              type="text" 
              placeholder="e.g. John Smith" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={employee}
              onChange={e => setEmployee(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Department</label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={department}
              onChange={e => setDepartment(e.target.value)}
            >
              <option>IT</option>
              <option>Marketing</option>
              <option>Finance</option>
              <option>Human Resources</option>
              <option>Sales</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <input 
            type="checkbox" 
            id="markInUse" 
            className="w-5 h-5 accent-indigo-600 cursor-pointer"
            checked={markInUse}
            onChange={e => setMarkInUse(e.target.checked)}
          />
          <label htmlFor="markInUse" className="text-sm font-bold text-indigo-900 cursor-pointer">
            Mark as "In Use" immediately
          </label>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-50">
        <button 
          type="submit" 
          disabled={!selectedItemId || !employee}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
        >
          <i className="fas fa-user-plus"></i>
          <span>Complete Assignment</span>
        </button>
      </div>
    </form>
  );
};

export default AssignmentForm;
