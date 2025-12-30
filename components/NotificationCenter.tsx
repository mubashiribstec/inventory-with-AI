
import React, { useState, useEffect } from 'react';
import { Notification, User, UserRole } from '../types.ts';
import { apiService } from '../api.ts';

interface NotificationCenterProps {
  currentUser: User;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ currentUser }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiService.getNotifications(currentUser.id);
      setNotifications(data);
      
      // Auto-read unread notifications upon viewing
      const unreadIds = data.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) {
        await apiService.markNotificationsAsRead(unreadIds);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentUser.id]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ATTENDANCE': return 'fa-clock text-indigo-500';
      case 'LEAVE': return 'fa-calendar-alt text-emerald-500';
      case 'REQUEST': return 'fa-clipboard-list text-amber-500';
      default: return 'fa-info-circle text-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 text-3xl border border-rose-100">
            <i className="fas fa-bell"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 poppins">Notification Center</h3>
            <p className="text-slate-500 font-medium">Real-time alerts for your team and organizational changes</p>
          </div>
        </div>
        <button 
          onClick={fetchNotifications}
          className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition border border-slate-200"
        >
          <i className="fas fa-sync-alt mr-2"></i> Refresh Alerts
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Activity Feed</h4>
        </div>
        <div className="divide-y divide-slate-50">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <div key={notif.id} className={`p-6 flex items-start gap-4 transition hover:bg-slate-50 ${!notif.is_read ? 'bg-indigo-50/20' : ''}`}>
                <div className={`w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-sm`}>
                  <i className={`fas ${getIcon(notif.type)}`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-tighter">{notif.sender_name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{new Date(notif.timestamp).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{notif.message}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-400 uppercase">{notif.type}</span>
                    {!notif.is_read && <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-3xl">
                <i className="fas fa-check-double"></i>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">All caught up!</p>
                <p className="text-xs text-slate-300">No new alerts found in your activity feed.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
