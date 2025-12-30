
import React, { useState, useEffect } from 'react';
import { UserRole, Notification } from '../types.ts';
import { apiService } from '../api.ts';

interface SidebarProps {
  userRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  permissions: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ userRole, activeTab, setActiveTab, onLogout, permissions }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = userRole === UserRole.ADMIN;
  
  const hasPermission = (key: string) => {
    if (isAdmin) return true;
    return permissions.includes(key);
  };

  const fetchUnread = async () => {
    try {
      const userStr = localStorage.getItem('smartstock_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const all = await apiService.getNotifications(user.id);
        setUnreadCount(all.filter(n => !n.is_read).length);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); 
    return () => clearInterval(interval);
  }, []);

  const navGroups = [
    {
      title: 'Human Resources',
      items: [
        { id: 'attendance', icon: 'fa-user-clock', label: 'Attendance Hub' },
        { id: 'notifications', icon: 'fa-bell', label: 'Alerts & Activity', badge: unreadCount },
        { id: 'leaves', icon: 'fa-calendar-alt', label: 'Leave Requests' },
        { id: 'employees', icon: 'fa-users', label: 'Staff Directory', permission: 'hr.view' },
        { id: 'departments', icon: 'fa-building', label: 'Departments', permission: 'hr.view' },
        { id: 'user-mgmt', icon: 'fa-user-shield', label: 'User Accounts', permission: 'hr.users' },
      ]
    },
    {
      title: 'Analytics',
      items: [
        { id: 'dashboard', icon: 'fa-chart-line', label: 'Overview', permission: 'analytics.view' },
        { id: 'budgets', icon: 'fa-wallet', label: 'Budget Tracker', permission: 'analytics.financials' },
        { id: 'audit-trail', icon: 'fa-history', label: 'Movement Ledger', permission: 'analytics.logs' },
      ]
    },
    {
      title: 'Inventory Control',
      items: [
        { id: 'inventory', icon: 'fa-boxes', label: 'Hardware Registry', permission: 'inventory.view' },
        { id: 'categories', icon: 'fa-tags', label: 'Asset Categories', permission: 'inventory.view' },
        { id: 'licenses', icon: 'fa-key', label: 'License Compliance', permission: 'inventory.view' },
      ]
    },
    {
      title: 'Procurement & Ops',
      items: [
        { id: 'purchase-history', icon: 'fa-history', label: 'Purchase Ledger', permission: 'inventory.procure' },
        { id: 'requests', icon: 'fa-clipboard-list', label: 'Employee Requests' },
        { id: 'maintenance', icon: 'fa-tools', label: 'Maintenance Hub', permission: 'inventory.edit' },
        { id: 'faulty-reports', icon: 'fa-exclamation-triangle', label: 'Faulty Reports', permission: 'inventory.view' },
      ]
    },
    {
      title: 'Organization',
      items: [
        { id: 'suppliers', icon: 'fa-truck', label: 'Vendor Scorecard', permission: 'inventory.view' },
        { id: 'locations', icon: 'fa-map-marker-alt', label: 'Site Map', permission: 'inventory.view' },
      ]
    }
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-30 shadow-sm hidden lg:flex custom-scrollbar overflow-y-auto">
      <div className="p-6 sticky top-0 bg-white z-10 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-100">
            <i className="fas fa-warehouse"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800 poppins">
            SmartStock<span className="text-indigo-600 italic">.PRO</span>
          </h2>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-6 flex-1">
        {navGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter(i => {
            if (!i.permission) return true;
            return hasPermission(i.permission);
          });
          if (visibleItems.length === 0) return null;
          
          return (
            <div key={groupIdx}>
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{group.title}</p>
              <div className="space-y-1">
                {visibleItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                      activeTab === item.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fas ${item.icon} w-5 text-center ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`}></i>
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === item.id ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto p-4 space-y-3">
        {(isAdmin || hasPermission('system.roles') || hasPermission('analytics.logs')) && (
           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Panel</p>
              {hasPermission('analytics.logs') && (
                <button onClick={() => setActiveTab('system-logs')} className={`w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition ${activeTab === 'system-logs' ? 'ring-2 ring-indigo-500' : ''}`}>
                   <i className="fas fa-shield-alt mr-2"></i> Audit Logs
                </button>
              )}
              {hasPermission('system.roles') && (
                <button onClick={() => setActiveTab('role-mgmt')} className={`w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition ${activeTab === 'role-mgmt' ? 'ring-2 ring-indigo-500' : ''}`}>
                   <i className="fas fa-user-tag mr-2"></i> Role Config
                </button>
              )}
           </div>
        )}
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition font-bold text-sm"
        >
          <i className="fas fa-sign-out-alt w-5"></i>
          <span>Logout Session</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
