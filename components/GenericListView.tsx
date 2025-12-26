import React from 'react';

interface GenericListViewProps {
  title: string;
  icon: string;
  items: any[];
  columns: string[];
}

const GenericListView: React.FC<GenericListViewProps> = ({ title, icon, items, columns }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <i className={`fas ${icon}`}></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 poppins">{title}</h3>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-2">
          <i className="fas fa-plus"></i> New {title.split(' ').slice(-1)[0].slice(0, -1)}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              {columns.map(col => (
                <th key={col} className="px-6 py-5">{col.replace(/([A-Z])/g, ' $1')}</th>
              ))}
              <th className="px-6 py-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition">
                {columns.map(col => (
                  <td key={col} className="px-6 py-4">
                    {col === 'budget' || col === 'cost' ? (
                      <span className="font-bold text-slate-700 text-sm">${item[col]?.toLocaleString()}</span>
                    ) : col === 'icon' ? (
                      <i className={`fas ${item[col]} text-slate-400`}></i>
                    ) : (
                      <span className="text-sm font-medium text-slate-600">{item[col]}</span>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center justify-center">
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition flex items-center justify-center">
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
                <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <i className="fas fa-folder-open text-4xl text-slate-200"></i>
                            <p className="text-slate-400 font-medium">No records found in this module.</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GenericListView;