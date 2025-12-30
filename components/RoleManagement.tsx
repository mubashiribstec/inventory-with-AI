
import React, { useState, useEffect } from 'react';
import { UserRole, Role } from '../types.ts';
import { apiService } from '../api.ts';

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    permissions: ''
  });

  const fetchRoles = async () => {
    setLoading(true);
    try {
      // Fix: Use the exported getRoles method from apiService instead of the internal handleRequest
      const data = await apiService.getRoles();
      setRoles(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      label: role.label,
      description: role.description,
      permissions: role.permissions
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    try {
      await apiService.genericSave('roles', {
        ...editingRole,
        ...formData
      });
      setEditingRole(null);
      fetchRoles();
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-3xl border border-indigo-100">
            <i className="fas fa-user-tag"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 poppins">Role Configuration</h3>
            <p className="text-slate-500 font-medium">Customize access levels and permissions dynamically</p>
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
            <p className="text-xs text-slate-500 leading-relaxed mb-6 flex-1">{role.description}</p>
            
            <div className="space-y-3 pt-6 border-t border-slate-50">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capabilities</p>
               <div className="flex flex-wrap gap-2">
                 {role.permissions.split(',').map(p => (
                   <span key={p} className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-bold border border-slate-100">
                     {p.trim()}
                   </span>
                 ))}
               </div>
            </div>

            <button 
              onClick={() => handleEdit(role)}
              className="mt-6 w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition"
            >
              Modify Permissions
            </button>
          </div>
        ))}
      </div>

      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 animate-fadeIn">
            <h3 className="text-xl font-bold mb-1">Edit {editingRole.id} Role</h3>
            <p className="text-xs text-slate-400 mb-6 uppercase font-bold">Adjust global permissions for this role</p>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Display Label</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Scope Description</label>
                <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Permissions (Comma Separated)</label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[10px]" value={formData.permissions} onChange={e => setFormData({...formData, permissions: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingRole(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;