
import React, { useState, useEffect } from 'react';
import { Role, PERMISSION_GROUPS } from '../types.ts';
import { apiService } from '../api.ts';

const COLORS = [
  { name: 'Indigo', value: 'indigo' },
  { name: 'Rose', value: 'rose' },
  { name: 'Amber', value: 'amber' },
  { name: 'Emerald', value: 'emerald' },
  { name: 'Blue', value: 'blue' },
  { name: 'Violet', value: 'violet' },
  { name: 'Cyan', value: 'cyan' },
  { name: 'Slate', value: 'slate' },
];

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    label: '',
    description: '',
    permissions: [] as string[],
    color: 'indigo'
  });

  const fetchRoles = async () => {
    setLoading(true);
    try {
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
    setIsCreating(false);
    setFormData({
      id: role.id,
      label: role.label,
      description: role.description,
      permissions: role.permissions ? role.permissions.split(',').map(p => p.trim()) : [],
      color: role.color || 'indigo'
    });
  };

  const handleCreate = () => {
    setEditingRole(null);
    setIsCreating(true);
    setFormData({
      id: '',
      label: '',
      description: '',
      permissions: [],
      color: 'indigo'
    });
  };

  const togglePermission = (permKey: string) => {
    setFormData(prev => {
      const isSelected = prev.permissions.includes(permKey);
      return {
        ...prev,
        permissions: isSelected 
          ? prev.permissions.filter(p => p !== permKey) 
          : [...prev.permissions, permKey]
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        permissions: formData.permissions.join(','),
        id: isCreating ? formData.label.toUpperCase().replace(/\s+/g, '_') : formData.id
      };
      
      await apiService.genericSave('roles', payload);
      setEditingRole(null);
      setIsCreating(false);
      fetchRoles();
    } catch (err) {
      alert(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (['ADMIN', 'STAFF'].includes(id)) {
      alert("System protected roles cannot be deleted.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the ${id} role? This may leave users without valid permissions.`)) {
      try {
        await apiService.genericDelete('roles', id);
        fetchRoles();
      } catch (err) {
        alert(err);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6 text-center md:text-left">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-3xl border border-indigo-100">
            <i className="fas fa-user-tag"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 poppins">Global Authorization</h3>
            <p className="text-slate-500 font-medium">Define security scopes and granular module access</p>
          </div>
        </div>
        <button 
          onClick={handleCreate}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> Define Custom Role
        </button>
      </div>

      {/* Role Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full overflow-hidden group">
            {/* Header / Banner */}
            <div className={`h-2 w-full bg-${role.color || 'slate'}-500`}></div>
            
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className={`text-[10px] font-extrabold uppercase tracking-[0.2em] text-${role.color || 'slate'}-500 mb-1`}>
                    {role.id}
                  </span>
                  <h4 className="text-lg font-bold text-slate-800">{role.label}</h4>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-${role.color || 'slate'}-50 flex items-center justify-center text-${role.color || 'slate'}-600 border border-${role.color || 'slate'}-100`}>
                  <i className="fas fa-shield-alt"></i>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed mb-6 flex-1 italic">
                {role.description || "No description provided for this role scope."}
              </p>
              
              <div className="space-y-4 pt-4 border-t border-slate-50">
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capabilities</p>
                    <span className="text-[9px] font-bold text-slate-500 px-2 py-0.5 bg-slate-50 rounded-lg border border-slate-100">
                      {(role.permissions ? role.permissions.split(',').length : 0)} Active
                    </span>
                 </div>
                 <div className="flex flex-wrap gap-1.5 h-16 overflow-y-auto custom-scrollbar pr-1">
                   {role.permissions ? role.permissions.split(',').map(p => (
                     <span key={p} className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-bold border border-slate-100 whitespace-nowrap">
                       {p.trim()}
                     </span>
                   )) : <span className="text-[10px] text-slate-300 italic">No specific permissions</span>}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button 
                  onClick={() => handleEdit(role)}
                  className="py-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition flex items-center justify-center gap-2"
                >
                  <i className="fas fa-sliders-h"></i> Configure
                </button>
                <button 
                  disabled={['ADMIN', 'STAFF'].includes(role.id)}
                  onClick={() => handleDelete(role.id)}
                  className="py-3 bg-slate-50 text-slate-400 rounded-xl text-xs font-bold hover:bg-rose-50 hover:text-rose-500 transition flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-trash-alt"></i> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {(editingRole || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 poppins">
                  {isCreating ? 'Define New Security Role' : `Adjust Role: ${formData.id}`}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Granular Matrix Access Controls</p>
              </div>
              <button 
                onClick={() => { setEditingRole(null); setIsCreating(false); }} 
                className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition flex items-center justify-center"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Identity Column */}
                <div className="space-y-6 lg:col-span-1">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mb-4">Identity & Visuals</h4>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Display Label</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                        value={formData.label} 
                        onChange={e => setFormData({...formData, label: e.target.value})} 
                        placeholder="e.g. Regional Manager"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Color Theme</label>
                      <div className="grid grid-cols-4 gap-2">
                        {COLORS.map(c => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setFormData({...formData, color: c.value})}
                            className={`w-full h-10 rounded-xl transition border-2 flex items-center justify-center bg-${c.value}-500 ${formData.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            title={c.name}
                          >
                            {formData.color === c.value && <i className="fas fa-check text-white text-xs"></i>}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Scope Description</label>
                      <textarea 
                        rows={4} 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm italic" 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        placeholder="Briefly describe what this role is responsible for..."
                      />
                    </div>
                  </div>
                </div>

                {/* Permissions Column */}
                <div className="lg:col-span-2 space-y-8">
                  <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">Module Permission Matrix</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                      <div key={group} className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                          <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                          <h5 className="text-[11px] font-black text-slate-800 tracking-wider uppercase">{group}</h5>
                        </div>
                        <div className="space-y-3">
                          {perms.map(p => {
                            const isChecked = formData.permissions.includes(p.key);
                            return (
                              <label key={p.key} className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer group ${isChecked ? 'bg-indigo-50/30 border-indigo-100' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                                <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-indigo-300'}`}>
                                  <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={isChecked} 
                                    onChange={() => togglePermission(p.key)} 
                                  />
                                  {isChecked && <i className="fas fa-check text-[10px] text-white"></i>}
                                </div>
                                <div>
                                  <p className={`text-xs font-bold transition ${isChecked ? 'text-indigo-900' : 'text-slate-700'}`}>{p.label}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{p.desc}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => { setEditingRole(null); setIsCreating(false); }} 
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-3xl font-bold hover:bg-slate-100 transition"
                >
                  Discard Changes
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-3xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition transform active:scale-95"
                >
                  Commit Role Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
