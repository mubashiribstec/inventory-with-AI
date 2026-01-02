import React from 'react';
import { MaintenanceLog, InventoryItem } from '../types';

interface MaintenanceProps {
  logs: MaintenanceLog[];
  items: InventoryItem[];
  onUpdate: () => void;
  onAdd: () => void;
}

const MaintenanceList: React.FC<MaintenanceProps> = ({ logs, items, onUpdate, onAdd }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Open Tickets</h4>
          <p className="text-3xl font-bold text-slate-800">{logs.filter(l => l.status === 'OPEN').length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Maintenance Cost</h4>
          <p className="text-3xl font-bold text-slate-800">Rs. {logs.reduce((acc, l) => acc + Number(l.cost), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fixed Assets</h4>
          <p className="text-3xl font-bold text-slate-800">{logs.filter(l => l.status === 'FIXED').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 poppins">Active Maintenance Tickets</h3>
          <button 
            onClick={onAdd}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
          >
            <i className="fas fa-plus mr-2"></i>Report Issue / New Ticket
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Asset ID</th>
                <th className="px-6 py-4">Issue Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-xs font-bold text-slate-800">{log.item_id}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">{log.issue_type}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{log.description}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">Rs. {Number(log.cost).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                      log.status === 'FIXED' ? 'bg-emerald-50 text-emerald-600' : 
                      log.status === 'OPEN' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-indigo-600 hover:underline text-[10px] font-bold">Details</button>
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

export default MaintenanceList;