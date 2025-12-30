
import React, { useState, useEffect, useMemo } from 'react';
import { LeaveRequest, User, UserRole, Notification } from '../types.ts';
import { apiService } from '../api.ts';

interface LeaveModuleProps {
  currentUser: User;
  allUsers?: User[];
}

const LeaveModule: React.FC<LeaveModuleProps> = ({ currentUser, allUsers = [] }) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'VACATION' as any,
    reason: '',
    username: ''
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

  const sanitizeDate = (d: string) => {
    if (!d) return '';
    return d.includes('T') ? d.split('T')[0] : d;
  };

  const handleOpenModal = (leave?: LeaveRequest) => {
    if (leave) {
      setEditingLeave(leave);
      setFormData({
        start_date: sanitizeDate(leave.start_date),
        end_date: sanitizeDate(leave.end_date),
        leave_type: leave.leave_type,
        reason: leave.reason,
        username: leave.username
      });
    } else {
      setEditingLeave(null);
      setFormData({
        start_date: '',
        end_date: '',
        leave_type: 'VACATION',
        reason: '',
        username: currentUser.full_name
      });
    }
    setIsModalOpen(true);
  };

  const sendManagerNotification = async (request: LeaveRequest) => {
    if (currentUser.manager_id) {
      await apiService.createNotification({
        recipient_id: currentUser.manager_id,
        sender_name: currentUser.full_name,
        message: `${currentUser.full_name} has applied for ${request.leave_type.toLowerCase()} from ${request.start_date} to ${request.end_date}. Review required.`,
        type: 'LEAVE',
        is_read: false
      });
    }
    // Also notify Team Lead if user is staff
    if (currentUser.role === UserRole.STAFF && currentUser.team_lead_id) {
        await apiService.createNotification({
          recipient_id: currentUser.team_lead_id,
          sender_name: currentUser.full_name,
          message: `${currentUser.full_name} has applied for ${request.leave_type.toLowerCase()}. Review required.`,
          type: 'LEAVE',
          is_read: false
        });
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !editingLeave;
    const id = editingLeave ? editingLeave.id : `LV-${Date.now()}`;
    const request: LeaveRequest = {
      ...formData,
      start_date: sanitizeDate(formData.start_date),
      end_date: sanitizeDate(formData.end_date),
      id,
      user_id: editingLeave ? editingLeave.user_id : currentUser.id,
      username: formData.username || (editingLeave ? editingLeave.username : currentUser.username),
      status: editingLeave ? editingLeave.status : 'PENDING'
    };

    try {
      await apiService.saveLeaveRequest(request);
      if (isNew) {
        await sendManagerNotification(request);
      }
      setIsModalOpen(false);
      setEditingLeave(null);
      fetchLeaves();
    } catch (err) {
      alert(err);
    }
  };

  const handleUpdateStatus = async (leave: LeaveRequest, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiService.saveLeaveRequest({ 
        ...leave, 
        status,
        start_date: sanitizeDate(leave.start_date),
        end_date: sanitizeDate(leave.end_date)
      });
      
      await apiService.createNotification({
        recipient_id: leave.user_id,
        sender_name: currentUser.full_name,
        message: `Your leave request for ${sanitizeDate(leave.start_date)} has been ${status.toLowerCase()}.`,
        type: 'LEAVE',
        is_read: false
      });

      fetchLeaves();
    } catch (err) {
      alert(err);
    }
  };

  const handleWithdraw = async (id: string) => {
    if (window.confirm("Are you sure you want to withdraw this pending leave request?")) {
      try {
        await apiService.deleteLeaveRequest(id);
        fetchLeaves();
      } catch (err) {
        alert("Error withdrawing request: " + err);
      }
    }
  };

  const isManagement = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.HR || currentUser.role === UserRole.TEAM_LEAD;

  const filteredLeaves = useMemo(() => {
    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.HR) return leaves;
    if (currentUser.role === UserRole.MANAGER) {
        // Find users in manager's department
        const subordinateUserIds = allUsers.filter(u => u.department === currentUser.department).map(u => u.id);
        return leaves.filter(l => subordinateUserIds.includes(l.user_id) || l.user_id === currentUser.id);
    }
    if (currentUser.role === UserRole.TEAM_LEAD) {
        // Find users reporting to this TL
        const subordinateUserIds = allUsers.filter(u => u.team_lead_id === currentUser.id).map(u => u.id);
        return leaves.filter(l => subordinateUserIds.includes(l.user_id) || l.user_id === currentUser.id);
    }
    return leaves.filter(l => l.user_id === currentUser.id);
  }, [leaves, currentUser, allUsers]);

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
        {!isManagement && (
          <button 
            onClick={() => handleOpenModal()}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition"
          >
            Apply for Leave
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 poppins">Leave Ledger</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Decision tracking & history</p>
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
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLeaves.sort((a,b) => b.start_date.localeCompare(a.start_date)).map(leave => {
                const isOwner = leave.user_id === currentUser.id;
                const canWithdraw = isOwner && leave.status === 'PENDING';
                const canApprove = isManagement && leave.status === 'PENDING' && !isOwner;

                return (
                  <tr key={leave.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">{leave.username}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{sanitizeDate(leave.start_date)} to {sanitizeDate(leave.end_date)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">{leave.leave_type}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{leave.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase border ${
                        leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        leave.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        {canApprove && (
                          <>
                            <button onClick={() => handleUpdateStatus(leave, 'APPROVED')} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition" title="Approve">
                              <i className="fas fa-check"></i>
                            </button>
                            <button onClick={() => handleUpdateStatus(leave, 'REJECTED')} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition" title="Reject">
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        )}
                        {canWithdraw && (
                          <button onClick={() => handleWithdraw(leave.id)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition" title="Withdraw Request">
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        )}
                        {(currentUser.role === UserRole.ADMIN || (isManagement && !canApprove)) && (
                          <button onClick={() => handleOpenModal(leave)} className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition" title="Edit">
                            <i className="fas fa-edit text-xs"></i>
                          </button>
                        )}
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
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingLeave ? 'Edit Leave Record' : 'Apply for Leave'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Employee Name</label>
                <input readOnly type="text" className="w-full px-4 py-3 bg-slate-100 border border-slate-100 rounded-xl font-bold text-slate-500 cursor-not-allowed" value={formData.username} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start Date</label>
                  <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">End Date</label>
                  <input required type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Leave Type</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" value={formData.leave_type} onChange={e => setFormData({...formData, leave_type: e.target.value as any})}>
                  <option value="VACATION">Vacation</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reason / Details</label>
                <textarea required rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm" placeholder="Describe the reason for the time off..." value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition">
                  {editingLeave ? 'Update Record' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveModule;
