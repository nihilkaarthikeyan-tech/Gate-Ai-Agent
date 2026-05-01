import { useState, useEffect } from 'react';
import { Calendar, Clock, Target, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { plannerApi, analyticsApi } from '../lib/api';

interface WeekPlan {
  week: number;
  theme: string;
  subjects: {
    name: string;
    topics: string[];
    hoursAllocated: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  milestones: string[];
  revision: boolean;
}

interface StudyPlan {
  id: string;
  planJson: {
    summary: string;
    totalWeeks: number;
    weeklyPlans: WeekPlan[];
    dailySchedule: { morning: string; afternoon: string; evening: string };
    keyRecommendations: string[];
  };
  targetDate: string;
  dailyHours: number;
  targetScore: number;
  completedTopics: string[] | null;
  lastAdaptedAt: string;
}

const SUBJECTS = [
  'Data Structures', 'Algorithms', 'Theory of Computation',
  'Compiler Design', 'Operating Systems', 'Computer Networks',
  'Databases', 'Digital Logic', 'Computer Organization',
  'Discrete Mathematics', 'Linear Algebra', 'Probability & Statistics',
];

const PRIORITY_COLORS = {
  high:   'bg-red-500/20 text-red-300 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  low:    'bg-green-500/20 text-green-300 border-green-500/30',
};

function WeekCard({ week, completedTopics, onToggleTopic }: {
  week: WeekPlan;
  completedTopics: Set<string>;
  onToggleTopic: (topic: string) => void;
}) {
  const [expanded, setExpanded] = useState(week.week <= 2);

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${week.revision ? 'bg-purple-500/20 text-purple-300' : 'bg-violet-500/20 text-violet-300'}`}>
            {week.week}
          </div>
          <div className="text-left">
            <p className="font-medium text-white text-sm">{week.theme}</p>
            <p className="text-xs text-slate-500">
              {week.subjects.length} subjects · {week.subjects.reduce((s, sub) => s + sub.hoursAllocated, 0)}h total
              {week.revision && ' · Revision week'}
            </p>
          </div>
        </div>
        {expanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
      </button>

      {expanded && (
        <div className="border-t border-white/[0.05] p-4 space-y-4">
          {week.subjects.map((subject) => (
            <div key={subject.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-200">{subject.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[subject.priority]}`}>
                    {subject.priority}
                  </span>
                  <span className="text-xs text-slate-500">{subject.hoursAllocated}h</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {subject.topics.map((topic) => {
                  const key = `${week.week}-${subject.name}-${topic}`;
                  const done = completedTopics.has(key);
                  return (
                    <button
                      key={topic}
                      onClick={() => onToggleTopic(key)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        done
                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                          : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:bg-white/[0.08]'
                      }`}
                    >
                      {done && <CheckCircle2 size={10} />}
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {week.milestones.length > 0 && (
            <div className="pt-2 border-t border-white/[0.05]">
              <p className="text-xs font-medium text-slate-500 mb-1.5">Milestones</p>
              <ul className="space-y-1">
                {week.milestones.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-violet-400 mt-0.5">→</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Planner() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    targetDate: '',
    dailyHours: 6,
    targetScore: 65,
    weakSubjects: [] as string[],
    paper: 'CS',
  });

  useEffect(() => {
    plannerApi.getPlan()
      .then((r) => {
        setPlan(r.data);
        setCompletedTopics(new Set(r.data.completedTopics ?? []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    analyticsApi.getWeakAreas()
      .then((r) => {
        const subjects = [...new Set(r.data.map((w: any) => w.subject))] as string[];
        if (subjects.length > 0) {
          setForm((f) => ({ ...f, weakSubjects: [...new Set([...f.weakSubjects, ...subjects])] }));
        }
      })
      .catch(() => {});
  }, []);

  const toggleSubject = (s: string) => {
    setForm((f) => ({
      ...f,
      weakSubjects: f.weakSubjects.includes(s)
        ? f.weakSubjects.filter((x) => x !== s)
        : [...f.weakSubjects, s],
    }));
  };

  const generatePlan = async () => {
    if (!form.targetDate) { setError('Please select an exam date'); return; }
    setGenerating(true);
    setError(null);
    try {
      const r = await plannerApi.generatePlan(form);
      setPlan(r.data);
      setCompletedTopics(new Set());
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  const toggleTopic = async (key: string) => {
    const next = new Set(completedTopics);
    if (next.has(key)) next.delete(key); else next.add(key);
    setCompletedTopics(next);
    await plannerApi.updateProgress([...next]).catch(() => {});
  };

  const progressPct = plan
    ? Math.round(
        (completedTopics.size /
          Math.max(1, plan.planJson.weeklyPlans.flatMap((w) =>
            w.subjects.flatMap((s) => s.topics.map((t) => `${w.week}-${s.name}-${t}`))
          ).length)) * 100
      )
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Study Planner</h1>
          <p className="text-sm text-slate-400 mt-1">AI-generated adaptive study schedule for GATE</p>
        </div>
        {plan && (
          <button
            onClick={() => setPlan(null)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-white/[0.08] px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
        )}
      </div>

      {!plan ? (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-white">Generate Your Plan</h2>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-lg text-sm border border-red-500/20">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">GATE Exam Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Daily Study Hours</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="number"
                  value={form.dailyHours}
                  onChange={(e) => setForm((f) => ({ ...f, dailyHours: Number(e.target.value) }))}
                  min={1} max={18}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Target Score (/100)</label>
              <div className="relative">
                <Target size={16} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="number"
                  value={form.targetScore}
                  onChange={(e) => setForm((f) => ({ ...f, targetScore: Number(e.target.value) }))}
                  min={1} max={100}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Weak Subjects <span className="text-slate-500 font-normal">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSubject(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.weakSubjects.includes(s)
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white/[0.03] text-slate-400 border-white/10 hover:border-violet-500/40 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generatePlan}
            disabled={generating || !form.targetDate}
            className="w-full py-3 premium-gradient text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating with Claude AI…
              </>
            ) : (
              'Generate Study Plan'
            )}
          </button>
          {generating && (
            <p className="text-xs text-slate-500 text-center">
              This takes 15–30 seconds. Claude is crafting a personalised plan for you.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl p-5 text-white">
            <p className="text-sm opacity-80 mb-1">{plan.planJson.summary}</p>
            <div className="flex items-center gap-6 mt-3">
              <div>
                <p className="text-2xl font-bold">{plan.planJson.totalWeeks}</p>
                <p className="text-xs opacity-70">weeks</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{plan.dailyHours}h</p>
                <p className="text-xs opacity-70">per day</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{plan.targetScore}</p>
                <p className="text-xs opacity-70">target score</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold">{progressPct}%</p>
                <p className="text-xs opacity-70">completed</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/80 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Daily schedule */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3">Daily Schedule</h2>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(plan.planJson.dailySchedule).map(([time, desc]) => (
                <div key={time} className="bg-white/[0.03] rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-500 capitalize mb-1">{time}</p>
                  <p className="text-sm text-slate-200">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {plan.planJson.keyRecommendations.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
              <h2 className="font-semibold text-amber-300 mb-2">Key Recommendations</h2>
              <ul className="space-y-1.5">
                {plan.planJson.keyRecommendations.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-amber-400/80">
                    <span className="text-amber-400 mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weekly plans */}
          <div className="space-y-3">
            <h2 className="font-semibold text-white">Weekly Breakdown</h2>
            {plan.planJson.weeklyPlans.map((week) => (
              <WeekCard
                key={week.week}
                week={week}
                completedTopics={completedTopics}
                onToggleTopic={toggleTopic}
              />
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
