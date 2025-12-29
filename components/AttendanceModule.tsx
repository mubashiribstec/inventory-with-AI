
import React, { useState, useEffect } from 'react';
import { AttendanceRecord, User, UserRole } from '../types.ts';
import { apiService } from '../api.ts';

interface AttendanceModuleProps {
  currentUser: User;
}

const AttendanceModule: React.FC<AttendanceModuleProps> = ({ currentUser }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

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
      
      const mine = all.find(r => r.user_id === currentUser.id && sanitizeDateForSQL(r.date) === todayStr);
      setTodayRecord(mine || null);
    } catch (err) {
      console.error("Fetch attendance error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentUser.id]);

  const handleCheckIn = async () => {
    const now = new Date();
    const checkInTime = formatDateTimeForSQL(now);
    
    // Status Logic based on user's specific shift start time
    // Default to 09:00 if not set
    const shiftStart = currentUser.shift_start_time || '09:00';
    const [shiftH, shiftM] = shiftStart.split(':').map(Number);
    
    const isLate = now.getHours() > shiftH || (now.getHours() === shiftH && now.getMinutes() > shiftM);
    
    const record: AttendanceRecord = {
      id: `ATT-${todayStr}-${currentUser.id}`,
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
      fetchRecords();
    } catch (err) {
      alert("Error checking in: " + err);
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    
    const now = new Date();
    const checkOutTime = formatDateTimeForSQL(now);
    
    // Recalculate duration and status
    const parseDate = (dStr: string | null) => {
      if (!dStr) return null;
      let iso = dStr;
      if (iso.includes(' ') && !iso.includes('T')) iso = iso.replace(' ', 'T');
      if (!iso.includes('Z')) iso += 'Z';
      const d = new Date(iso);
      return isNaN(d.getTime()) ? null : d;
    };

    const checkIn = parseDate(todayRecord.check_in);
    let finalStatus = todayRecord.status;

    if (checkIn) {
      const durationHours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      
      // Logic: Less than 5 hours is Half-Day
      if (durationHours < 5) {
        finalStatus = 'HALF-DAY';
      }
    }

    const record: AttendanceRecord = {
      ...todayRecord,
      date: sanitizeDateForSQL(todayRecord.date),
      check_in: formatDateTimeForSQL(todayRecord.check_in),
      check_out: checkOutTime,
      status: finalStatus as any
    };

    try {
      await apiService.saveAttendance(record);
      fetchRecords();
    } catch (err) {
      alert("Error checking out: " + err);
    }
  };

  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;
  const filteredRecords = isAdmin ? records : records.filter(r => r.user_id === currentUser.id);

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
            <h3 className="text-xl font-bold text-slate-800 poppins">Daily Attendance</h3>
            <p className="text-slate-500 font-medium">
               Your Shift: <span className="font-bold text-indigo-600">{currentUser.shift_start_time || '09:00'}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          {!todayRecord?.check_in ? (
            <button 
              onClick={handleCheckIn}
              className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-sign-in-alt"></i>
              Check In
            </button>
          ) : !todayRecord.check_out ? (
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="px-6 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col justify-center">
                 <span className="text-[10px] text-emerald-600 font-bold uppercase">Checked In At</span>
                 <span className="text-emerald-800 font-bold">{displayTime(todayRecord.check_in)}</span>
              </div>
              <button 
                onClick={handleCheckOut}
                className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition flex items-center justify-center gap-2"
              >
                <i className="fas fa-sign-out-alt"></i>
                Check Out
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <div className="px-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl flex flex-col justify-center">
                 <span className="text-[10px] text-slate-500 font-bold uppercase">Shift Completed</span>
                 <span className="text-slate-800 font-bold">Shift Ended</span>
              </div>
              <div className="px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col justify-center text-center">
                 <span className="text-[10px] text-indigo-600 font-bold uppercase">Status</span>
                 <span className="text-indigo-800 font-bold">{todayRecord.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 poppins">Attendance Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-5">Date</th>
                {isAdmin && <th className="px-6 py-5">Employee</th>}
                <th className="px-6 py-5">Check In</th>
                <th className="px-6 py-5">Check Out</th>
                <th className="px-6 py-5">Hours</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.sort((a,b) => b.date.localeCompare(a.date)).map(record => {
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
                
                // Alert logic
                const hoursShort = checkOut && diff < 7.5;

                return (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">{sanitizeDateForSQL(record.date)}</td>
                    {isAdmin && <td className="px-6 py-4 text-xs font-bold text-indigo-600">{record.username}</td>}
                    <td className="px-6 py-4 text-xs text-slate-600">{displayTime(record.check_in)}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{displayTime(record.check_out)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">{diff > 0 ? `${diff.toFixed(1)} hrs` : '-'}</td>
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
                          Shift Hours Not Complete
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModule;
