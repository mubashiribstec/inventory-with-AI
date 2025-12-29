
import React, { useState, useEffect } from 'react';
import { LeaveRequest, User, UserRole } from '../types.ts';
import { apiService } from '../api.ts';

interface LeaveModuleProps {
  currentUser: User;
}

const LeaveModule: React.FC<LeaveModuleProps> = ({ currentUser }) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'VACATION' as any,
    reason: ''
  });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const data = await apiService.getLeaveRequests();
      setLeaves(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `LV-${Date.now()}`;
    const request: LeaveRequest = {
      ...newLeave,
      id,
      user_id: currentUser.id,
      username: currentUser.username,
      status: 'PENDING'
    };

    try {
      await apiService.saveLeaveRequest(request);
      setIsModalOpen(false);
      fetchLeaves();
    } catch (err) {
      alert(err);
    }
  };

  const handleUpdateStatus = async (leave: LeaveRequest, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiService.saveLeaveRequest({ ...leave, status });
      fetchLeaves();
    } catch (err) {
      alert(err);
    }
  };

  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;
  const filteredLeaves = isAdmin ? leaves : leaves.filter(l => l.user_id === currentUser.id);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 text-3xl border border-emerald-100">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 poppins">Leave Management</h3>
            <p className="text-slate-500 font-medium">Request time off or manage staff leave applications</p>
          </div>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition"
          >
            Request Leave
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 poppins">Leave Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-5">Employee</th>
                <th className="px-6 py-5">Date Range</th>
                <th className="px-6 py-5">Type</th>
                <th className="px-6 py-5">Reason</th>
                <th className="px-6 py-5">Status</th>
                {isAdmin && <th className="px-6 py-5 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLeaves.map(leave => (
                <tr key={leave.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-xs font-bold text-slate-800">{leave.username}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">{leave.start_date} to {leave.end_date}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">{leave.leave_type}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{leave.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                      leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                      leave.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-center">
                      {leave.status === 'PENDING' && (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleUpdateStatus(leave, 'APPROVED')} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition" title="Approve">
                            <i className="fas fa-check"></i>
                          </button>
                          <button onClick={() => handleUpdateStatus(leave, 'REJECTED')} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition" title="Reject">
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 animate-fadeIn">
            <h3 className="text-xl font-bold mb-6">Request Time Off</h3>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Start Date</label>
                  <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" value={newLeave.start_date} onChange={e => setNewLeave({...newLeave, start_date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">End Date</label>
                  <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" value={newLeave.end_date} onChange={e => setNewLeave({...newLeave, end_date: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Leave Type</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" value={newLeave.leave_type} onChange={e => setNewLeave({...newLeave, leave_type: e.target.value as any})}>
                  <option value="VACATION">Vacation</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Reason</label>
                <textarea required rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" placeholder="Describe the reason for your request..." value={newLeave.reason} onChange={e => setNewLeave({...newLeave, reason: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveModule;
