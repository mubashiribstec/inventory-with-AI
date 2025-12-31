import React, { useState } from 'react';
import { apiService } from '../api.ts';
import { User } from '../types.ts';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const user = await apiService.login(username, password);
      onLogin(user);
    } catch (err: any) {
      if (err.message.includes('Unreachable') || err.message.includes('fetch')) {
        setIsOffline(true);
        setError('Backend is offline. You can still test using Local Demo Mode.');
      } else {
        setError('Invalid username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      // Force local login with default admin
      const user = await apiService.login('admin', 'admin123');
      onLogin(user);
    } catch (e) {
      setError("Demo Mode initialization failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    setError('');
    setSuccess('');
    setInitLoading(true);
    try {
      const result = await apiService.initDatabase();
      if (result.success) {
        setSuccess('Local system initialized! Use admin / admin123');
        setIsOffline(false);
      }
    } catch (err: any) {
      setError('Initialization failed: ' + err.message);
    } finally {
      setInitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden animate-fadeIn border border-slate-100">
        <div className="bg-indigo-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
              <i className="fas fa-warehouse text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold poppins">SmartStock Pro</h2>
            <p className="text-indigo-100 text-sm mt-1">Enterprise Resource Planning</p>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          {error && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn border ${isOffline ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
              <i className={`fas ${isOffline ? 'fa-wifi-slash' : 'fa-exclamation-circle'} text-lg`}></i>
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-xs font-bold flex items-center gap-3 animate-fadeIn">
              <i className="fas fa-check-circle text-lg"></i>
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="text" 
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="password" 
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="admin123"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <i className="fas fa-spinner animate-spin"></i> : <span>Connect & Sign In</span>}
              </button>

              {isOffline && (
                <button 
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold transition shadow-lg shadow-amber-100 flex items-center justify-center gap-3"
                >
                  <i className="fas fa-play"></i>
                  Run Local Demo Mode
                </button>
              )}
            </div>
          </form>

          <div className="relative py-2 flex items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-300 font-bold uppercase tracking-widest">Database Maintenance</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button 
            type="button"
            onClick={handleInitialize}
            disabled={initLoading || loading}
            className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              success 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            } disabled:opacity-50`}
          >
            <i className={`fas ${initLoading ? 'fa-sync animate-spin' : (success ? 'fa-check' : 'fa-database')}`}></i>
            <span>{success ? 'Local DB Ready' : 'Initialize Local Storage'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;