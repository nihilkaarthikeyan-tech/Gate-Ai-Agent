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
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

function WeekCard({ week, completedTopics, onToggleTopic }: {
  week: WeekPlan;
  completedTopics: Set<string>;
  onToggleTopic: (topic: string) => void;
}) {
  const [expanded, setExpanded] = useState(week.week <= 2);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${week.revision ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {week.week}
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 text-sm">{week.theme}</p>
            <p className="text-xs text-gray-500">
              {week.subjects.length} subjects · {week.subjects.reduce((s, sub) => s + sub.hoursAllocated, 0)}h total
              {week.revision && ' · Revision week'}
            </p>
          </div>
        </div>
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {week.subjects.map((subject) => (
            <div key={subject.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">{subject.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[subject.priority]}`}>
                    {subject.priority}
                  </span>
                  <span className="text-xs text-gray-500">{subject.hoursAllocated}h</span>
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
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
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
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Milestones</p>
              <ul className="space-y-1">
                {week.milestones.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-blue-500 mt-0.5">→</span> {m}
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
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Planner</h1>
          <p className="text-sm text-gray-500 mt-1">AI-generated adaptive study schedule for GATE</p>
        </div>
        {plan && (
          <button
            onClick={() => setPlan(null)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} />
            Regenerate
          </button>
        )}
      </div>

      {!plan ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Generate Your Plan</h2>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GATE Exam Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Study Hours</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="number"
                  value={form.dailyHours}
                  onChange={(e) => setForm((f) => ({ ...f, dailyHours: Number(e.target.value) }))}
                  min={1} max={18}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Score (/100)</label>
              <div className="relative">
                <Target size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="number"
                  value={form.targetScore}
                  onChange={(e) => setForm((f) => ({ ...f, targetScore: Number(e.target.value) }))}
                  min={1} max={100}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weak Subjects <span className="text-gray-400 font-normal">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSubject(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.weakSubjects.includes(s)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
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
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
            <p className="text-xs text-gray-400 text-center">
              This takes 15–30 seconds. Claude is crafting a personalised plan for you.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white">
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
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Daily Schedule</h2>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(plan.planJson.dailySchedule).map(([time, desc]) => (
                <div key={time} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 capitalize mb-1">{time}</p>
                  <p className="text-sm text-gray-800">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {plan.planJson.keyRecommendations.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h2 className="font-semibold text-amber-900 mb-2">Key Recommendations</h2>
              <ul className="space-y-1.5">
                {plan.planJson.keyRecommendations.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="text-amber-500 mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weekly plans */}
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900">Weekly Breakdown</h2>
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
