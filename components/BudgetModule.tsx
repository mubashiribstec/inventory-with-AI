
import React, { useState, useEffect } from 'react';
import { PersonalBudget } from '../types.ts';
import { apiService } from '../api.ts';
import GenericListView from './GenericListView.tsx';
import Modal from './Modal.tsx';

const BudgetModule: React.FC = () => {
  const [budgets, setBudgets] = useState<PersonalBudget[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PersonalBudget>>({
    person_name: '',
    total_limit: 0,
    spent_amount: 0,
    category: 'Operational',
    notes: ''
  });

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await apiService.getBudgets();
      setBudgets(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBudgets(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `BGT-${Date.now()}`;
    await apiService.saveBudget({ ...formData, id } as PersonalBudget);
    setIsModalOpen(false);
    setFormData({ person_name: '', total_limit: 0, spent_amount: 0, category: 'Operational', notes: '' });
    fetchBudgets();
  };

  const enrichedBudgets = budgets.map(b => {
    const remaining = (b.total_limit || 0) - (b.spent_amount || 0);
    const utilization = (b.total_limit || 0) > 0 ? ((b.spent_amount || 0) / b.total_limit) * 100 : 0;
    return { 
      ...b, 
      remaining, 
      utilization, 
      budget_status: utilization > 100 ? 'OVER BUDGET' : (utilization > 80 ? 'NEAR LIMIT' : 'ON TRACK') 
    };
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 text-3xl border border-emerald-100">
            <i className="fas fa-wallet"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 poppins">Financial Resource Allocation</h3>
            <p className="text-slate-500 font-medium">Independent spending limits for designated entities/persons</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition flex items-center gap-2"
        >
          <i className="fas fa-plus-circle"></i>
          New Allocation
        </button>
      </div>

      <GenericListView 
        title="Budget Registry" 
        icon="fa-file-invoice-dollar" 
        items={enrichedBudgets} 
        columns={['person_name', 'category', 'total_limit', 'spent_amount', 'remaining', 'utilization', 'budget_status']} 
      />

      {isModalOpen && (
        <Modal title="Allocate Spending Limit" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Budget Owner / Entity Name</label>
              <input 
                required 
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg"
                value={formData.person_name}
                onChange={e => setFormData({...formData, person_name: e.target.value})}
                placeholder="Enter person or group name..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Initial Limit (PKR)</label>
                <input 
                  type="number" required
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-black text-xl"
                  value={formData.total_limit}
                  onChange={e => setFormData({...formData, total_limit: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Current Spending (PKR)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-black text-xl text-rose-600"
                  value={formData.spent_amount}
                  onChange={e => setFormData({...formData, spent_amount: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Classification</label>
              <select 
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option>Operational Expense</option>
                <option>Capital Expenditure</option>
                <option>Marketing Budget</option>
                <option>Petty Cash Fund</option>
                <option>Tech Procurement</option>
              </select>
            </div>

            <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition flex items-center justify-center gap-2 text-lg">
              <i className="fas fa-check-circle"></i>
              Confirm Financial Allocation
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BudgetModule;
