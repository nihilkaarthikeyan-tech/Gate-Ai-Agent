import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, User, UserPlus, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const AuthPage: React.FC = () => {
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      setAuth(res.data.user, res.data.token);
      navigate('/');
    } catch (err: any) {
      setLoginError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);
    try {
      const res = await api.post('/auth/register', { name: regName, email: regEmail, password: regPassword });
      setAuth(res.data.user, res.data.token);
      navigate('/');
    } catch (err: any) {
      setRegError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] py-12 px-6 relative overflow-y-auto font-sans flex flex-col items-center">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex w-16 h-16 premium-gradient rounded-2xl items-center justify-center glow-primary mb-2 shadow-2xl">
            <Sparkles className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight font-heading">
              GATE <span className="premium-text-gradient">Agent</span>
            </h1>
            <p className="text-slate-400 font-medium">Your AI-powered path to excellence.</p>
          </div>
        </div>

        {/* Login Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-[1px] flex-1 bg-white/5"></div>
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Returning User</h2>
            <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>

          <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-white mb-2">
              <LogIn size={20} className="text-violet-400" />
              <h3 className="text-xl font-bold">Sign In</h3>
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] font-bold">!</div>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={18} />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 transition-all text-white text-sm placeholder-slate-600"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                  <a href="#" className="text-[10px] font-bold text-violet-400 hover:text-violet-300">Forgot?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={18} />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 transition-all text-white text-sm placeholder-slate-600"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 premium-gradient rounded-xl font-bold text-white shadow-xl glow-primary hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 text-sm"
              >
                {loginLoading ? <Loader2 className="animate-spin" size={20} /> : 'Login to Dashboard'}
              </button>
            </form>
          </div>
        </div>

        {/* Register Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-[1px] flex-1 bg-white/5"></div>
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">New Account</h2>
            <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>

          <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-white mb-2">
              <UserPlus size={20} className="text-cyan-400" />
              <h3 className="text-xl font-bold">Create Account</h3>
            </div>

            {regError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] font-bold">!</div>
                {regError}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all text-white text-sm placeholder-slate-600"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all text-white text-sm placeholder-slate-600"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Create Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all text-white text-sm placeholder-slate-600"
                    placeholder="Min. 8 characters"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3.5 bg-gradient-to-tr from-emerald-600 to-cyan-600 rounded-xl font-bold text-white shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 text-sm"
              >
                {regLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-emerald-500" /> Secure Environment Protected by GATE AI
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

