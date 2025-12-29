
import React from 'react';
import { License, Supplier } from '../types';

interface LicenseListProps {
  licenses: License[];
  suppliers: Supplier[];
  onAdd: () => void;
}

const LicenseList: React.FC<LicenseListProps> = ({ licenses, suppliers, onAdd }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Licenses</h4>
          <p className="text-3xl font-bold text-slate-800">{licenses.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Seats Assigned</h4>
          <p className="text-3xl font-bold text-slate-800">
            {licenses.reduce((acc, l) => acc + l.assigned_seats, 0)} / {licenses.reduce((acc, l) => acc + l.total_seats, 0)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 poppins">Software Assets & Seats</h3>
          <button 
            onClick={onAdd}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
          >
            <i className="fas fa-plus mr-2"></i>Add License
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Software</th>
                <th className="px-6 py-4">Expiration</th>
                <th className="px-6 py-4">Utilization</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {licenses.map(license => (
                <tr key={license.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-800">{license.software_name}</p>
                    <p className="text-[9px] text-slate-400 font-mono">{license.product_key.replace(/./g, '*')}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">{license.expiration_date}</td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                      <div 
                        className={`h-full rounded-full ${license.assigned_seats / license.total_seats > 0.9 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${(license.assigned_seats / license.total_seats) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">{license.assigned_seats} / {license.total_seats} Seats</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">
                    {suppliers.find(s => s.id === license.supplier_id)?.name || 'Direct'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition uppercase tracking-tighter">Manage Seats</button>
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

export default LicenseList;
