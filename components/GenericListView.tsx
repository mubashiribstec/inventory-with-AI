import React from 'react';

interface GenericListViewProps {
  title: string;
  icon: string;
  items: any[];
  columns: string[];
  onAdd?: () => void;
  onView?: (item: any) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
}

const GenericListView: React.FC<GenericListViewProps> = ({ title, icon, items, columns, onAdd, onView, onEdit, onDelete }) => {
  const formatValue = (item: any, col: string, val: any) => {
    // Special handling for audit logs details
    if (col === 'details' && typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            return <span className="text-[10px] text-slate-400 truncate max-w-[200px] block">{JSON.stringify(parsed)}</span>;
        } catch (e) { return val; }
    }

    if (col === 'spent') {
      return (
        <button 
          onClick={() => onView && onView(item)}
          className={`font-bold text-left transition ${onView ? 'text-indigo-600 hover:text-indigo-800 hover:underline' : 'text-slate-800'}`}
        >
          Rs. {(Number(val) || 0).toLocaleString()}
        </button>
      );
    }

    if (col === 'budget' || col === 'cost' || col === 'remaining') {
      return <span className={`font-bold ${col === 'remaining' && val < 0 ? 'text-rose-600' : 'text-slate-800'}`}>Rs. {(Number(val) || 0).toLocaleString()}</span>;
    }
    
    if (col === 'utilization') {
      const percent = Math.min(Math.max(Number(val) || 0, 0), 100);
      const color = percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-500' : 'bg-indigo-600';
      return (
        <div className="w-full min-w-[120px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-slate-500">{percent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }}></div>
          </div>
        </div>
      );
    }

    if (col === 'status' || col === 'budget_status' || col === 'action') {
      const statusVal = String(val).toUpperCase();
      const colors: any = {
        'OPEN': 'bg-rose-50 text-rose-600 border-rose-100',
        'PENDING': 'bg-amber-50 text-amber-600 border-amber-100',
        'FIXED': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'PURCHASED': 'bg-indigo-50 text-indigo-600 border-indigo-100',
        'ASSIGNED': 'bg-blue-50 text-blue-600 border-blue-100',
        'OVER BUDGET': 'bg-rose-50 text-rose-600 border-rose-100',
        'ON TRACK': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'NEAR LIMIT': 'bg-amber-50 text-amber-600 border-amber-100',
        'DELETE': 'bg-rose-50 text-rose-600 border-rose-100',
        'CREATE': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'UPDATE': 'bg-indigo-50 text-indigo-600 border-indigo-100',
        'LOGIN': 'bg-slate-100 text-slate-600'
      };
      return <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${colors[statusVal] || 'bg-slate-50 text-slate-500'}`}>{statusVal}</span>;
    }

    if (col === 'timestamp') {
        return <span className="text-[10px] text-slate-400">{new Date(val).toLocaleString()}</span>;
    }

    return val;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <i className={`fas ${icon}`}></i>
            </div>
            <h3 className="font-bold text-slate-800 poppins text-lg">{title}</h3>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition">
                <i className="fas fa-filter mr-2"></i> Filter
            </button>
            {onAdd && (
              <button 
                onClick={onAdd}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
              >
                  <i className="fas fa-plus mr-2"></i> Add Record
              </button>
            )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              {columns.map(col => (
                <th key={col} className="px-6 py-4">{col.replace('_', ' ').charAt(0).toUpperCase() + col.replace('_', ' ').slice(1)}</th>
              ))}
              {(onView || onEdit || onDelete) && <th className="px-6 py-4 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition">
                {columns.map(col => (
                  <td key={col} className="px-6 py-4 text-xs font-medium text-slate-700">
                    {formatValue(item, col, item[col])}
                  </td>
                ))}
                {(onView || onEdit || onDelete) && (
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                        {onView && (
                          <button onClick={() => onView(item)} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center transition" title="Details">
                            <i className="fas fa-search-plus text-[10px]"></i>
                          </button>
                        )}
                        {onEdit && (
                          <button onClick={() => onEdit(item)} className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition" title="Edit">
                            <i className="fas fa-edit text-[10px]"></i>
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => onDelete(item)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition" title="Delete">
                            <i className="fas fa-trash-alt text-[10px]"></i>
                          </button>
                        )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
                <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-30">
                            <i className="fas fa-folder-open text-4xl"></i>
                            <p className="text-sm font-bold uppercase tracking-widest">No matching records</p>
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