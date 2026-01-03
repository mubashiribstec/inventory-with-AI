
import React, { useState, useRef } from 'react';
import { SystemSettings } from '../types.ts';
import { apiService } from '../api.ts';

interface SettingsModuleProps {
  settings: SystemSettings;
  onUpdate: (settings: SystemSettings) => void;
}

const COLORS = [
  { name: 'Indigo', value: 'indigo' },
  { name: 'Rose', value: 'rose' },
  { name: 'Amber', value: 'amber' },
  { name: 'Emerald', value: 'emerald' },
  { name: 'Blue', value: 'blue' },
  { name: 'Violet', value: 'violet' },
  { name: 'Cyan', value: 'cyan' },
  { name: 'Slate', value: 'slate' },
];

const SettingsModule: React.FC<SettingsModuleProps> = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState<SystemSettings>({ 
    ...settings,
    software_description: settings.software_description || 'Enterprise Resource Planning',
    software_logo: settings.software_logo || 'fa-warehouse'
  });
  const [loading, setLoading] = useState(false);
  const [portabilityLoading, setPortabilityLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.updateSettings(formData);
      onUpdate(formData);
      alert("System settings updated successfully!");
    } catch (err) {
      alert("Error saving settings: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewLicense = async () => {
    const newExpiry = window.prompt("Enter new expiry date (YYYY-MM-DD):", formData.license_expiry || '');
    if (newExpiry && /^\d{4}-\d{2}-\d{2}$/.test(newExpiry)) {
       const updated = { ...formData, license_expiry: newExpiry };
       setLoading(true);
       try {
         await apiService.updateSettings(updated);
         onUpdate(updated);
         setFormData(updated);
         alert("Software license successfully extended.");
       } catch (e) { alert(e); }
       finally { setLoading(false); }
    } else if (newExpiry) {
       alert("Invalid date format. Use YYYY-MM-DD.");
    }
  };

  const handleExportData = async () => {
    setPortabilityLoading(true);
    try {
      const snapshot = await apiService.getFullDataSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smartstock_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed: " + e);
    } finally {
      setPortabilityLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setPortabilityLoading(true);
    try {
      const csv = await apiService.exportInventoryToCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory_registry_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("CSV Export failed: " + e);
    } finally {
      setPortabilityLoading(false);
    }
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmImport = window.confirm("SECURITY WARNING: This will overwrite your current BROWSER cache with data from the file. Server data is not automatically affected by this action. Proceed?");
    if (!confirmImport) {
        e.target.value = '';
        return;
    }

    setPortabilityLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await apiService.importFullDataSnapshot(json);
        alert("Restoration Complete. Reloading environment.");
        window.location.reload();
      } catch (err) {
        alert("Import failed: The file format is invalid.");
      } finally {
        setPortabilityLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = async () => {
    const confirm1 = window.confirm("CRITICAL: This will PERMANENTLY ERASE the server database and all inventory records. Are you authorized to proceed?");
    if (!confirm1) return;

    const confirm2 = window.confirm("FINAL WARNING: All data in MariaDB will be destroyed. This is IRREVERSIBLE.");
    if (!confirm2) return;

    setLoading(true);
    try {
      await apiService.factoryReset();
      alert("System Wiped. Reloading...");
      window.location.reload();
    } catch (err) {
      alert("Reset failed: " + err);
      setLoading(false);
    }
  };

  const themeColor = formData.primary_color || 'indigo';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn max-w-6xl mx-auto pb-20">
      <div className="lg:col-span-2 space-y-8">
        {/* Identity & Branding */}
        <form onSubmit={handleSubmit} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-4">
             <div className={`w-12 h-12 bg-${themeColor}-50 rounded-2xl flex items-center justify-center text-${themeColor}-600 border border-${themeColor}-100`}>
                <i className="fas fa-sliders-h"></i>
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-800 poppins">Software Identity</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global Branding & UI Themes</p>
             </div>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-slate-200 pl-3">Nomenclature</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Platform Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800" 
                    value={formData.software_name} 
                    onChange={e => setFormData({...formData, software_name: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Slogan / Descriptor</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-600" 
                    value={formData.software_description} 
                    onChange={e => setFormData({...formData, software_description: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-slate-200 pl-3">Visual Style</h4>
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 ml-1">Core Accent Color</label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData({...formData, primary_color: c.value})}
                      className={`w-full h-12 rounded-xl transition border-2 flex items-center justify-center bg-${c.value}-500 ${formData.primary_color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      {formData.primary_color === c.value && <i className="fas fa-check text-white text-sm"></i>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className={`px-10 py-4 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white rounded-2xl font-bold shadow-xl shadow-${themeColor}-100 transition transform active:scale-95 disabled:opacity-50`}
            >
              {loading ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-save mr-2"></i> Update Platform Identity</>}
            </button>
          </div>
        </form>

        {/* Software Licensing Section */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-indigo-50/20">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                 <i className="fas fa-key"></i>
              </div>
              <div>
                 <h3 className="text-xl font-bold text-slate-800 poppins">Software Licensing</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Yearly Subscription Management</p>
              </div>
           </div>
           
           <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System License Key</label>
                    <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl">
                       <i className="fas fa-fingerprint text-slate-300"></i>
                       <span className="font-mono font-bold text-slate-700">{formData.license_key || 'UNREGISTERED'}</span>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yearly Expiry Date</label>
                    <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl">
                       <i className="fas fa-calendar-check text-slate-300"></i>
                       <span className="font-bold text-slate-700">{formData.license_expiry || 'Not Set'}</span>
                    </div>
                 </div>
              </div>
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                 <i className="fas fa-info-circle text-indigo-500 mt-1"></i>
                 <div className="flex-1">
                   <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                     This software is currently on a yearly license plan. Access will be automatically restricted if the license is not renewed before the expiry date.
                   </p>
                   <button 
                     onClick={handleRenewLicense}
                     className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition"
                   >
                     Renew / Update License
                   </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Portability */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-sm border border-slate-100">
                    <i className="fas fa-file-export"></i>
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-800 poppins">Data Management</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Backup & Portability Tools</p>
                 </div>
              </div>
           </div>
           
           <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                 <div>
                    <h5 className="font-bold text-slate-800">Export Registry</h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                       Generate snapshots of your current inventory and user data.
                    </p>
                 </div>
                 <div className="space-y-3">
                    <button 
                      type="button"
                      onClick={handleExportData}
                      disabled={portabilityLoading}
                      className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-3"
                    >
                       <i className="fas fa-file-code text-amber-400"></i>
                       Export Global JSON
                    </button>
                    <button 
                      type="button"
                      onClick={handleExportCSV}
                      disabled={portabilityLoading}
                      className="w-full py-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-3"
                    >
                       <i className="fas fa-file-excel text-emerald-500"></i>
                       Export Assets to CSV
                    </button>
                 </div>
              </div>

              <div className="space-y-6 border-l border-slate-50 md:pl-8">
                 <div>
                    <h5 className="font-bold text-slate-800">Import / Restore</h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                       Migrate browser sessions or restore from a JSON snapshot.
                    </p>
                 </div>
                 <div className="space-y-3">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={onFileChange} />
                    <button 
                      type="button"
                      onClick={handleImportData}
                      disabled={portabilityLoading}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 transition flex items-center justify-center gap-3"
                    >
                       <i className="fas fa-upload"></i>
                       Import Snapshot
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100 bg-rose-50/20">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
                    <i className="fas fa-exclamation-triangle"></i>
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-800 poppins">Danger Zone</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Irreversible System Operations</p>
                 </div>
              </div>
           </div>
           
           <div className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between p-6 border border-rose-100 rounded-3xl group transition hover:bg-rose-50/30">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 border border-rose-100 shadow-sm">
                       <i className="fas fa-radiation"></i>
                    </div>
                    <div>
                       <h5 className="font-bold text-slate-800 text-sm uppercase">Full System Factory Reset</h5>
                       <p className="text-[11px] text-slate-500">Destroys all server records and resets to default credentials.</p>
                    </div>
                 </div>
                 <button 
                   onClick={handleFactoryReset}
                   disabled={loading}
                   className="mt-4 md:mt-0 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider transition hover:bg-rose-700 shadow-lg shadow-rose-100"
                 >
                    Execute Reset
                 </button>
              </div>
           </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm sticky top-10">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Live Branding Preview</h4>
           <div className="space-y-8">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                 <div className={`w-10 h-10 bg-${themeColor}-600 rounded-xl flex items-center justify-center text-white`}>
                    <i className={`fas ${formData.software_logo || 'fa-warehouse'}`}></i>
                 </div>
                 <div>
                    <p className="font-bold text-sm text-slate-800">{formData.software_name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Enterprise Display Name</p>
                 </div>
              </div>
              <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-100">
                 <div className={`bg-${themeColor}-600 p-6 text-white text-center`}>
                    <h5 className="font-bold text-sm">Dashboard Theme</h5>
                 </div>
                 <div className="p-6 bg-white space-y-3">
                    <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                    <div className="h-2 w-3/4 bg-slate-100 rounded-full"></div>
                 </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                 <i className="fas fa-server text-blue-500 mt-1"></i>
                 <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                    This system is operating on a MariaDB backend. Database schema is strictly enforced.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;
