import { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle, XCircle, Clock, BarChart2, ChevronRight, RotateCcw, Trophy } from 'lucide-react';
import { mockTestApi } from '../lib/api';

type QuestionType = 'MCQ' | 'MSQ' | 'NAT';

interface Question {
  id: string;
  type: QuestionType;
  statementMd: string;
  optionsJson?: string[];
  marks: number;
  topicName: string;
  subjectName: string;
}

interface Result {
  scored: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  correct: number;
  wrong: number;
  timeTaken: number;
  responses: { questionId: string; isCorrect: boolean; marksAwarded: number }[];
}

type Phase = 'setup' | 'test' | 'result';

const TIMER_TOTAL = 180 * 60; // 180 min in seconds

export default function MockTests() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [testType, setTestType] = useState<'full-length' | 'sectional' | 'topic-wise'>('full-length');
  const [paperCode] = useState('CS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Test state
  const [attemptId, setAttemptId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(TIMER_TOTAL);
  const [startTime, setStartTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Result
  const [result, setResult] = useState<Result | null>(null);

  // Timer
  useEffect(() => {
    if (phase !== 'test') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const startTest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await mockTestApi.generate({ paperCode, type: testType });
      setAttemptId(res.data.attemptId);
      setQuestions(res.data.questions);
      setTimeLeft(res.data.durationMins * 60);
      setStartTime(Date.now());
      setCurrent(0);
      setAnswers({});
      setFlagged(new Set());
      setPhase('test');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to generate test');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const responses = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
      timeTakenSec: 0,
    }));
    try {
      const res = await mockTestApi.submit(attemptId, responses, timeTaken);
      setResult(res.data);
      setPhase('result');
    } catch (e: any) {
      setError('Failed to submit test');
    }
  };

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const flaggedCount = flagged.size;

  // ── Setup Phase ─────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Mock Test Engine
            </h1>
            <p className="text-slate-400 mt-2">Simulate GATE exam conditions with precision scoring</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">{error}</div>
          )}

          <div className="grid gap-4 mb-8">
            {(['full-length', 'sectional', 'topic-wise'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTestType(type)}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  testType === type
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white capitalize">
                      {type === 'full-length' ? 'Full-Length Test' : type === 'sectional' ? 'Sectional Test' : 'Topic-Wise Test'}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {type === 'full-length'
                        ? '65 Questions · 180 Minutes · GATE Pattern'
                        : type === 'sectional'
                        ? '20 Questions · 60 Minutes · Single Subject'
                        : '15 Questions · 30 Minutes · Specific Topics'}
                    </div>
                  </div>
                  {testType === type && <CheckCircle className="text-violet-400" size={22} />}
                </div>
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-8">
            <h3 className="font-semibold text-slate-200 mb-3">Marking Scheme</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {['MCQ', 'MSQ', 'NAT'].map((t) => (
                <div key={t} className="text-center p-3 bg-slate-800 rounded-xl">
                  <div className="font-bold text-violet-400 mb-2">{t}</div>
                  <div className="text-green-400">+1/+2 ✓</div>
                  <div className="text-red-400">{t === 'MCQ' ? '-⅓/-⅔ ✗' : 'No neg ✗'}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={startTest}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play size={22} />
            )}
            {loading ? 'Generating Test…' : 'Start Test'}
          </button>
        </div>
      </div>
    );
  }

  // ── Test Phase ──────────────────────────────────────────────────────────
  if (phase === 'test' && q) {
    const isFlagged = flagged.has(q.id);

    const handleMCQ = (opt: string) => setAnswers((prev) => ({ ...prev, [q.id]: opt }));
    const handleMSQ = (opt: string) => {
      const current = (answers[q.id] || '').split(',').filter(Boolean);
      const next = current.includes(opt) ? current.filter((x) => x !== opt) : [...current, opt];
      setAnswers((prev) => ({ ...prev, [q.id]: next.join(',') }));
    };
    const handleNAT = (val: string) => setAnswers((prev) => ({ ...prev, [q.id]: val }));

    const urgentTime = timeLeft < 600; // <10 min

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="text-sm text-slate-400">
            Q {current + 1} / {questions.length} · <span className="text-violet-400">{q.subjectName}</span>
          </div>
          <div className={`font-mono text-lg font-bold ${urgentTime ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
            <Clock size={16} className="inline mr-1" />
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-slate-400">
            {answered} answered · {flaggedCount} flagged
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Question Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded text-xs font-bold">{q.type}</span>
              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
              <span className="text-xs text-slate-500">{q.topicName}</span>
            </div>

            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-slate-100 text-base leading-relaxed whitespace-pre-wrap">{q.statementMd}</p>
            </div>

            {/* Options */}
            {q.type === 'MCQ' && q.optionsJson && (
              <div className="space-y-3">
                {q.optionsJson.map((opt, i) => {
                  const label = String.fromCharCode(65 + i);
                  const sel = answers[q.id] === label;
                  return (
                    <button
                      key={i}
                      onClick={() => handleMCQ(label)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        sel ? 'border-violet-500 bg-violet-500/10 text-white' : 'border-slate-700 bg-slate-900 hover:border-slate-500 text-slate-300'
                      }`}
                    >
                      <span className="font-bold text-violet-400 mr-3">{label}.</span>{opt}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === 'MSQ' && q.optionsJson && (
              <div className="space-y-3">
                <p className="text-xs text-yellow-400 mb-2">Select all correct answers</p>
                {q.optionsJson.map((opt, i) => {
                  const label = String.fromCharCode(65 + i);
                  const selected = (answers[q.id] || '').split(',').includes(label);
                  return (
                    <button
                      key={i}
                      onClick={() => handleMSQ(label)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selected ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-slate-700 bg-slate-900 hover:border-slate-500 text-slate-300'
                      }`}
                    >
                      <span className={`inline-block w-5 h-5 rounded border mr-3 ${selected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500'}`} />
                      <span className="font-bold text-cyan-400 mr-2">{label}.</span>{opt}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === 'NAT' && (
              <div>
                <p className="text-xs text-yellow-400 mb-3">Enter numerical answer (±1% tolerance accepted)</p>
                <input
                  type="number"
                  step="any"
                  value={answers[q.id] || ''}
                  onChange={(e) => handleNAT(e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full p-4 bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-xl text-white text-lg outline-none"
                />
              </div>
            )}

            {/* Nav Buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl disabled:opacity-30 transition-all"
              >
                ← Prev
              </button>
              <button
                onClick={() => {
                  setFlagged((f) => {
                    const next = new Set(f);
                    next.has(q.id) ? next.delete(q.id) : next.add(q.id);
                    return next;
                  });
                }}
                className={`px-5 py-2 rounded-xl transition-all ${isFlagged ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
              >
                {isFlagged ? '🚩 Flagged' : 'Flag'}
              </button>
              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl transition-all flex items-center gap-2"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-5 py-2 bg-green-600 hover:bg-green-500 rounded-xl transition-all font-bold"
                >
                  Submit Test
                </button>
              )}
            </div>
          </div>

          {/* Question Palette */}
          <div className="w-64 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto">
            <div className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-widest">Question Palette</div>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {questions.map((qq, i) => {
                const isAns = !!answers[qq.id];
                const isFlag = flagged.has(qq.id);
                const isCur = i === current;
                return (
                  <button
                    key={qq.id}
                    onClick={() => setCurrent(i)}
                    className={`aspect-square rounded-lg text-xs font-bold transition-all ${
                      isCur ? 'ring-2 ring-violet-400' : ''
                    } ${isFlag ? 'bg-yellow-500/30 text-yellow-300' : isAns ? 'bg-green-500/30 text-green-300' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500/30 rounded" />Answered</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-500/30 rounded" />Flagged</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-800 rounded" />Not visited</div>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full mt-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-sm transition-all"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Result Phase ────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const pct = result.percentage;
    const grade = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Average' : 'Needs Work';
    const gradeColor = pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-cyan-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400';

    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Trophy size={48} className="mx-auto text-yellow-400 mb-4" />
            <h2 className="text-4xl font-bold">Test Complete!</h2>
            <p className={`text-2xl font-semibold mt-2 ${gradeColor}`}>{grade}</p>
          </div>

          {/* Score Ring */}
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 mb-6 text-center">
            <div className="text-7xl font-black text-white mb-2">
              {result.scored.toFixed(2)}
              <span className="text-3xl text-slate-400">/{result.totalMarks}</span>
            </div>
            <div className={`text-4xl font-bold ${gradeColor}`}>{result.percentage}%</div>
            <div className="text-slate-400 mt-1">Score</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center">
              <CheckCircle className="mx-auto text-green-400 mb-2" size={28} />
              <div className="text-3xl font-bold text-green-400">{result.correct}</div>
              <div className="text-sm text-slate-400">Correct</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center">
              <XCircle className="mx-auto text-red-400 mb-2" size={28} />
              <div className="text-3xl font-bold text-red-400">{result.wrong}</div>
              <div className="text-sm text-slate-400">Wrong</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 text-center">
              <BarChart2 className="mx-auto text-blue-400 mb-2" size={28} />
              <div className="text-3xl font-bold text-blue-400">{result.accuracy}%</div>
              <div className="text-sm text-slate-400">Accuracy</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 text-center">
              <Clock className="mx-auto text-purple-400 mb-2" size={28} />
              <div className="text-3xl font-bold text-purple-400">{Math.round(result.timeTaken / 60)}m</div>
              <div className="text-sm text-slate-400">Time Taken</div>
            </div>
          </div>

          <button
            onClick={() => { setPhase('setup'); setResult(null); }}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw size={18} /> Take Another Test
          </button>
        </div>
      </div>
    );
  }

  return null;
}
