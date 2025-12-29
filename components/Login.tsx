
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
      setError(err.message.includes('401') ? 'Invalid username or password' : 'Connection error. Is the database initialized?');
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
        setSuccess('Database initialized! You can now log in with default credentials.');
      }
    } catch (err: any) {
      setError('Initialization failed: ' + err.message);
    } finally {
      setInitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden animate-fadeIn">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <i className="fas fa-warehouse text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold poppins">SmartStock Pro</h2>
          <p className="text-indigo-100 text-sm mt-1">Enterprise Resource Planning</p>
        </div>
        
        <div className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold flex items-center gap-3">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-xs font-bold flex items-center gap-3">
              <i className="fas fa-check-circle"></i>
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="text" 
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="Enter username"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || initLoading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <i className="fas fa-spinner animate-spin"></i>
              ) : (
                <>
                  <span>Sign In</span>
                  <i className="fas fa-arrow-right text-xs"></i>
                </>
              )}
            </button>
          </form>

          <div className="relative py-2 flex items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-300 font-bold uppercase tracking-widest">First time setup?</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button 
            type="button"
            onClick={handleInitialize}
            disabled={initLoading || loading}
            className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {initLoading ? (
              <i className="fas fa-cog animate-spin"></i>
            ) : (
              <i className="fas fa-database"></i>
            )}
            <span>Initialize System Database</span>
          </button>
          
          <div className="pt-2 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              Default Admin: <span className="text-indigo-400">admin / admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
