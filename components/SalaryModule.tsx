import React, { useMemo } from 'react';
import { Employee } from '../types.ts';

interface SalaryModuleProps {
  employees: Employee[];
}

const SalaryModule: React.FC<SalaryModuleProps> = ({ employees }) => {
  const calculateSalaryInfo = (emp: Employee) => {
    const baseSalary = 3000; 
    const bonusPerYear = 250; 
    
    if (!emp.joining_date) return { base: baseSalary, bonus: 0, total: baseSalary, tenureYears: 0 };
    
    const start = new Date(emp.joining_date);
    const end = new Date();
    let years = end.getFullYear() - start.getFullYear();
    const m = end.getMonth() - start.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < start.getDate())) {
        years--;
    }
    
    const tenureYears = Math.max(0, years);
    const bonus = tenureYears * bonusPerYear;
    
    return {
      base: baseSalary,
      bonus: bonus,
      total: baseSalary + bonus,
      tenureYears
    };
  };

  const payrollSummary = useMemo(() => {
    const list = employees.map(emp => ({
      ...emp,
      salary: calculateSalaryInfo(emp)
    }));
    
    const totalPayable = list.reduce((acc, curr) => acc + curr.salary.total, 0);
    
    return { list, totalPayable };
  }, [employees]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Payroll</h4>
          <p className="text-3xl font-bold text-slate-800 poppins">${payrollSummary.totalPayable.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Staff</h4>
          <p className="text-3xl font-bold text-slate-800 poppins">{employees.length}</p>
        </div>
        <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-100 text-white">
          <h4 className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Tenure Bonus Cap</h4>
          <p className="text-3xl font-bold poppins">$250 <span className="text-sm font-medium opacity-60">/ year</span></p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <div>
              <h3 className="font-bold text-slate-800 poppins">Payroll Matrix</h3>
              <p className="text-xs text-slate-400 font-medium">Calculated based on joining milestones</p>
           </div>
           <button className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-100 transition">
              <i className="fas fa-file-invoice-dollar mr-2"></i> Process All
           </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Joining Date</th>
                <th className="px-6 py-4">Years Service</th>
                <th className="px-6 py-4 text-right">Base Pay</th>
                <th className="px-6 py-4 text-right">Tenure Bonus</th>
                <th className="px-6 py-4 text-right">Total Payable</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payrollSummary.list.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                     <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                     <p className="text-[10px] text-slate-400">{emp.role}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">{emp.joining_date || 'N/A'}</td>
                  <td className="px-6 py-4">
                     <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase">
                        {emp.salary.tenureYears} Years
                     </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 text-right">${emp.salary.base.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">+${emp.salary.bonus.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-800 text-right">${emp.salary.total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                     <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center mx-auto shadow-sm">
                        <i className="fas fa-ellipsis-h"></i>
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 flex items-start gap-4">
         <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0">
            <i className="fas fa-info-circle"></i>
         </div>
         <p className="text-xs text-amber-800 leading-relaxed">
            <b>Tenure Calculation Policy:</b> Employees receive a seniority bonus of $250 for every completed year of service starting from their official joining date. This bonus is automatically added to the base salary of $3,000. For custom appraisals, please visit the Employee Profile.
         </p>
      </div>
    </div>
  );
};

export default SalaryModule;
