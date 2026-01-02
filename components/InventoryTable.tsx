import React, { useState } from 'react';
import { InventoryItem, ItemStatus, Employee } from '../types';
import { apiService } from '../api.ts';

interface InventoryTableProps {
  items: InventoryItem[];
  onUpdate: () => void;
  onEdit: (item: InventoryItem) => void;
  onView: (item: InventoryItem) => void;
  onAddAsset?: () => void;
  onViewEmployee?: (emp: Employee) => void;
  themeColor?: string;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ items, onUpdate, onEdit, onView, onAddAsset, onViewEmployee, themeColor = 'indigo' }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ItemStatus | ''>('');

  const filteredItems = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                          i.serial.toLowerCase().includes(search.toLowerCase()) ||
                          i.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === '' || i.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to permanently delete item ${id}?`)) {
      try {
        await apiService.deleteItem(id);
        onUpdate();
      } catch (err) {
        alert("Error deleting item: " + err);
      }
    }
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.IN_USE: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case ItemStatus.ASSIGNED: return 'bg-blue-50 text-blue-600 border-blue-100';
      case ItemStatus.AVAILABLE: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case ItemStatus.BACKUP: return 'bg-amber-50 text-amber-600 border-amber-100';
      case ItemStatus.FAULTY: return 'bg-rose-50 text-rose-600 border-rose-100';
      case ItemStatus.PURCHASED: return 'bg-slate-50 text-slate-600 border-slate-100';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search assets..." 
            className={`w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 transition text-sm`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="">All Statuses</option>
            {Object.values(ItemStatus).map(s => (
              <option key={s} value={s}>{s.replace('-', ' ')}</option>
            ))}
          </select>
          {onAddAsset && (
            <button 
              onClick={onAddAsset} 
              className={`px-4 py-3 bg-${themeColor}-600 text-white rounded-xl hover:bg-${themeColor}-700 transition font-bold text-sm shadow-lg shadow-${themeColor}-100 flex items-center gap-2 whitespace-nowrap`}
            >
              <i className="fas fa-plus"></i> New Asset
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-5">Asset</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">User</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                        <i className={`fas ${item.category === 'Computers' ? 'fa-laptop' : 'fa-box'}`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{item.id} • {item.serial}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(item.status)}`}>
                      {item.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">{item.location || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => {
                        if (onViewEmployee && item.assignedTo !== '-') {
                          onViewEmployee({ name: item.assignedTo, department: item.department } as any);
                        }
                      }}
                      className={`text-xs font-bold text-left ${item.assignedTo !== '-' ? `text-${themeColor}-600 hover:underline` : 'text-slate-800'}`}
                    >
                      {item.assignedTo || '-'}
                    </button>
                    <p className="text-[10px] text-slate-400">{item.department || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onView(item)}
                        className={`w-8 h-8 rounded-lg bg-${themeColor}-50 text-${themeColor}-600 hover:bg-${themeColor}-100 transition flex items-center justify-center`}
                        title="View Details"
                      >
                        <i className="fas fa-eye text-xs"></i>
                      </button>
                      <button 
                        onClick={() => onEdit(item)}
                        className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition flex items-center justify-center"
                        title="Edit Asset"
                      >
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition flex items-center justify-center"
                        title="Delete Asset"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;
