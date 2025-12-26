
import React from 'react';
import { Supplier } from '../types';

interface SupplierProps {
  suppliers: Supplier[];
}

const SupplierList: React.FC<SupplierProps> = ({ suppliers }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
      {suppliers.map(s => (
        <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 text-xl group-hover:bg-indigo-600 group-hover:text-white transition">
              <i className="fas fa-truck"></i>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 poppins">{s.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {s.id.toString().padStart(3, '0')}</p>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Contact:</span>
              <span className="text-slate-700 font-bold">{s.contact_person}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Email:</span>
              <span className="text-indigo-600 font-bold hover:underline cursor-pointer">{s.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Vendor Rating:</span>
              <div className="flex gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`fas fa-star ${i >= s.rating ? 'opacity-20' : ''}`}></i>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-100 transition border border-slate-200">View Contract</button>
            <button className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold hover:bg-indigo-100 transition border border-indigo-100 uppercase tracking-tighter">Orders History</button>
          </div>
        </div>
      ))}
      
      <button className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 group hover:bg-white hover:border-indigo-200 transition">
        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition">
          <i className="fas fa-plus"></i>
        </div>
        <p className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition">Onboard New Supplier</p>
      </button>
    </div>
  );
};

export default SupplierList;
