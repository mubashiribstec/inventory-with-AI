
import React from 'react';
import { DashboardStats, Movement, InventoryItem } from '../types.ts';

interface DashboardProps {
  stats: DashboardStats;
  movements: Movement[];
  items: InventoryItem[];
  onFullAudit: () => void;
  onCheckIn: () => void;
  themeColor?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, movements, items, onFullAudit, onCheckIn, themeColor = 'indigo' }) => {
  const statCards = [
    { label: 'Total Stock', value: stats.purchased, icon: 'fa-shopping-cart', color: themeColor },
    { label: 'Assigned', value: stats.assigned, icon: 'fa-user-check', color: 'blue' },
    { label: 'Backup', value: stats.backup, icon: 'fa-box', color: 'amber' },
    { label: 'Faulty', value: stats.faulty, icon: 'fa-tools', color: 'rose' },
  ];

  // Logic to get unique departments and their asset counts
  const departmentStats = items.reduce((acc: any, item) => {
    const dept = item.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const sortedDepts = Object.entries(departmentStats)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dynamic Header Card */}
      <div className={`bg-gradient-to-r from-${themeColor}-600 to-${themeColor}-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-${themeColor}-100 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold poppins mb-2">Systems Operational</h2>
          <p className="text-${themeColor}-100 font-medium opacity-80 max-w-md">Your enterprise inventory is currently synchronized with the cloud backend. All data points are up to date.</p>
        </div>
        <button 
          onClick={onCheckIn}
          className="relative z-10 px-8 py-4 bg-white text-${themeColor}-600 rounded-2xl font-bold text-sm hover:shadow-xl transition transform active:scale-95 whitespace-nowrap"
        >
          <i className="fas fa-user-clock mr-2"></i> Attendance Log
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition group">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl bg-${card.color}-50 text-${card.color}-600 border border-${card.color}-100 group-hover:scale-110 transition`}>
                <i className={`fas ${card.icon}`}></i>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                <h3 className="text-2xl font-bold text-slate-800 poppins">{card.value.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity & Department View */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <h3 className="text-lg font-bold text-slate-800 poppins">Transaction Ledger</h3>
                    <button onClick={onFullAudit} className={`text-${themeColor}-600 text-xs font-bold hover:underline`}>View Full Audit</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                          <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                              <th className="px-8 py-5">Asset</th>
                              <th className="px-8 py-5">Movement</th>
                              <th className="px-8 py-5">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {movements.slice(0, 5).map(m => (
                            <tr key={m.id} className="hover:bg-slate-50/50 transition">
                                <td className="px-8 py-4">
                                    <p className="text-xs font-bold text-slate-800">{m.item}</p>
                                    <p className="text-[10px] text-slate-400">{m.date}</p>
                                </td>
                                <td className="px-8 py-4">
                                    <span className="text-[11px] font-medium text-slate-600 flex items-center gap-2">
                                      {m.from} <i className={`fas fa-long-arrow-right text-${themeColor}-400`}></i> {m.to}
                                    </span>
                                </td>
                                <td className="px-8 py-4">
                                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                                      m.status.includes('ASSIGN') ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                      {m.status}
                                  </span>
                                </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Department Prominence Sidebar */}
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-slate-800 poppins">Department Assets</h4>
                  <i className="fas fa-sitemap text-slate-300"></i>
                </div>
                <div className="space-y-4">
                  {sortedDepts.map(([name, count]: any) => (
                    <div key={name} className="group">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition">{name}</span>
                        <span className="text-[10px] font-black text-slate-400">{count} Items</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${themeColor}-500 transition-all duration-1000`} 
                          style={{ width: `${(count / items.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {sortedDepts.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No department data available.</p>
                  )}
                </div>
                <button className={`w-full mt-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold uppercase hover:bg-slate-100 transition border border-slate-100`}>
                  Manage Departments
                </button>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100">
                  <i className="fas fa-clock"></i>
               </div>
               <div>
                  <h5 className="text-xs font-bold text-slate-800">Warranty Alerts</h5>
                  <p className="text-[10px] text-slate-400 font-medium">3 items expiring this week</p>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
