
import React, { useState } from 'react';
import { InventoryItem, ItemStatus, LocationRecord } from '../types';

// Updated interface to include locations and compatible onUpdate signature
interface InventoryTableProps {
  items: InventoryItem[];
  onUpdate: () => void | Promise<void>;
  locations: LocationRecord[];
}

const InventoryTable: React.FC<InventoryTableProps> = ({ items, onUpdate, locations }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ItemStatus | ''>('');

  const filteredItems = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                          i.serial.toLowerCase().includes(search.toLowerCase()) ||
                          i.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === '' || i.status === filter;
    return matchesSearch && matchesFilter;
  });

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
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search by ID, name, or serial number..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
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
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
            ))}
          </select>
          <button className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-100">
            <i className="fas fa-filter"></i>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-5">Item Details</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">Assignment</th>
                <th className="px-6 py-5">History</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                        <i className={`fas ${
                          item.category === 'Computers' ? 'fa-laptop' : 
                          item.category === 'Networking' ? 'fa-network-wired' : 'fa-box'
                        }`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] font-semibold text-slate-400 tracking-tight">{item.id} • SN: {item.serial}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(item.status)}`}>
                      {item.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {/* Accessing item.location which is now defined in InventoryItem */}
                    <p className="text-xs font-bold text-slate-700">{item.location}</p>
                    <p className="text-[10px] text-slate-400">Main Office</p>
                  </td>
                  <td className="px-6 py-4">
                    {item.assignedTo !== '-' ? (
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.assignedTo}</p>
                        <p className="text-[10px] text-slate-400">{item.department}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-bold text-slate-500">Purchased: {item.purchaseDate}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Warranty: {item.warranty}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition flex items-center justify-center">
                        <i className="fas fa-eye text-xs"></i>
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition flex items-center justify-center">
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition flex items-center justify-center">
                        <i className="fas fa-exchange-alt text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-search text-slate-200 text-3xl"></i>
                      </div>
                      <p className="text-slate-400 font-medium">No items found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;
