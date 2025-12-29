
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';
import { apiService } from '../api.ts';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: UserRole.STAFF,
    full_name: '',
    shift_start_time: '09:00'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `U-${Date.now()}`;
    try {
      await apiService.saveUser({ ...newUser, id });
      setIsModalOpen(false);
      setNewUser({ username: '', password: '', role: UserRole.STAFF, full_name: '', shift_start_time: '09:00' });
      fetchUsers();
    } catch (err) {
      alert(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Permanently delete this user account?")) {
      try {
        await apiService.deleteUser(id);
        fetchUsers();
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
            <h3 className="text-xl font-bold text-slate-800 poppins">User Management</h3>
            <p className="text-slate-500 font-medium">Create and manage access for system administrators, managers, and staff</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
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
                <th className="px-6 py-5">System ID</th>
                <th className="px-6 py-5">Full Name</th>
                <th className="px-6 py-5">Username</th>
                <th className="px-6 py-5">Shift Start</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">{u.id}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800">{u.full_name}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">{u.username}</td>
                  <td className="px-6 py-4 text-xs font-bold text-indigo-600">{u.shift_start_time || '09:00'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
                      u.role === UserRole.ADMIN ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      u.role === UserRole.MANAGER ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={u.username === 'admin'}
                      className="text-rose-600 hover:text-rose-800 disabled:opacity-30"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 animate-fadeIn">
            <h3 className="text-xl font-bold mb-6">Create System User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Full Name</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="e.g. Michael Jordan" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Username</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="jordan23" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Password</label>
                <input required type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="••••••••" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">System Role</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                    <option value={UserRole.STAFF}>STAFF</option>
                    <option value={UserRole.MANAGER}>MANAGER</option>
                    <option value={UserRole.ADMIN}>ADMIN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Shift Start (HH:mm)</label>
                  <input required type="time" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={newUser.shift_start_time} onChange={e => setNewUser({...newUser, shift_start_time: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
