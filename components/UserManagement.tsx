
import React, { useState, useEffect } from 'react';
import { User, UserRole, Employee, Department } from '../types.ts';
import { apiService } from '../api.ts';

interface UserManagementProps {
  usersOverride?: User[];
}

const UserManagement: React.FC<UserManagementProps> = ({ usersOverride }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: UserRole.STAFF,
    full_name: '',
    email: '',
    department: '',
    shift_start_time: '09:00',
    team_lead_id: '',
    manager_id: '',
    joining_date: new Date().toISOString().split('T')[0],
    designation: '',
    is_active: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userData, deptData] = await Promise.all([
        apiService.getUsers(),
        apiService.getDepartments()
      ]);
      setUsers(userData);
      setDepartments(deptData);
      
      if (deptData.length > 0 && !formData.department) {
        setFormData(prev => ({ ...prev, department: deptData[0].name }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const displayUsers = usersOverride || users;
  const teamLeads = users.filter(u => u.role === UserRole.TEAM_LEAD);
  const managers = users.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '', 
        role: user.role,
        full_name: user.full_name,
        email: '', 
        department: user.department || '',
        shift_start_time: user.shift_start_time || '09:00',
        team_lead_id: user.team_lead_id || '',
        manager_id: user.manager_id || '',
        joining_date: user.joining_date || new Date().toISOString().split('T')[0],
        designation: user.designation || '',
        is_active: user.is_active !== false
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: UserRole.STAFF,
        full_name: '',
        email: '',
        department: departments[0]?.name || '',
        shift_start_time: '09:00',
        team_lead_id: '',
        manager_id: '',
        joining_date: new Date().toISOString().split('T')[0],
        designation: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = editingUser ? editingUser.id : `U-${Date.now()}`;
    
    try {
      const userToSave: User = {
        id: userId,
        username: formData.username,
        role: formData.role,
        full_name: formData.full_name,
        department: formData.department,
        shift_start_time: formData.shift_start_time,
        team_lead_id: formData.team_lead_id || undefined,
        manager_id: formData.manager_id || undefined,
        joining_date: formData.joining_date,
        designation: formData.designation || undefined,
        is_active: formData.is_active
      };
      
      if (formData.password) {
        userToSave.password = formData.password;
      }

      await apiService.saveUser(userToSave);

      // Sync to Staff Directory
      const employeeId = editingUser ? `IBS-EMP-${userId}` : `IBS-EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      const employeeToSave: Employee = {
        id: employeeId,
        name: formData.full_name,
        email: formData.email || '',
        department: formData.department,
        role: formData.designation || formData.role.replace('_', ' ').toLowerCase(),
        team_lead_id: formData.team_lead_id || undefined,
        manager_id: formData.manager_id || undefined,
        joining_date: formData.joining_date,
        is_active: formData.is_active
      };
      await apiService.saveEmployee(employeeToSave);

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Permanently delete this user account?")) {
      try {
        await apiService.deleteUser(id);
        fetchData();
      } catch (err) {
        alert(err);
      }
    }
  };

  const filteredUsers = displayUsers.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-3xl border border-blue-100">
            <i className="fas fa-user-shield"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 poppins">User & Role Management</h3>
            <p className="text-slate-500 font-medium">Configure hierarchy and organizational roles</p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition">New User Account</button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" placeholder="Search by name or username..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="ALL">All Roles</option>
            {Object.values(UserRole).map(role => (
              <option key={role} value={role}>{role.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-5">Full Name</th>
                <th className="px-6 py-5">Role / Designation</th>
                <th className="px-6 py-5">Department</th>
                <th className="px-6 py-5">Reporting To</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => {
                const lead = users.find(tl => tl.id === u.team_lead_id);
                const manager = users.find(m => m.id === u.manager_id);
                const isActive = u.is_active !== false;
                return (
                  <tr key={u.id} className={`hover:bg-slate-50 transition ${!isActive ? 'opacity-60 bg-slate-50/50' : ''}`}>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           {!isActive && <i className="fas fa-user-slash text-rose-400 text-[10px]" title="Disabled"></i>}
                           <div>
                              <p className="text-xs font-bold text-slate-800">{u.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">@{u.username}</p>
                           </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border bg-slate-50 text-slate-500`}>
                          {u.role.replace('_', ' ')}
                        </span>
                        {u.designation && <p className="text-[10px] font-bold text-indigo-600">{u.designation}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{u.department}</td>
                    <td className="px-6 py-4">
                        <div className="space-y-1">
                            {lead && <p className="text-[10px] font-bold text-indigo-600"><span className="text-slate-400 font-medium mr-1">TL:</span> {lead.full_name}</p>}
                            {manager && <p className="text-[10px] font-bold text-amber-600"><span className="text-slate-400 font-medium mr-1">MGR:</span> {manager.full_name}</p>}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => handleOpenModal(u)} className="text-amber-500 hover:text-amber-700 transition"><i className="fas fa-edit"></i></button>
                        <button onClick={() => handleDeleteUser(u.id)} className="text-rose-500 hover:text-rose-700 transition" disabled={u.username === 'admin'}><i className="fas fa-trash-alt"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl p-8 animate-fadeIn max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold mb-1">{editingUser ? 'Edit User Profile' : 'Register User'}</h3>
            <p className="text-xs text-slate-400 mb-6 uppercase font-bold tracking-widest">Setup access and organizational reporting</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Full Name</label>
                    <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Department</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                        {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Username</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} readOnly={!!editingUser} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Password {editingUser && '(Leave blank for no change)'}</label>
                  <input type="password" required={!editingUser} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Designation (Optional)</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-indigo-600" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="e.g. Senior Backend Lead" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Joining Date</label>
                  <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">System Role</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                        <option value={UserRole.STAFF}>STAFF</option>
                        <option value={UserRole.TEAM_LEAD}>TEAM LEAD</option>
                        <option value={UserRole.MANAGER}>MANAGER</option>
                        <option value={UserRole.ADMIN}>ADMIN</option>
                    </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Shift Start Time</label>
                  <input required type="time" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={formData.shift_start_time} onChange={e => setFormData({...formData, shift_start_time: e.target.value})} />
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700">Account Authorization Status</p>
                    <p className="text-[10px] text-slate-400 font-medium">Disable account to prevent system login</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.is_active} 
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      disabled={formData.username === 'admin'}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
              </div>

              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                 <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Hierarchy Assignment</p>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Reporting Team Lead</label>
                        <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={formData.team_lead_id} onChange={e => setFormData({...formData, team_lead_id: e.target.value})}>
                            <option value="">No Team Lead</option>
                            {teamLeads.filter(tl => tl.id !== editingUser?.id).map(tl => (
                              <option key={tl.id} value={tl.id}>{tl.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Department Manager</label>
                        <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" value={formData.manager_id} onChange={e => setFormData({...formData, manager_id: e.target.value})}>
                            <option value="">No Manager</option>
                            {managers.filter(m => m.id !== editingUser?.id).map(m => (
                              <option key={m.id} value={m.id}>{m.full_name}</option>
                            ))}
                        </select>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
