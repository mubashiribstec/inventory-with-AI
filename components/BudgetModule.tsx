
import React, { useState, useEffect } from 'react';
import { PersonalBudget } from '../types.ts';
import { apiService } from '../api.ts';
import GenericListView from './GenericListView.tsx';
import Modal from './Modal.tsx';

const BudgetModule: React.FC = () => {
  const [budgets, setBudgets] = useState<PersonalBudget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PersonalBudget>>({
    person_name: '',
    total_limit: 0,
    spent_amount: 0,
    category: 'General',
    notes: ''
  });

  const fetchBudgets = async () => {
    try {
      const data = await apiService.getBudgets();
      setBudgets(data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchBudgets(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `BGT-${Date.now()}`;
    await apiService.saveBudget({ ...formData, id } as PersonalBudget);
    setIsModalOpen(false);
    fetchBudgets();
  };

  const enrichedBudgets = budgets.map(b => {
    const remaining = (b.total_limit || 0) - (b.spent_amount || 0);
    const utilization = (b.total_limit || 0) > 0 ? ((b.spent_amount || 0) / b.total_limit) * 100 : 0;
    return { ...b, remaining, utilization, budget_status: utilization > 100 ? 'OVER BUDGET' : 'ON TRACK' };
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-3xl border border-indigo-100">
            <i className="fas fa-wallet"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 poppins">Personal & Entity Budgets</h3>
            <p className="text-slate-500 font-medium">Independent financial tracking for authorized personnel</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition"
        >
          Assign New Budget
        </button>
      </div>

      <GenericListView 
        title="Active Budget Registry" 
        icon="fa-file-invoice" 
        items={enrichedBudgets} 
        columns={['person_name', 'total_limit', 'spent_amount', 'remaining', 'utilization', 'budget_status']} 
      />

      {isModalOpen && (
        <Modal title="Allocate Budget" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Budget Owner (Person Name)</label>
              <input 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={formData.person_name}
                onChange={e => setFormData({...formData, person_name: e.target.value})}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Allocated Limit (Rs.)</label>
                <input 
                  type="number" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  value={formData.total_limit}
                  onChange={e => setFormData({...formData, total_limit: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Spent Amount (Rs.)</label>
                <input 
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-rose-600"
                  value={formData.spent_amount}
                  onChange={e => setFormData({...formData, spent_amount: Number(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Budget Category</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option>General Operations</option>
                <option>IT Procurement</option>
                <option>Maintenance Fund</option>
                <option>Travel & Logistics</option>
              </select>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">
              Finalize Allocation
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BudgetModule;
