
import React from 'react';
import { UserRole } from '../types.ts';

const RoleManagement: React.FC = () => {
  const roles = [
    {
      id: UserRole.ADMIN,
      label: 'Administrator',
      color: 'rose',
      desc: 'Full system access, database maintenance, user management, and sensitive audit logs.',
      permissions: ['DB Control', 'User Management', 'Financial Access', 'Inventory Control', 'HR Management']
    },
    {
      id: UserRole.MANAGER,
      label: 'Operations Manager',
      color: 'amber',
      desc: 'Strategic oversight of assets, budgets, and staff. Can manage most resources but not system settings.',
      permissions: ['Inventory Management', 'Budget Analysis', 'Staff Directory', 'Audit Logs']
    },
    {
      id: UserRole.HR,
      label: 'HR / Personnel',
      color: 'emerald',
      desc: 'Focused on human capital. Manages attendance, leaves, staff records, and departments.',
      permissions: ['Attendance Control', 'Leave Approval', 'Staff Directory', 'Department Config']
    },
    {
      id: UserRole.TEAM_LEAD,
      label: 'Team Lead',
      color: 'indigo',
      desc: 'Middle management focused on operational continuity and team resource health.',
      permissions: ['Attendance View', 'Asset Requests', 'Team Directory']
    },
    {
      id: UserRole.STAFF,
      label: 'General Staff',
      color: 'slate',
      desc: 'Standard users interacting with their own assignments and basic operational tools.',
      permissions: ['Self Attendance', 'Asset Requests', 'Personal Profile']
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-3xl border border-indigo-100">
            <i className="fas fa-user-tag"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 poppins">Role Configuration</h3>
            <p className="text-slate-500 font-medium">Define and customize organizational access levels and permissions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-${role.color}-50 text-${role.color}-600 border border-${role.color}-100`}>
                {role.label}
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                <i className="fas fa-shield-alt"></i>
              </div>
            </div>
            
            <p className="text-sm font-bold text-slate-800 mb-2">Role Scope</p>
            <p className="text-xs text-slate-500 leading-relaxed mb-6 flex-1">{role.desc}</p>
            
            <div className="space-y-3 pt-6 border-t border-slate-50">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core Capabilities</p>
               <div className="flex flex-wrap gap-2">
                 {role.permissions.map(p => (
                   <span key={p} className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-bold border border-slate-100">
                     {p}
                   </span>
                 ))}
               </div>
            </div>

            <button className="mt-6 w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition">
              Customize Permissions
            </button>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-center gap-4">
        <i className="fas fa-info-circle text-amber-500 text-2xl"></i>
        <div>
           <p className="text-sm font-bold text-amber-800">Dynamic Access Control</p>
           <p className="text-xs text-amber-700">Changing role configurations will immediately reflect in the navigation bar and module access for all users assigned to those roles.</p>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
