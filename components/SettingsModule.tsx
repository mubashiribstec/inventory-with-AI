
import React, { useState, useRef } from 'react';
import { SystemSettings } from '../types.ts';
import { apiService } from '../api.ts';

interface SettingsModuleProps {
  settings: any;
  onUpdate: (settings: any) => void;
  onNavigate?: (tab: string) => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ settings, onUpdate, onNavigate }) => {
  const [formData, setFormData] = useState<any>({ ...settings });
  const [newKey, setNewKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.updateSettings(formData);
      onUpdate(formData);
      alert("Branding updated.");
    } catch (err: any) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const handleApplyLicense = async () => {
    if (!newKey) return;
    setLoading(true);
    try {
      await apiService.updateSettings({ ...settings, license_key: newKey });
      const fresh = await apiService.getSettings();
      onUpdate(fresh);
      setFormData(fresh);
      setNewKey('');
      alert("New Yearly License applied successfully!");
    } catch (err: any) {
      alert("Invalid License Key: Signature Verification Failed.");
    } finally { setLoading(false); }
  };

  const themeColor = formData.primary_color || 'indigo';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn max-w-6xl mx-auto pb-20 poppins">
      <div className="lg:col-span-2 space-y-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-4">
             <div className={`w-12 h-12 bg-${themeColor}-50 rounded-2xl flex items-center justify-center text-${themeColor}-600 border border-${themeColor}-100`}>
                <i className="fas fa-paint-brush"></i>
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-800">Software Identity</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global Branding & UI Themes</p>
             </div>
          </div>
          <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Platform Name</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.software_name} onChange={e => setFormData({...formData, software_name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Theme Color</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl" value={formData.primary_color} onChange={e => setFormData({...formData, primary_color: e.target.value})}>
                     <option value="indigo">Indigo</option>
                     <option value="rose">Rose</option>
                     <option value="emerald">Emerald</option>
                     <option value="blue">Blue</option>
                  </select>
                </div>
              </div>
          </div>
          <div className="p-8 border-t border-slate-50 flex justify-end">
            <button type="submit" disabled={loading} className={`px-10 py-4 bg-${themeColor}-600 text-white rounded-2xl font-bold shadow-lg shadow-${themeColor}-100 transition disabled:opacity-50`}>
              Save Identity
            </button>
          </div>
        </form>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-indigo-50/20">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                 <i className="fas fa-fingerprint"></i>
              </div>
              <div>
                 <h3 className="text-xl font-bold text-slate-800">Secure Licensing</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Yearly Access Verification</p>
              </div>
           </div>
           <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System ID</label>
                    <p className="font-mono font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 select-all mt-2">{settings.system_id}</p>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Until</label>
                    <p className="font-bold text-slate-700 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mt-2">{settings.license_expiry || 'Unknown'}</p>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                 <label className="text-xs font-bold text-slate-500">Apply New Signed License Key</label>
                 <textarea 
                   rows={4}
                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                   placeholder="Paste new signed key here..."
                   value={newKey}
                   onChange={e => setNewKey(e.target.value)}
                 />
                 <button 
                   onClick={handleApplyLicense}
                   disabled={loading || !newKey}
                   className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                 >
                   Verify & Activate Key
                 </button>
              </div>
           </div>
        </div>
      </div>
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-user-tag"></i>
                </div>
                <div>
                    <h4 className="font-bold text-slate-800">Access Control</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Permissions Hub</p>
                </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Manage organizational roles, custom permission levels, and staff access scopes from the dedicated Roles module.
            </p>
            <button 
                onClick={() => onNavigate && onNavigate('roles')}
                className="w-full py-3 bg-slate-50 text-indigo-600 rounded-2xl font-bold text-xs hover:bg-indigo-50 transition border border-indigo-100"
            >
                Configure Global Roles
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;
