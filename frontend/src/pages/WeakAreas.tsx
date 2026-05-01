import { useEffect, useState } from 'react';
import { Target, AlertTriangle, Activity } from 'lucide-react';
import { analyticsApi } from '../lib/api';
import { Link } from 'react-router-dom';

interface WeakArea {
  subject: string;
  topic: string;
  correct: number;
  total: number;
  marks: number;
  timeTaken: number;
  accuracy: number;
  avgTimePerQuestion: number;
}

export default function WeakAreas() {
  const [weakAreas, setWeakAreas] = useState<WeakArea[] | null>(null);

  useEffect(() => {
    analyticsApi.getWeakAreas().then(r => setWeakAreas(r.data)).catch(() => setWeakAreas([]));
  }, []);

  if (!weakAreas) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
            <Target size={32} className="text-emerald-400" />
            Weak Area Analyzer
          </h2>
          <p className="text-slate-400 mt-2">Data-driven insights into your lowest performing topics based on your mock test history.</p>
        </div>

        {weakAreas.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Activity className="mx-auto text-slate-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-300 mb-2">Not Enough Data</h3>
            <p className="text-slate-500">Take more mock tests to generate weak area insights. We need at least 3 attempts per topic to establish a baseline.</p>
            <Link to="/mock-tests" className="inline-block mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all">
              Take a Mock Test
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5 flex items-start gap-4">
              <AlertTriangle className="text-orange-400 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="text-orange-400 font-bold mb-1">Attention Required</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  You have <span className="font-bold text-white">{weakAreas.length} topics</span> with an accuracy below 60%. Focusing your revision on these specific areas will yield the highest improvement in your overall GATE score.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {weakAreas.map((area, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-800 text-slate-300 rounded-md">
                      {area.subject}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      area.accuracy < 30 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {area.accuracy}% Accuracy
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-4 text-slate-100 group-hover:text-emerald-300 transition-colors">
                    {area.topic}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                      <p className="text-xs text-slate-500 mb-1">Attempted</p>
                      <p className="font-semibold text-slate-300">{area.total} Qs</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                      <p className="text-xs text-slate-500 mb-1">Avg Time</p>
                      <p className="font-semibold text-slate-300">{area.avgTimePerQuestion}s</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/tutor?topic=${encodeURIComponent(area.topic)}`} className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-center text-sm font-semibold rounded-lg transition-colors border border-emerald-500/20">
                      Learn Concept
                    </Link>
                    <Link to="/pyqs" className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-center text-sm font-semibold rounded-lg transition-colors">
                      Solve PYQs
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
