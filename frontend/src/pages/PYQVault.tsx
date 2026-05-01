import { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, BookOpen, Lightbulb, X } from 'lucide-react';
import { pyqApi } from '../lib/api';

interface Question {
  id: string;
  year: number;
  subject: string;
  topic: string;
  questionText: string;
  questionType: 'MCQ' | 'MSQ' | 'NAT';
  marks: number;
  options: string[] | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Subject {
  id: string;
  name: string;
  topicCount: number;
}

const TYPE_COLORS: Record<string, string> = {
  MCQ: 'bg-blue-100 text-blue-700',
  MSQ: 'bg-purple-100 text-purple-700',
  NAT: 'bg-orange-100 text-orange-700',
};

function QuestionCard({
  question,
  onViewExplanation,
}: {
  question: Question;
  onViewExplanation: (q: Question) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[question.questionType]}`}>
            {question.questionType}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            GATE {question.year}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {question.marks} mark{question.marks > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="text-sm text-gray-800 mb-2 leading-relaxed">
        {question.subject} › {question.topic}
      </div>

      <p className="text-sm text-gray-900 mb-4 leading-relaxed line-clamp-4">
        {question.questionText}
      </p>

      {question.options && question.options.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {question.options.map((opt, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="font-medium text-gray-500 w-5 flex-shrink-0">
                {String.fromCharCode(65 + i)}.
              </span>
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => onViewExplanation(question)}
        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <Lightbulb size={14} />
        View AI Explanation
      </button>
    </div>
  );
}

function ExplanationModal({
  question,
  onClose,
}: {
  question: Question;
  onClose: () => void;
}) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pyqApi.getExplanation(question.id)
      .then((r) => setExplanation(r.data.explanation))
      .catch(() => setError('Failed to load explanation'))
      .finally(() => setLoading(false));
  }, [question.id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">AI Explanation</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {question.questionType} · GATE {question.year} · {question.marks} mark{question.marks > 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-800 leading-relaxed">{question.questionText}</p>
          {question.options && (
            <div className="mt-3 space-y-1">
              {question.options.map((opt, i) => (
                <div key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="font-medium text-gray-500">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Generating explanation…</span>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {explanation && (
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PYQVault() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const [filters, setFilters] = useState({
    subject: '',
    year: '',
    type: '',
    page: 1,
  });

  useEffect(() => {
    pyqApi.getSubjects()
      .then((r) => setSubjects(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    pyqApi.listQuestions({
      subject: filters.subject || undefined,
      year: filters.year ? Number(filters.year) : undefined,
      type: filters.type || undefined,
      page: filters.page,
      limit: 20,
    })
      .then((r) => {
        setQuestions(r.data.questions);
        setPagination(r.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const setFilter = (key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  const years = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - 1 - i));

  return (
    <div className="flex-1 overflow-y-auto">
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">PYQ Vault</h1>
        <p className="text-sm text-gray-500 mt-1">15+ years of GATE CS previous year questions with AI explanations</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <select
              value={filters.subject}
              onChange={(e) => setFilter('subject', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <select
            value={filters.year}
            onChange={(e) => setFilter('year', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilter('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Types</option>
            <option value="MCQ">MCQ</option>
            <option value="MSQ">MSQ</option>
            <option value="NAT">NAT</option>
          </select>

          <button
            onClick={() => setFilters({ subject: '', year: '', type: '', page: 1 })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={16} className="text-gray-400" />
        <span className="text-sm text-gray-500">
          {loading ? 'Loading…' : `${pagination.total} questions found`}
        </span>
      </div>

      {/* Question grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No questions found</p>
          <p className="text-sm mt-1">Try adjusting your filters or check back after seeding the database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} onViewExplanation={setSelectedQuestion} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            disabled={filters.page <= 1}
            className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            disabled={filters.page >= pagination.pages}
            className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Explanation modal */}
      {selectedQuestion && (
        <ExplanationModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
        />
      )}
    </div>
    </div>
  );
}
