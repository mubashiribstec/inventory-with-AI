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

  const themeColor = formData.primary_color || 'indigo';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Configuration Form */}
      <div className="lg:col-span-2 space-y-8">
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
            {/* Identity Group */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-slate-200 pl-3">Identity</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Software Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800" 
                    value={formData.software_name} 
                    onChange={e => setFormData({...formData, software_name: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1">Slogan / Description</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-600" 
                    value={formData.software_description} 
                    onChange={e => setFormData({...formData, software_description: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* Visuals Group */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-slate-200 pl-3">Visual Palette</h4>
              
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 ml-1">Theme Accent</label>
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

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 ml-1">Platform Logo Icon</label>
                <div className="flex flex-wrap gap-3">
                  {ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({...formData, software_logo: icon})}
                      className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition ${formData.software_logo === icon ? `bg-${themeColor}-600 border-${themeColor}-600 text-white` : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'}`}
                    >
                      <i className={`fas ${icon}`}></i>
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
              {loading ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-save mr-2"></i> Commit Brand Changes</>}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Sidebar */}
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm sticky top-10">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Live Branding Preview</h4>
           
           <div className="space-y-10">
              {/* Sidebar Preview */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Sidebar Header</p>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                   <div className={`w-8 h-8 bg-${themeColor}-600 rounded-lg flex items-center justify-center text-white text-xs`}>
                      <i className={`fas ${formData.software_logo}`}></i>
                   </div>
                   <div className="font-bold text-sm text-slate-800 poppins truncate">
                      {formData.software_name.split(' ')[0]}<span className={`text-${themeColor}-600 italic`}>.{formData.software_name.split(' ').slice(1).join('') || 'IMS'}</span>
                   </div>
                </div>
              </div>

              {/* Login Preview Card */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Login Screen Brand</p>
                <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-lg shadow-slate-200/50">
                   <div className={`bg-${themeColor}-600 p-6 text-center text-white`}>
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-md">
                         <i className={`fas ${formData.software_logo} text-xl`}></i>
                      </div>
                      <h5 className="font-bold text-sm">{formData.software_name}</h5>
                      <p className={`text-[10px] text-${themeColor}-100 opacity-80 mt-1`}>{formData.software_description}</p>
                   </div>
                   <div className="p-4 bg-white flex flex-col gap-2">
                      <div className="h-6 w-full bg-slate-100 rounded-lg animate-pulse"></div>
                      <div className="h-6 w-3/4 bg-slate-100 rounded-lg animate-pulse"></div>
                   </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                 <i className="fas fa-magic text-indigo-400 mt-1"></i>
                 <p className="text-[11px] text-indigo-600 leading-relaxed font-medium">
                    Changes apply globally across the platform. Browser tab title and metadata will sync immediately.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;
