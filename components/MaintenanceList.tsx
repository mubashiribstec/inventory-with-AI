
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Open Tickets</h4>
          <p className="text-3xl font-bold text-slate-800">{logs.filter(l => l.status === 'OPEN').length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Repairable Assets</h4>
          <p className="text-3xl font-bold text-indigo-600">{logs.filter(l => l.is_repairable).length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Non-Repairable</h4>
          <p className="text-3xl font-bold text-rose-600">{logs.filter(l => !l.is_repairable && l.status === 'SCRAPPED').length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Maintenance Cost</h4>
          <p className="text-2xl font-bold text-slate-800">Rs. {logs.reduce((acc, l) => acc + Number(l.cost), 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 poppins">Faulty Item Hub</h3>
            <p className="text-xs text-slate-400 font-medium">Tracking and categorization of damaged assets</p>
          </div>
          <button 
            onClick={onAdd}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
          >
            <i className="fas fa-plus mr-2"></i>Log New Fault
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Asset ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-xs font-bold text-slate-800">{log.item_id}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">{log.issue_type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${log.is_repairable ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {log.is_repairable ? 'Repairable' : 'Non-Repairable'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                      log.status === 'FIXED' ? 'bg-emerald-50 text-emerald-600' : 
                      log.status === 'OPEN' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">Rs. {Number(log.cost).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-indigo-600 hover:underline text-[10px] font-bold">Manage Ticket</button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center opacity-30 italic text-sm">No faulty items currently being tracked.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceList;
