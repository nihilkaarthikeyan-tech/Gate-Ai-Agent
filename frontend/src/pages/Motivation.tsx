import React, { useEffect, useState } from 'react';
import { Smile, Target, TrendingUp, Award, Sparkles, Heart } from 'lucide-react';
import { api } from '../lib/api';

const Motivation: React.FC = () => {
  const [data, setData] = useState<{ nudge: string, progress: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/advanced/motivation')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-black text-white flex items-center gap-4 font-heading">
          <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 shadow-lg">
            <Smile className="text-pink-400" size={32} />
          </div>
          Motivation <span className="premium-text-gradient">Coach</span>
        </h1>
        <p className="text-slate-400 font-medium mt-2">Your daily dose of inspiration and elite progress tracking.</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-48 glass-card rounded-[2.5rem]"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 glass-card rounded-3xl"></div>
            <div className="h-32 glass-card rounded-3xl"></div>
            <div className="h-32 glass-card rounded-3xl"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden glass-card rounded-[2.5rem] p-10 border-white/5 bg-gradient-to-br from-pink-500/10 via-transparent to-violet-500/10">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 text-white/5 rotate-12">
              <Award size={240} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-bold uppercase tracking-widest">
                <Sparkles size={12} /> Transmission Received
              </div>
              <h2 className="text-2xl font-bold text-pink-300 font-heading">Quote of the Day</h2>
              <blockquote className="text-3xl font-medium text-white italic leading-relaxed max-w-3xl">
                "{data?.nudge || "Success is not final, failure is not fatal: it is the courage to continue that counts."}"
              </blockquote>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                 — GATE AI Intelligence Engine
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white font-heading tracking-tight">Mission Status Digest</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-8 rounded-[2rem] border-white/5 group hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                    <Target size={24} />
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active</div>
                </div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Study Hours</p>
                <p className="text-4xl font-black text-white mb-4">
                  {data?.progress?.weeklyHours || 0} 
                  <span className="text-lg text-slate-600 font-bold ml-2">/ {data?.progress?.targetHours || 30}h</span>
                </p>
                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-cyan-500 h-full rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, ((data?.progress?.weeklyHours || 0) / (data?.progress?.targetHours || 30)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-[2rem] border-white/5 group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <TrendingUp size={24} />
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Growth</div>
                </div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Mock Tests</p>
                <p className="text-4xl font-black text-white">
                  {data?.progress?.mockTestsCompleted || 0}
                  <span className="text-lg text-slate-600 font-bold ml-2">Deployed</span>
                </p>
              </div>

              <div className="glass-card p-8 rounded-[2rem] border-white/5 flex flex-col items-center justify-center text-center space-y-4 bg-gradient-to-tr from-amber-500/5 to-transparent">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-400 animate-float">
                  <Award size={32} />
                </div>
                <div>
                  <p className="text-white font-black text-lg">Keep it up!</p>
                  <p className="text-sm text-slate-500 font-medium px-4">You're maintaining a high operational tempo. Rank 1 is achievable.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[2rem] border-white/5 flex items-center justify-between bg-violet-600/5">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                <Heart size={28} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">Consistency wins the race</h4>
                <p className="text-slate-400 font-medium">You have a 5-day study streak. Don't break the chain!</p>
              </div>
            </div>
            <button className="px-6 py-3 rounded-xl bg-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-500/20 hover:scale-105 transition-transform">
              View Streak Details
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Motivation;
