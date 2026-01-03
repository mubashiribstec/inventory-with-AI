
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole } from '../types.ts';
import { apiService } from '../api.ts';

interface SidebarProps {
  userRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  permissions: string[];
  appName?: string;
  themeColor?: string;
  logoIcon?: string;
  licenseExpiry?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  userRole, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  permissions, 
  appName = 'Registry', 
  themeColor = 'indigo',
  logoIcon = 'fa-warehouse',
  licenseExpiry
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const isAdmin = userRole === UserRole.ADMIN;
  
  const hasPermission = (key: string) => {
    if (isAdmin) return true;
    return permissions.includes(key);
  };

  const licenseStatus = useMemo(() => {
    if (!licenseExpiry) return { text: 'Unknown', color: 'slate' };
    const expiry = new Date(licenseExpiry);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return { text: 'Expired', color: 'rose' };
    if (diffDays < 30) return { text: `${diffDays}d Left`, color: 'amber' };
    return { text: 'Active', color: 'emerald' };
  }, [licenseExpiry]);

  const fetchUnread = async () => {
    try {
      const userStr = localStorage.getItem('smartstock_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const all = await apiService.getNotifications(user.id);
        setUnreadCount(all.filter(n => !n.is_read).length);
      }
    } catch (e) { }
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
        { id: 'attendance', icon: 'fa-user-clock', label: 'Attendance' },
        { id: 'notifications', icon: 'fa-bell', label: 'Alerts', badge: unreadCount },
        { id: 'leaves', icon: 'fa-calendar-alt', label: 'Leaves' },
        { id: 'salaries', icon: 'fa-file-invoice-dollar', label: 'Payroll', permission: 'hr.salaries' },
        { id: 'employees', icon: 'fa-users-cog', label: 'Staff Directory', permission: 'hr.view' },
        { id: 'departments', icon: 'fa-sitemap', label: 'Departments', permission: 'hr.view' },
        { id: 'user-mgmt', icon: 'fa-user-shield', label: 'Accounts', permission: 'hr.users' },
        { id: 'roles', icon: 'fa-user-tag', label: 'Roles & Perms', permission: 'hr.users' },
      ]
    },
    {
      title: 'Analytics',
      items: [
        { id: 'dashboard', icon: 'fa-chart-pie', label: 'Insights', permission: 'analytics.view' },
        { id: 'budgets', icon: 'fa-wallet', label: 'Budgets', permission: 'analytics.financials' },
        { id: 'audit-trail', icon: 'fa-stream', label: 'Audit Logs', permission: 'analytics.logs' },
      ]
    },
    {
      title: 'Inventory',
      items: [
        { id: 'inventory', icon: 'fa-box-open', label: 'Registry', permission: 'inventory.view' },
        { id: 'maintenance', icon: 'fa-tools', label: 'Maintenance', permission: 'inventory.edit' },
        { id: 'licenses', icon: 'fa-key', label: 'Licenses', permission: 'inventory.view' },
        { id: 'suppliers', icon: 'fa-truck', label: 'Suppliers', permission: 'inventory.view' },
        { id: 'locations', icon: 'fa-map-marker-alt', label: 'Locations', permission: 'inventory.view' },
      ]
    }
  ];

  const softwareNameParts = appName.split(' ');
  const mainName = softwareNameParts.length > 1 ? softwareNameParts.slice(0, -1).join(' ') : appName;
  const suffix = softwareNameParts.length > 1 ? softwareNameParts[softwareNameParts.length - 1] : '';

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-30 shadow-sm hidden lg:flex custom-scrollbar overflow-y-auto poppins">
      <div className="p-6 sticky top-0 bg-white z-10 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-${themeColor}-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-${themeColor}-100`}>
            <i className={`fas ${logoIcon}`}></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800 poppins">
            {mainName}{suffix && <span className={`text-${themeColor}-600`}>.{suffix}</span>}
          </h2>
        </div>
      </div>

      <div className="px-3 pb-6 space-y-5 flex-1">
        {navGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter(i => !i.permission || hasPermission(i.permission));
          if (visibleItems.length === 0) return null;
          
          return (
            <div key={groupIdx}>
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 opacity-70">{group.title}</p>
              <div className="space-y-0.5">
                {visibleItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all duration-200 group ${
                      activeTab === item.id 
                        ? `bg-${themeColor}-600 text-white shadow-md shadow-${themeColor}-100` 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fas ${item.icon} w-5 text-center ${activeTab === item.id ? 'text-white' : `text-slate-400 group-hover:text-${themeColor}-600`}`}></i>
                      <span className="font-semibold text-sm">{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'}`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 space-y-3 mt-auto">
        <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Yearly Access</span>
              <span className={`text-[10px] font-bold text-${licenseStatus.color}-600`}>{licenseStatus.text}</span>
           </div>
           <i className={`fas fa-check-circle text-${licenseStatus.color}-500 text-sm`}></i>
        </div>

        {(isAdmin || hasPermission('system.settings')) && (
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeTab === 'settings' ? `bg-slate-800 text-white` : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <i className="fas fa-cog w-5"></i>
            <span className="text-sm font-semibold">Settings</span>
          </button>
        )}
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition font-bold text-sm"
        >
          <i className="fas fa-sign-out-alt w-5"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
