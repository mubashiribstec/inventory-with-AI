
import React, { useState, useEffect } from 'react';
import { User, UserRole, Employee, Department } from '../types.ts';
import { apiService } from '../api.ts';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: UserRole.STAFF,
    full_name: '',
    email: '',
    department: '',
    shift_start_time: '09:00'
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

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '', // Leave blank for security during edits
        role: user.role,
        full_name: user.full_name,
        email: '', // We don't store email in user table currently, would need a fetch from employee
        department: '',
        shift_start_time: user.shift_start_time || '09:00'
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
        shift_start_time: '09:00'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingUser ? editingUser.id : `U-${Date.now()}`;
    
    try {
      // 1. Save User Account
      const userToSave: User = {
        id,
        username: formData.username,
        role: formData.role,
        full_name: formData.full_name,
        shift_start_time: formData.shift_start_time
      };
      
      // Only update password if provided
      if (formData.password) {
        userToSave.password = formData.password;
      } else if (editingUser) {
        // If editing and password is empty, we keep old one (API handles partial update via genericSave)
      }

      await apiService.saveUser(userToSave);

      // 2. Sync to Staff Directory (only if creating new or email/dept provided)
      if (!editingUser || formData.email || formData.department) {
        const employeeToSave: Employee = {
          id: editingUser ? `EMP-${editingUser.id.split('-')[1]}` : `EMP-${id.split('-')[1]}`,
          name: formData.full_name,
          email: formData.email || '',
          department: formData.department || '',
          role: formData.role.replace('_', ' ').toLowerCase()
        };
        await apiService.saveEmployee(employeeToSave);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Permanently delete user account and linked directory record for ${user.full_name}?`)) {
      try {
        await apiService.deleteUser(user.id);
        fetchData();
      } catch (err) {
        alert(err);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-3xl border border-blue-100">
            <i className="fas fa-user-shield"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 poppins">User & Role Management</h3>
            <p className="text-slate-500 font-medium">Configure access levels and link accounts to organizational roles</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition"
        >
          New User Account
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-5">Full Name</th>
                <th className="px-6 py-5">Username</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Shift Start</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-xs font-bold text-slate-800">{u.full_name}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
                      u.role === UserRole.ADMIN ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      u.role === UserRole.MANAGER ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      u.role === UserRole.HR ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      u.role === UserRole.TEAM_LEAD ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-indigo-600">{u.shift_start_time || '09:00'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => handleOpenModal(u)} className="text-amber-500 hover:text-amber-700">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u)}
                        disabled={u.username === 'admin'}
                        className="text-rose-600 hover:text-rose-800 disabled:opacity-30"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 animate-fadeIn max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold mb-1">{editingUser ? 'Customize User Access' : 'Create System User'}</h3>
            <p className="text-xs text-slate-400 mb-6 uppercase font-bold tracking-widest">Adjust permissions and directory details</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Full Name</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="e.g. Michael Jordan" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              </div>
              {!editingUser && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Official Email</label>
                  <input required type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="m.jordan@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Username</label>
                  <input required type="text" className={`w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl ${editingUser ? 'opacity-50' : ''}`} placeholder="jordan23" value={formData.username} onChange={e => !editingUser && setFormData({...formData, username: e.target.value})} readOnly={!!editingUser} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Password {editingUser && '(Leave blank to keep)'}</label>
                  <input type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
              {!editingUser && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Department</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">System Role</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                    <option value={UserRole.STAFF}>STAFF</option>
                    <option value={UserRole.TEAM_LEAD}>TEAM LEAD</option>
                    <option value={UserRole.HR}>HR</option>
                    <option value={UserRole.MANAGER}>MANAGER</option>
                    <option value={UserRole.ADMIN}>ADMIN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Shift Start</label>
                  <input required type="time" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={formData.shift_start_time} onChange={e => setFormData({...formData, shift_start_time: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">
                  {editingUser ? 'Update Account' : 'Create & Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
