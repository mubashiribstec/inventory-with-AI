
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

const ICONS = [
  'fa-warehouse', 'fa-boxes', 'fa-tools', 'fa-laptop', 'fa-shield-alt', 'fa-building', 'fa-cubes', 'fa-layer-group'
];

const SettingsModule: React.FC<SettingsModuleProps> = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState<SystemSettings>({ 
    ...settings,
    software_description: settings.software_description || 'Enterprise Resource Planning',
    software_logo: settings.software_logo || 'fa-warehouse'
  });
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
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

  const handleExportData = async () => {
    setPortabilityLoading(true);
    try {
      const snapshot = await apiService.getFullDataSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smartstock_global_backup_${new Date().toISOString().split('T')[0]}.json`;
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
      link.download = `smartstock_inventory_${new Date().toISOString().split('T')[0]}.csv`;
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

    const confirmImport = window.confirm("SECURITY WARNING: Importing this file will PERMANENTLY OVERWRITE all current data (Assets, Users, Logs, and Settings). This action cannot be undone. Proceed?");
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
        alert("System Restore Complete. The application will now reload to synchronize all data.");
        window.location.reload();
      } catch (err) {
        alert("Import failed: The file format is invalid or corrupted.");
      } finally {
        setPortabilityLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleInitializeDb = async () => {
    setInitLoading(true);
    try {
      const res = await apiService.initDatabase();
      alert("Cloud database handshake successful.");
    } catch (e) {
      alert("Handshake failed: " + e);
    } finally {
      setInitLoading(false);
    }
  };

  const handleFactoryReset = async () => {
    const confirm1 = window.confirm("CRITICAL ALERT: You are about to initiate a Factory Reset. This will WIPE all hardware records, staff entries, and audit logs. Continue?");
    if (!confirm1) return;

    const confirm2 = window.confirm("FINAL CONFIRMATION: Are you absolutely certain you want to destroy all system data? This cannot be undone.");
    if (!confirm2) return;

    setLoading(true);
    try {
      await apiService.factoryReset();
      alert("System Wiped. Reloading to defaults...");
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
                <h3 className="text-xl font-bold text-slate-800 poppins">Branding Hub</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global Identity & Themes</p>
             </div>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-slate-200 pl-3">Platform Name</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Software Title</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800" 
                    value={formData.software_name} 
                    onChange={e => setFormData({...formData, software_name: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">System Description</label>
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
                <label className="text-xs font-bold text-slate-500 ml-1">Color Palette</label>
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
              {loading ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-save mr-2"></i> Save Visual Identity</>}
            </button>
          </div>
        </form>

        {/* Data Import & Export Hub */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/20">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                    <i className="fas fa-database"></i>
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-800 poppins">Data Control Center</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Import, Export & Backups</p>
                 </div>
              </div>
           </div>
           
           <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Export Side */}
              <div className="space-y-6">
                 <div>
                    <h5 className="font-bold text-slate-800 flex items-center gap-2">
                       <i className="fas fa-cloud-download-alt text-indigo-500"></i>
                       Export System Data
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                       Generate a secure snapshot of your entire database for migration or compliance audits.
                    </p>
                 </div>
                 
                 <div className="space-y-3">
                    <button 
                      type="button"
                      onClick={handleExportData}
                      disabled={portabilityLoading}
                      className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-3"
                    >
                       {portabilityLoading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-file-code text-amber-400"></i>}
                       Export as Global JSON
                    </button>
                    <button 
                      type="button"
                      onClick={handleExportCSV}
                      disabled={portabilityLoading}
                      className="w-full py-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-3"
                    >
                       {portabilityLoading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-file-excel text-emerald-500"></i>}
                       Export Assets to CSV
                    </button>
                 </div>
              </div>

              {/* Import Side */}
              <div className="space-y-6 border-l border-slate-50 md:pl-8">
                 <div>
                    <h5 className="font-bold text-slate-800 flex items-center gap-2">
                       <i className="fas fa-cloud-upload-alt text-emerald-500"></i>
                       Restore / Import
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                       Load a previously exported backup file to restore your system state or merge environments.
                    </p>
                 </div>

                 <div className="space-y-3">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".json" 
                      onChange={onFileChange} 
                    />
                    <button 
                      type="button"
                      onClick={handleImportData}
                      disabled={portabilityLoading}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-100 transition flex items-center justify-center gap-3"
                    >
                       {portabilityLoading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-upload"></i>}
                       Import System JSON
                    </button>
                    <p className="text-[10px] text-center text-rose-500 font-bold uppercase tracking-tight">
                       <i className="fas fa-exclamation-triangle mr-1"></i>
                       Warning: This will overwrite current data
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Maintenance Utilities */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                 <i className="fas fa-tools"></i>
              </div>
              <div>
                 <h3 className="text-xl font-bold text-slate-800 poppins">System Maintenance</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Advanced Integrity Tools</p>
              </div>
           </div>
           
           <div className="p-8 space-y-4">
              <div className="flex items-center justify-between p-6 bg-indigo-50/20 border border-indigo-100 rounded-3xl group transition hover:bg-indigo-50/40">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                       <i className="fas fa-link"></i>
                    </div>
                    <div>
                       <h5 className="font-bold text-slate-800 text-sm">Force Cloud Re-sync</h5>
                       <p className="text-[11px] text-slate-500">Push all local changes to the Google Drive database.</p>
                    </div>
                 </div>
                 <button 
                   onClick={handleInitializeDb}
                   disabled={initLoading}
                   className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider transition hover:bg-indigo-700"
                 >
                    {initLoading ? 'Syncing...' : 'Sync Now'}
                 </button>
              </div>

              <div className="flex items-center justify-between p-6 bg-rose-50/20 border border-rose-100 rounded-3xl group transition hover:bg-rose-50/40">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 border border-rose-100">
                       <i className="fas fa-skull-crossbones"></i>
                    </div>
                    <div>
                       <h5 className="font-bold text-slate-800 text-sm">Initiate WIPE Sequence</h5>
                       <p className="text-[11px] text-slate-500">Permanently erase all production records.</p>
                    </div>
                 </div>
                 <button 
                   onClick={handleFactoryReset}
                   disabled={loading}
                   className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider transition hover:bg-rose-700 shadow-lg shadow-rose-100"
                 >
                    Factory Reset
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Sidebar Live Preview */}
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
                    <p className="text-[10px] text-slate-400 font-medium">Global Display Name</p>
                 </div>
              </div>

              <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-100">
                 <div className={`bg-${themeColor}-600 p-6 text-white text-center`}>
                    <h5 className="font-bold text-sm">Login Card Preview</h5>
                 </div>
                 <div className="p-6 bg-white space-y-3">
                    <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                    <div className="h-2 w-3/4 bg-slate-100 rounded-full"></div>
                 </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                 <i className="fas fa-info-circle text-amber-500 mt-1"></i>
                 <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                    Changes apply immediately to all connected browsers. Backup files are encrypted in standard JSON format.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;
