
import React from 'react';
import { Employee, InventoryItem, ItemStatus, User } from '../types.ts';

interface EmployeeDetailsProps {
  employee: Employee;
  items: InventoryItem[];
  linkedUser?: User;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ employee, items, linkedUser }) => {
  const assignedItems = items.filter(item => item.assignedTo === employee.name);

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.IN_USE: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case ItemStatus.ASSIGNED: return 'bg-blue-50 text-blue-600 border-blue-100';
      case ItemStatus.FAULTY: return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Employee Header */}
      <div className="flex items-start gap-6">
        <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl shadow-lg shadow-indigo-100">
          <i className="fas fa-user"></i>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 poppins mb-1">{employee.name}</h2>
          <p className="text-slate-500 font-medium text-sm flex flex-col gap-1">
            <span className="flex items-center gap-2">
              <i className="fas fa-envelope text-slate-300 w-4"></i> {employee.email}
            </span>
            <span className="flex items-center gap-2">
              <i className="fas fa-id-badge text-slate-300 w-4"></i> {employee.id}
            </span>
          </p>
          <div className="mt-3 flex gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
              {employee.department}
            </span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
              {employee.role}
            </span>
          </div>
        </div>
      </div>

      {/* System info if linked */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shift Schedule</p>
              <p className="text-lg font-bold text-slate-800">{linkedUser?.shift_start_time || 'Not Configured'}</p>
           </div>
           <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-clock"></i>
           </div>
        </div>
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Access</p>
              <p className="text-lg font-bold text-slate-800 uppercase">{linkedUser?.role || 'No Account'}</p>
           </div>
           <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-user-shield"></i>
           </div>
        </div>
      </div>

      {/* Assigned Assets Section */}
      <div className="border-t border-slate-100 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-laptop"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800 poppins">Assigned Assets</h3>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-widest">
            {assignedItems.length} Items Total
          </span>
        </div>

        {assignedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedItems.map(item => (
              <div key={item.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                    <i className={`fas ${item.category === 'Computers' ? 'fa-laptop' : 'fa-box'}`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] font-semibold text-slate-400">{item.id} • {item.serial}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusBadge(item.status)}`}>
                        {item.status.replace('-', ' ')}
                      </span>
                      <p className="text-[10px] text-slate-400">Since: {item.purchaseDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <i className="fas fa-box-open text-3xl text-slate-300 mb-3"></i>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hardware assets currently assigned.</p>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2">
          <i className="fas fa-envelope"></i> Send Handover Log
        </button>
        <button className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
          <i className="fas fa-plus"></i> Assign New Asset
        </button>
      </div>
    </div>
  );
};

export default EmployeeDetails;
