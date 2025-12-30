
import React from 'react';
import { Department, InventoryItem } from '../types.ts';

interface BudgetBreakdownProps {
  department: Department;
  items: InventoryItem[];
}

const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({ department, items }) => {
  const deptItems = items.filter(i => i.department === department.name);
  const totalCost = deptItems.reduce((acc, i) => acc + (Number(i.cost) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 poppins">{department.name}</h2>
          <p className="text-slate-500 text-sm font-medium">Departmental Asset Inventory</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Asset Value</p>
          <p className="text-2xl font-bold text-indigo-600">${totalCost.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
              <i className="fas fa-user-tie"></i>
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department Head</p>
              <p className="font-bold text-slate-800">{department.head || 'Not Assigned'}</p>
           </div>
        </div>
        <div className="px-4 py-2 bg-indigo-600 rounded-2xl text-center min-w-[100px] text-white">
          <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Asset Count</p>
          <p className="text-lg font-bold">{deptItems.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Allocated Hardware</h4>
        <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
          {deptItems.length > 0 ? (
            deptItems.map(item => (
              <div key={item.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                    <i className={`fas ${item.category === 'Computers' ? 'fa-laptop' : 'fa-box'}`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] font-semibold text-slate-400">{item.id} • {item.purchaseDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">${(Number(item.cost) || 0).toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.status.replace('-', ' ')}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 italic text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No assets recorded for this department yet.
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex gap-4">
        <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition">
          <i className="fas fa-file-export mr-2"></i> Export List
        </button>
      </div>
    </div>
  );
};

export default BudgetBreakdown;
