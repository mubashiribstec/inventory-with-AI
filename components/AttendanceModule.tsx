
import React, { useState, useEffect } from 'react';
import { AttendanceRecord, User, UserRole, Notification } from '../types.ts';
import { apiService } from '../api.ts';

interface AttendanceModuleProps {
  currentUser: User;
}

const AttendanceModule: React.FC<AttendanceModuleProps> = ({ currentUser }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<AttendanceRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Use a stable reference for today's date string
  const todayStr = new Date().toISOString().split('T')[0];

  /**
   * Helper to sanitize date for MariaDB DATE columns (YYYY-MM-DD)
   */
  const sanitizeDateForSQL = (d: string | null | undefined): string => {
    if (!d) return '';
    if (d.includes('T')) return d.split('T')[0];
    if (d.includes(' ')) return d.split(' ')[0];
    return d;
  };

  /**
   * Helper to format any date/time string for MariaDB DATETIME (YYYY-MM-DD HH:MM:SS)
   */
  const formatDateTimeForSQL = (dateVal: string | Date | null | undefined): string | null => {
    if (!dateVal) return null;
    try {
      const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 19).replace('T', ' ');
    } catch (e) {
      console.error("Formatting error", e);
      return null;
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const all = await apiService.getAttendance();
      setRecords(all);
      
      // Find the LATEST active session (no check-out) for the current user
      const active = all
        .filter(r => r.user_id === currentUser.id && r.check_out === null)
        .sort((a, b) => {
          const timeA = a.check_in ? new Date(a.check_in).getTime() : 0;
          const timeB = b.check_in ? new Date(b.check_in).getTime() : 0;
          return timeB - timeA;
        })[0];
        
      setActiveSession(active || null);
    } catch (err) {
      console.error("Fetch attendance error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentUser.id]);

  const sendHierarchyNotifications = async (action: 'CHECKED IN' | 'CHECKED OUT') => {
    const recipients = [];
    
    // Logic: 
    // Staff -> TL & Manager
    // Team Lead -> Manager
    
    if (currentUser.role === UserRole.STAFF) {
      if (currentUser.team_lead_id) recipients.push(currentUser.team_lead_id);
      if (currentUser.manager_id) recipients.push(currentUser.manager_id);
    } else if (currentUser.role === UserRole.TEAM_LEAD) {
      if (currentUser.manager_id) recipients.push(currentUser.manager_id);
    }

    const promises = recipients.map(rid => apiService.createNotification({
      recipient_id: rid,
      sender_name: currentUser.full_name,
      message: `${currentUser.full_name} has successfully ${action.toLowerCase()} for their shift.`,
      type: 'ATTENDANCE',
      is_read: false
    }));

    await Promise.all(promises);
  };

  const handleCheckIn = async () => {
    const now = new Date();
    const checkInTime = formatDateTimeForSQL(now);
    
    // We use a unique ID that includes a timestamp to allow multiple check-ins per day
    const uniqueId = `ATT-${currentUser.id}-${Date.now()}`;
    
    const shiftStart = currentUser.shift_start_time || '09:00';
    const [shiftH, shiftM] = shiftStart.split(':').map(Number);
    
    // Calculate minutes from midnight for comparison
    const shiftMinutes = shiftH * 60 + shiftM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Employee is LATE only if check-in is > 30 minutes after shift start
    const isLate = currentMinutes > (shiftMinutes + 30);
    
    const record: AttendanceRecord = {
      id: uniqueId,
      user_id: currentUser.id,
      username: currentUser.username,
      date: todayStr,
      check_in: checkInTime,
      check_out: null,
      status: isLate ? 'LATE' : 'PRESENT',
      location: 'Remote/Office'
    };

    try {
      await apiService.saveAttendance(record);
      await sendHierarchyNotifications('CHECKED IN');
      fetchRecords();
    } catch (err) {
      alert("Error checking in: " + err);
    }
  };

  const handleCheckOut = async () => {
    if (!activeSession) return;
    
    const now = new Date();
    const checkOutTime = formatDateTimeForSQL(now);
    
    const parseDate = (dStr: string | null) => {
      if (!dStr) return null;
      let iso = dStr;
      if (iso.includes(' ') && !iso.includes('T')) iso = iso.replace(' ', 'T');
      if (!iso.includes('Z')) iso += 'Z';
      const d = new Date(iso);
      return isNaN(d.getTime()) ? null : d;
    };

    const checkIn = parseDate(activeSession.check_in);
    
    if (checkIn) {
      const durationMs = now.getTime() - checkIn.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      
      // Mandatory 1-hour minimum stay
      if (durationHours < 1) {
        const remainingMinutes = Math.ceil(60 - (durationMs / (1000 * 60)));
        alert(`Safety Protocol: You cannot check out within 1 hour of checking in. Please try again in ${remainingMinutes} minutes.`);
        return;
      }

      let finalStatus = activeSession.status;
      // Mark as half-day if less than 5 hours (adjust as per company policy for extra shifts)
      if (durationHours < 5) {
        finalStatus = 'HALF-DAY';
      }

      const record: AttendanceRecord = {
        ...activeSession,
        date: sanitizeDateForSQL(activeSession.date),
        check_in: formatDateTimeForSQL(activeSession.check_in),
        check_out: checkOutTime,
        status: finalStatus as any
      };

      try {
        await apiService.saveAttendance(record);
        await sendHierarchyNotifications('CHECKED OUT');
        fetchRecords();
      } catch (err) {
        alert("Error checking out: " + err);
      }
    }
  };

  const handleManualEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      const recordToSave = {
        ...editingRecord,
        date: sanitizeDateForSQL(editingRecord.date),
        check_in: editingRecord.check_in ? formatDateTimeForSQL(editingRecord.check_in) : null,
        check_out: editingRecord.check_out ? formatDateTimeForSQL(editingRecord.check_out) : null
      };
      await apiService.saveAttendance(recordToSave);
      setEditingRecord(null);
      fetchRecords();
    } catch (err) {
      alert("Error updating record: " + err);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this attendance record?")) {
      try {
        await apiService.deleteAttendance(id);
        fetchRecords();
      } catch (err) {
        alert("Error deleting record: " + err);
      }
    }
  };

  const isFullAdmin = currentUser.role === UserRole.ADMIN;
  const isManagement = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;
  const filteredRecords = isManagement ? records : records.filter(r => r.user_id === currentUser.id);

  const displayTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    try {
      let iso = timeStr;
      if (iso.includes(' ') && !iso.includes('T')) iso = iso.replace(' ', 'T');
      if (!iso.includes('Z')) iso += 'Z';
      const date = new Date(iso);
      return isNaN(date.getTime()) ? '-' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Today's Action Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-3xl border border-indigo-100">
            <i className="fas fa-clock"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 poppins">Shift Control</h3>
            <p className="text-slate-500 font-medium">
               Assigned Shift: <span className="font-bold text-indigo-600">{currentUser.shift_start_time || '09:00'}</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Supports flexible hours & double shifts</p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          {!activeSession ? (
            <button 
              onClick={handleCheckIn}
              className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-sign-in-alt"></i>
              Start New Shift
            </button>
          ) : (
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="px-6 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col justify-center">
                 <span className="text-[10px] text-emerald-600 font-bold uppercase">Shift Started At</span>
                 <span className="text-emerald-800 font-bold">{displayTime(activeSession.check_in)}</span>
              </div>
              <button 
                onClick={handleCheckOut}
                className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition flex items-center justify-center gap-2"
              >
                <i className="fas fa-sign-out-alt"></i>
                End Shift Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 poppins">Attendance & Shift Ledger</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Showing all logged sessions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-5">Date</th>
                {isManagement && <th className="px-6 py-5">Employee</th>}
                <th className="px-6 py-5">Check In</th>
                <th className="px-6 py-5">Check Out</th>
                <th className="px-6 py-5">Duration</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Safety Check</th>
                {isFullAdmin && <th className="px-6 py-5 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.sort((a,b) => {
                 const timeA = a.check_in ? new Date(a.check_in).getTime() : 0;
                 const timeB = b.check_in ? new Date(b.check_in).getTime() : 0;
                 return timeB - timeA;
              }).map(record => {
                const parseDate = (dStr: string | null) => {
                  if (!dStr) return null;
                  let iso = dStr;
                  if (iso.includes(' ') && !iso.includes('T')) iso = iso.replace(' ', 'T');
                  if (!iso.includes('Z')) iso += 'Z';
                  const d = new Date(iso);
                  return isNaN(d.getTime()) ? null : d;
                };
                const checkIn = parseDate(record.check_in);
                const checkOut = parseDate(record.check_out);
                const diff = checkIn && checkOut ? (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60) : 0;
                const hoursShort = checkOut && diff < 7.5;

                return (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">{sanitizeDateForSQL(record.date)}</td>
                    {isManagement && <td className="px-6 py-4 text-xs font-bold text-indigo-600">{record.username}</td>}
                    <td className="px-6 py-4 text-xs text-slate-600">{displayTime(record.check_in)}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{displayTime(record.check_out)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">{diff > 0 ? `${diff.toFixed(1)} hrs` : (record.check_out ? '-' : 'Active')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        record.status === 'LATE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        record.status === 'HALF-DAY' ? 'bg-violet-50 text-violet-600 border-violet-100' :
                        'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {hoursShort && (
                        <div className="flex items-center gap-1 text-rose-500 font-bold text-[9px] uppercase tracking-tighter bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                          <i className="fas fa-exclamation-triangle"></i>
                          Sub-Optimal Duration
                        </div>
                      )}
                      {!record.check_out && (
                        <div className="flex items-center gap-1 text-indigo-500 font-bold text-[9px] uppercase tracking-tighter bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                          <i className="fas fa-spinner animate-spin"></i>
                          Session In Progress
                        </div>
                      )}
                    </td>
                    {isFullAdmin && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setEditingRecord(record)}
                            className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition flex items-center justify-center"
                            title="Edit"
                          >
                            <i className="fas fa-edit text-xs"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteRecord(record.id)}
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition flex items-center justify-center"
                            title="Delete"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Edit Modal - Admin Only */}
      {isFullAdmin && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 animate-fadeIn">
            <h3 className="text-xl font-bold mb-2">Adjust Shift Record</h3>
            <p className="text-slate-500 text-xs mb-6 font-medium uppercase tracking-widest">
              Modifying log for: <span className="text-indigo-600 font-bold">{editingRecord.username}</span> on {sanitizeDateForSQL(editingRecord.date)}
            </p>
            <form onSubmit={handleManualEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Check In Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-sm" 
                  value={editingRecord.check_in ? new Date(new Date(editingRecord.check_in).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} 
                  onChange={e => setEditingRecord({...editingRecord, check_in: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Check Out Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-sm" 
                  value={editingRecord.check_out ? new Date(new Date(editingRecord.check_out).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} 
                  onChange={e => setEditingRecord({...editingRecord, check_out: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Calculated Status</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold" 
                  value={editingRecord.status} 
                  onChange={e => setEditingRecord({...editingRecord, status: e.target.value as any})}
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="HALF-DAY">HALF-DAY</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="ON-LEAVE">ON-LEAVE</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingRecord(null)} 
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceModule;
