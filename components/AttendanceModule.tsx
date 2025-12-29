
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

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to format date for MariaDB DATETIME (YYYY-MM-DD HH:MM:SS)
  const formatForSQL = (date: Date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const all = await apiService.getAttendance();
      setRecords(all);
      
      const mine = all.find(r => r.user_id === currentUser.id && r.date.startsWith(todayStr));
      setTodayRecord(mine || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentUser.id]);

  const handleCheckIn = async () => {
    const now = new Date();
    const checkInTime = formatForSQL(now);
    
    // Status Logic: Late after 09:00 AM
    const isLate = now.getHours() >= 9 && now.getMinutes() > 0;
    
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
    
    const record: AttendanceRecord = {
      ...todayRecord,
      check_out: formatForSQL(new Date())
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
            <p className="text-slate-500 font-medium">Mark your presence for {new Date().toLocaleDateString()}</p>
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
                 <span className="text-emerald-800 font-bold">{new Date(todayRecord.check_in.replace(' ', 'T') + 'Z').toLocaleTimeString()}</span>
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
                 <span className="text-[10px] text-slate-500 font-bold uppercase">Work Hours Complete</span>
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
          <h3 className="font-bold text-slate-800 poppins">Attendance Ledger {isAdmin ? '(All Staff)' : '(Personal)'}</h3>
          <div className="flex gap-2">
             <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><i className="fas fa-filter"></i></button>
             <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><i className="fas fa-download"></i></button>
          </div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.sort((a,b) => b.date.localeCompare(a.date)).map(record => {
                const parseDate = (dStr: string | null) => dStr ? new Date(dStr.replace(' ', 'T') + 'Z') : null;
                const checkIn = parseDate(record.check_in);
                const checkOut = parseDate(record.check_out);
                const diff = checkIn && checkOut ? (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60) : 0;
                
                return (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">{record.date}</td>
                    {isAdmin && <td className="px-6 py-4 text-xs font-bold text-indigo-600">{record.username}</td>}
                    <td className="px-6 py-4 text-xs text-slate-600">{checkIn ? checkIn.toLocaleTimeString() : '-'}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{checkOut ? checkOut.toLocaleTimeString() : '-'}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">{diff > 0 ? `${diff.toFixed(1)} hrs` : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        record.status === 'LATE' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-20 text-center text-slate-400">
                    <i className="fas fa-calendar-times text-4xl mb-4 opacity-20"></i>
                    <p className="text-sm font-bold uppercase tracking-widest">No records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModule;
