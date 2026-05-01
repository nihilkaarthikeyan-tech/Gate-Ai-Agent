import React, { useEffect, useState } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Zap, BookOpen, Target, Clock, TrendingUp, Sparkles, 
  ArrowUpRight, AlertCircle, CheckCircle2, Trophy, Smile 
} from 'lucide-react';

import { analyticsApi } from '../lib/api';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="text-violet-500 animate-pulse" size={24} />
        </div>
      </div>
    </div>
  );

  const stats = [
    { name: 'Tests Taken', value: data?.stats?.testsTaken || 0, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { name: 'Avg. Accuracy', value: `${data?.stats?.averageScore || 0}%`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { name: 'Due Cards', value: data?.stats?.dueFlashcards || 0, icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { name: 'Notes Made', value: data?.stats?.totalNotes || 0, icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-[2rem] glass-card p-10 border-white/[0.05]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-violet-600/20 blur-[80px] rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles size={12} /> Personalized Analysis Active
            </div>
            <h1 className="text-5xl font-extrabold text-white leading-tight font-heading">
              Your Journey to <span className="premium-text-gradient">Rank 1</span> Starts Here.
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              We've analyzed your recent performance. You're making solid progress in <span className="text-cyan-400">Data Structures</span>, but let's focus on <span className="text-rose-400">Operating Systems</span> today.
            </p>
          </div>
          <div className="flex flex-col items-center p-8 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-sm min-w-[240px]">
            <Trophy className="text-amber-400 mb-3" size={48} />
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Target Rank</p>
            <p className="text-4xl font-black text-white italic">#001</p>
            <div className="mt-4 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              +12% vs last week
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="glass-card p-6 rounded-3xl group hover:border-white/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon size={24} />
              </div>
              <ArrowUpRight className="text-slate-600 group-hover:text-slate-400 transition-colors" size={20} />
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{stat.name}</p>
            <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-[2rem]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white font-heading">Performance Trend</h3>
              <p className="text-slate-500 text-sm">Your mock test scores over time</p>
            </div>
            <TrendingUp className="text-violet-400" size={24} />
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.performanceTrend || []}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#8b5cf6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2rem]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white font-heading">Syllabus Coverage</h3>
              <p className="text-slate-500 text-sm">Subject-wise preparation status</p>
            </div>
            <CheckCircle2 className="text-emerald-400" size={24} />
          </div>
          <div className="space-y-6">
            {[
              { subject: 'Data Structures', progress: 85, color: 'bg-violet-500' },
              { subject: 'Algorithms', progress: 72, color: 'bg-cyan-500' },
              { subject: 'Operating Systems', progress: 45, color: 'bg-rose-500' },
              { subject: 'Computer Networks', progress: 60, color: 'bg-emerald-500' },
              { subject: 'Databases', progress: 90, color: 'bg-amber-500' },
            ].map((sub) => (
              <div key={sub.subject} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-300">{sub.subject}</span>
                  <span className="text-white">{sub.progress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`${sub.color} h-full rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${sub.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions / Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl border-l-4 border-l-rose-500 bg-rose-500/5">
          <div className="flex gap-4">
            <AlertCircle className="text-rose-500 flex-shrink-0" size={24} />
            <div>
              <h4 className="text-white font-bold mb-1">Upcoming Live Mock</h4>
              <p className="text-sm text-slate-400">All India GATE Mock starts in 2 days. Register now to secure your spot.</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl border-l-4 border-l-violet-500 bg-violet-500/5">
          <div className="flex gap-4">
            <Zap className="text-violet-500 flex-shrink-0" size={24} />
            <div>
              <h4 className="text-white font-bold mb-1">New Flashcards</h4>
              <p className="text-sm text-slate-400">30 new cards available for Discrete Mathematics. Review them today!</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-3xl border-l-4 border-l-cyan-500 bg-cyan-500/5">
          <div className="flex gap-4">
            <Smile className="text-cyan-500 flex-shrink-0" size={24} />
            <div>
              <h4 className="text-white font-bold mb-1">AI Suggestion</h4>
              <p className="text-sm text-slate-400">You perform best between 7 AM - 10 AM. Try solving PYQs tomorrow morning.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
