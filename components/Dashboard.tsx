
import React, { useState, useEffect } from 'react';
import { DashboardStats, Movement, InventoryItem } from '../types';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  stats: DashboardStats;
  movements: Movement[];
  items: InventoryItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, movements, items }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const getAiInsight = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inventorySummary = items.map(i => ({
        name: i.name,
        status: i.status,
        warranty: i.warranty,
        dept: i.department
      })).slice(0, 50); // Limit context for token efficiency

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this inventory data: ${JSON.stringify(inventorySummary)}. Provide one high-impact, short, professional actionable insight for the dashboard. Focus on warranty risks, idle stock, or faulty rates.`,
        config: {
            systemInstruction: "You are a senior inventory intelligence analyst. Your tone is professional, concise, and helpful."
        }
      });
      
      setAiInsight(response.text || "No insights found.");
    } catch (err) {
      console.error("Gemini failed", err);
      setAiInsight("Unable to load AI insights. Check connection.");
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    getAiInsight();
  }, []);

  const statCards = [
    { label: 'Purchased Stock', value: stats.purchased, icon: 'fa-shopping-cart', color: 'indigo', trend: '+12%' },
    { label: 'Assigned Items', value: stats.assigned, icon: 'fa-user-check', color: 'blue', trend: '+8%' },
    { label: 'In Active Use', value: stats.inUse, icon: 'fa-laptop', color: 'emerald', trend: '+15%' },
    { label: 'Backup Storage', value: stats.backup, icon: 'fa-box', color: 'amber', trend: '-5%' },
    { label: 'Faulty / Repairs', value: stats.faulty, icon: 'fa-exclamation-triangle', color: 'rose', trend: '-3%' },
    { label: 'Available Now', value: stats.available, icon: 'fa-check-circle', color: 'violet', trend: '+10%' },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'indigo': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'blue': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'emerald': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'amber': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'rose': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'violet': return 'bg-violet-100 text-violet-600 border-violet-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border ${getColorClasses(card.color)}`}>
              <i className={`fas ${card.icon}`}></i>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <h3 className="text-3xl font-bold text-slate-800 poppins mt-1">{card.value.toLocaleString()}</h3>
              <p className={`text-[11px] font-bold mt-1 ${card.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                <i className={`fas fa-arrow-${card.trend.startsWith('+') ? 'up' : 'down'} mr-1`}></i>
                {card.trend} this month
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-800 poppins">Asset Lifecycle Flow</h3>
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-widest">Real-time DB</span>
                </div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 py-4">
                    {[
                        { label: 'Purchase', icon: 'fa-shopping-cart', desc: 'Received', color: 'indigo' },
                        { label: 'Store', icon: 'fa-warehouse', desc: 'Available', color: 'blue' },
                        { label: 'Assign', icon: 'fa-user-check', desc: 'To Staff', color: 'amber' },
                        { label: 'In Use', icon: 'fa-laptop', desc: 'Active', color: 'emerald' },
                        { label: 'Backup', icon: 'fa-box', desc: 'Spare', color: 'violet' },
                        { label: 'Faulty', icon: 'fa-tools', desc: 'Repair', color: 'rose' },
                    ].map((step, idx, arr) => (
                        <React.Fragment key={idx}>
                        <div className="flex flex-col items-center group cursor-default z-10">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl mb-3 shadow-lg group-hover:scale-110 transition duration-300 bg-${step.color}-500 shadow-${step.color}-200`}>
                            <i className={`fas ${step.icon}`}></i>
                            </div>
                            <p className="text-sm font-bold text-slate-700">{step.label}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{step.desc}</p>
                        </div>
                        {idx < arr.length - 1 && (
                            <div className="hidden md:block flex-1 h-[2px] bg-slate-100 relative top-[-15px]">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-r-2 border-t-2 border-slate-300 rotate-45"></div>
                            </div>
                        )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 poppins">Recent Activity Log</h3>
                    <button className="text-indigo-600 text-sm font-semibold hover:underline">Full Audit</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Item</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {movements.slice(0, 5).map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{m.date}</td>
                            <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-800">{m.item}</p>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-xs font-medium text-slate-600">{m.from} <i className="fas fa-arrow-right mx-1 text-indigo-400"></i> {m.to}</span>
                            </td>
                            <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
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

        <div className="flex flex-col gap-6">
            <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 flex flex-col justify-between h-full">
                <div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                    <i className="fas fa-magic text-xl"></i>
                    </div>
                    <h3 className="text-xl font-bold mb-3 poppins">Gemini Intelligence</h3>
                    {isAiLoading ? (
                        <div className="space-y-3">
                            <div className="h-4 bg-white/10 rounded-full w-full animate-pulse"></div>
                            <div className="h-4 bg-white/10 rounded-full w-5/6 animate-pulse"></div>
                            <div className="h-4 bg-white/10 rounded-full w-2/3 animate-pulse"></div>
                        </div>
                    ) : (
                        <p className="text-indigo-100 text-sm leading-relaxed mb-6 font-medium">
                            {aiInsight || "No active insights. Everything looks stable."}
                        </p>
                    )}
                </div>
                <button 
                    onClick={getAiInsight}
                    disabled={isAiLoading}
                    className="w-full py-4 bg-white text-indigo-700 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition shadow-lg flex items-center justify-center gap-2"
                >
                    <i className={`fas fa-sync ${isAiLoading ? 'animate-spin' : ''}`}></i>
                    Refresh Analysis
                </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-amber-400">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <i className="fas fa-clock text-amber-500"></i>
                    Warranty Alerts
                </h4>
                <p className="text-xs text-slate-500 mb-4">You have 3 items expiring within 30 days.</p>
                <button className="text-indigo-600 text-xs font-bold hover:underline">View Expirations</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
