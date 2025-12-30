
import React, { useState } from 'react';
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
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 bg-${formData.primary_color}-50 dark:bg-${formData.primary_color}-900/20 rounded-2xl flex items-center justify-center text-${formData.primary_color}-600 dark:text-${formData.primary_color}-400 text-3xl border border-${formData.primary_color}-100 dark:border-${formData.primary_color}-800`}>
            <i className="fas fa-cog"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white poppins">Application Configuration</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Customize branding, visual themes, and system behavior</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Software Identity */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Platform Identity</h4>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Software Name</label>
              <input 
                required 
                type="text" 
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 dark:text-white" 
                value={formData.software_name} 
                onChange={e => setFormData({...formData, software_name: e.target.value})} 
                placeholder="e.g. SmartStock Pro"
              />
            </div>
          </div>

          {/* Theme Visuals */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Visual Styling</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Theme Accent Color</label>
                  <div className="grid grid-cols-4 gap-3">
                    {COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormData({...formData, primary_color: c.value})}
                        className={`w-full h-12 rounded-xl transition border-2 flex items-center justify-center bg-${c.value}-500 ${formData.primary_color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        title={c.name}
                      >
                        {formData.primary_color === c.value && <i className="fas fa-check text-white text-sm"></i>}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Appearance Mode</label>
                  <div className="flex p-1 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, dark_mode: false})}
                      className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition ${!formData.dark_mode ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                    >
                      <i className="fas fa-sun"></i> Light Mode
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, dark_mode: true})}
                      className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition ${formData.dark_mode ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                    >
                      <i className="fas fa-moon"></i> Dark Mode
                    </button>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-4">
            <i className="fas fa-exclamation-triangle text-amber-500 mt-1"></i>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
              Updating the software name and theme color will affect all system users immediately. Dark mode preference is also applied globally as a system default.
            </p>
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className={`px-10 py-4 bg-${formData.primary_color}-600 hover:bg-${formData.primary_color}-700 text-white rounded-2xl font-bold shadow-xl shadow-${formData.primary_color}-200 dark:shadow-none transition transform active:scale-95 disabled:opacity-50`}
          >
            {loading ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-save mr-2"></i> Apply System Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsModule;
