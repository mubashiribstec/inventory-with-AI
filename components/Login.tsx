
import React, { useState } from 'react';
import { apiService } from '../api.ts';
import { User } from '../types.ts';

interface LoginProps {
  onLogin: (user: User) => void;
  softwareName: string;
  themeColor?: string;
  logoIcon?: string;
  description?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, softwareName, themeColor = 'indigo', logoIcon = 'fa-warehouse', description = 'Enterprise Resource Planning' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [initSuccess, setInitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await apiService.login(username, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitDatabase = async (force = false) => {
    if (force && !window.confirm("CRITICAL: This will DELETE all existing data and recreate the database. Are you sure?")) {
      return;
    }
    setError('');
    setInitLoading(true);
    setInitSuccess(false);
    try {
      const result = await apiService.initDatabase(force);
      if (result.success) {
        setInitSuccess(true);
        setTimeout(() => setInitSuccess(false), 5000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to initialize database.");
    } finally {
      setInitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden animate-fadeIn border border-slate-100">
        <div className={`bg-${themeColor}-600 p-10 text-white text-center relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
              <i className={`fas ${logoIcon} text-3xl`}></i>
            </div>
            <h2 className="text-2xl font-bold poppins">{softwareName}</h2>
            <p className={`text-${themeColor}-100 text-sm mt-1 opacity-80`}>{description}</p>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl text-xs font-bold flex flex-col gap-2 animate-fadeIn border bg-rose-50 border-rose-100 text-rose-600">
              <div className="flex items-center gap-3">
                <i className="fas fa-exclamation-circle text-lg"></i>
                <span className="uppercase tracking-widest font-black">System Alert</span>
              </div>
              <p className="pl-8 leading-relaxed font-medium">{error}</p>
            </div>
          )}

          {initSuccess && (
            <div className="p-4 rounded-2xl text-xs font-bold flex flex-col gap-2 animate-fadeIn border bg-emerald-50 border-emerald-100 text-emerald-600">
              <div className="flex items-center gap-3">
                <i className="fas fa-check-circle text-lg"></i>
                <span className="uppercase tracking-widest font-black">Success</span>
              </div>
              <p className="pl-8 leading-relaxed font-medium">Database system is ready.</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Username</label>
              <div className="relative">
                <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="text" 
                  required
                  className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-${themeColor}-500 outline-none transition font-medium`}
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="password" 
                  required
                  className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-${themeColor}-500 outline-none transition font-medium`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || initLoading}
              className={`w-full py-4 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white rounded-2xl font-bold transition shadow-lg shadow-${themeColor}-100 flex items-center justify-center gap-3 disabled:opacity-50`}
            >
              {loading ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-sign-in-alt"></i> <span>Sign In to Dashboard</span></>}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => handleInitDatabase(false)}
              disabled={loading || initLoading}
              className="py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold text-[10px] hover:bg-slate-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {initLoading ? <i className="fas fa-spinner animate-spin text-[10px]"></i> : <i className="fas fa-database text-slate-300"></i>}
              <span>Check DB</span>
            </button>
            <button 
              type="button"
              onClick={() => handleInitDatabase(true)}
              disabled={loading || initLoading}
              className="py-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-bold text-[10px] hover:bg-rose-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <i className="fas fa-trash-alt opacity-50"></i>
              <span>Wipe & Reset</span>
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">
              Authorized Personnel Only <br/>
              Default Access: admin / admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
