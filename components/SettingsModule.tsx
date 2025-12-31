
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
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 bg-${formData.primary_color}-50 rounded-2xl flex items-center justify-center text-${formData.primary_color}-600 text-3xl border border-${formData.primary_color}-100`}>
            <i className="fas fa-cog"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 poppins">Application Configuration</h3>
            <p className="text-slate-500 font-medium">Customize branding and visual themes</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Software Identity */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform Identity</h4>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">Software Name</label>
              <input 
                required 
                type="text" 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800" 
                value={formData.software_name} 
                onChange={e => setFormData({...formData, software_name: e.target.value})} 
                placeholder="e.g. SmartStock Pro"
              />
            </div>
          </div>

          {/* Theme Visuals */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visual Styling</h4>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 ml-1">Theme Accent Color</label>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
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
          </div>

          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-start gap-4">
            <i className="fas fa-exclamation-triangle text-amber-500 mt-1"></i>
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              Updating the software name and theme color will affect all system users immediately.
            </p>
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className={`px-10 py-4 bg-${formData.primary_color}-600 hover:bg-${formData.primary_color}-700 text-white rounded-2xl font-bold shadow-xl shadow-${formData.primary_color}-200 transition transform active:scale-95 disabled:opacity-50`}
          >
            {loading ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-save mr-2"></i> Apply System Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsModule;
