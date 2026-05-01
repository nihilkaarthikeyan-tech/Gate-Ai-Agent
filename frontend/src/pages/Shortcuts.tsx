import { useState, useEffect } from 'react';
import { Search, Zap, BookOpen, ChevronRight, X } from 'lucide-react';
import { shortcutsApi } from '../lib/api';

interface Shortcut {
  id: string;
  subject: string;
  title: string;
  contentMd: string;
  tags: string[];
  difficulty?: string;
  gateYear?: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  'Algorithms':      'violet',
  'Data Structures': 'cyan',
  'Operating Systems':'orange',
  'Computer Networks':'blue',
  'Databases':       'green',
  'Digital Logic':   'rose',
  'TOC':             'yellow',
  'Compiler Design': 'pink',
  'Mathematics':     'emerald',
  'General':         'slate',
};

const colorCls = (s: string) => {
  const c = SUBJECT_COLORS[s] || 'slate';
  return { bg: `bg-${c}-500/10`, border: `border-${c}-500/20`, text: `text-${c}-400`, badge: `bg-${c}-500/20 text-${c}-400` };
};

export default function Shortcuts() {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Shortcut | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    shortcutsApi.getSubjects().then(r => setSubjects(r.data)).catch(() => {});
    fetchShortcuts();
  }, []);

  useEffect(() => { fetchShortcuts(); }, [activeSubject, search]);

  const fetchShortcuts = async () => {
    setLoading(true);
    try {
      const r = await shortcutsApi.getShortcuts({
        ...(activeSubject ? { subject: activeSubject } : {}),
        ...(search ? { search } : {}),
      });
      setShortcuts(r.data);
    } catch {}
    finally { setLoading(false); }
  };

  const diffColor = (d?: string) =>
    d === 'hard' ? 'text-red-400 bg-red-500/10' :
    d === 'medium' ? 'text-yellow-400 bg-yellow-500/10' :
    'text-green-400 bg-green-500/10';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-xs text-violet-400 font-semibold uppercase tracking-widest">{selected.subject}</span>
                <h2 className="text-2xl font-bold text-white mt-1">{selected.title}</h2>
                <div className="flex gap-2 mt-2">
                  {selected.difficulty && (
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${diffColor(selected.difficulty)}`}>
                      {selected.difficulty}
                    </span>
                  )}
                  {selected.gateYear && (
                    <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-semibold">
                      GATE {selected.gateYear}
                    </span>
                  )}
                  {selected.tags.map(t => (
                    <span key={t} className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">{t}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white transition-colors ml-4">
                <X size={22}/>
              </button>
            </div>
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed font-sans bg-slate-800/50 rounded-2xl p-5">
                {selected.contentMd}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
              <Zap size={32} className="text-yellow-400"/> Shortcuts Library
            </h1>
            <p className="text-slate-400 mt-1">Curated tricks, formulas & memory aids for GATE CS</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search shortcuts, formulas, topics…"
              className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 focus:border-yellow-500/50 rounded-2xl text-white outline-none transition-all"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveSubject('')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${!activeSubject ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              All
            </button>
            {subjects.map(s => (
              <button key={s}
                onClick={() => setActiveSubject(s === activeSubject ? '' : s)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${s === activeSubject ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"/>
            </div>
          ) : shortcuts.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <BookOpen size={48} className="mx-auto mb-4 opacity-30"/>
              <p className="text-lg">No shortcuts found. Try a different filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shortcuts.map(s => {
                const cls = colorCls(s.subject);
                return (
                  <button key={s.id} onClick={() => setSelected(s)} className={`text-left p-5 rounded-2xl border ${cls.bg} ${cls.border} hover:scale-[1.02] transition-all duration-200`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls.badge}`}>{s.subject}</span>
                      <ChevronRight size={16} className="text-slate-500 flex-shrink-0 mt-0.5"/>
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-2 leading-snug">{s.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{s.contentMd}</p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {s.difficulty && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor(s.difficulty)}`}>{s.difficulty}</span>
                      )}
                      {s.gateYear && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">GATE {s.gateYear}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
