import { useState, useEffect } from 'react';
import { Plus, FileText, Search, Trash2, Sparkles, Save, X, Tag } from 'lucide-react';
import { notesApi } from '../lib/api';

interface NoteSummary { id: string; title: string; subject?: string; tags: string[]; summaryMd?: string; createdAt: string; updatedAt: string; }
interface Note extends NoteSummary { contentMd: string; }

type View = 'list' | 'edit' | 'new';

export default function Notes() {
  const [view, setView] = useState<View>('list');
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState({ title: '', contentMd: '', subject: '', tags: '' });
  const [summarizing, setSummarizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => { loadNotes(); }, []);
  useEffect(() => { loadNotes(); }, [search]);

  const loadNotes = async () => {
    try {
      const r = await notesApi.getNotes(search ? { search } : undefined);
      setNotes(r.data);
    } catch {}
  };

  const openNote = async (id: string) => {
    const r = await notesApi.getNote(id);
    setActiveNote(r.data);
    setDraft({ title: r.data.title, contentMd: r.data.contentMd, subject: r.data.subject || '', tags: r.data.tags.join(', ') });
    setShowSummary(false);
    setView('edit');
  };

  const saveNote = async () => {
    setSaving(true);
    try {
      const payload = { title: draft.title, contentMd: draft.contentMd, subject: draft.subject, tags: draft.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (view === 'new') {
        await notesApi.createNote(payload);
      } else if (activeNote) {
        await notesApi.updateNote(activeNote.id, payload);
      }
      await loadNotes();
      setView('list');
    } finally { setSaving(false); }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await notesApi.deleteNote(id);
    loadNotes();
    if (activeNote?.id === id) setView('list');
  };

  const summarize = async () => {
    if (!activeNote) return;
    setSummarizing(true);
    try {
      // Save first
      await notesApi.updateNote(activeNote.id, {
        title: draft.title, contentMd: draft.contentMd, subject: draft.subject,
        tags: draft.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      const r = await notesApi.summarize(activeNote.id);
      setActiveNote(prev => prev ? { ...prev, summaryMd: r.data.summaryMd } : prev);
      setShowSummary(true);
    } finally { setSummarizing(false); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  /* ── EDIT / NEW ── */
  if (view === 'edit' || view === 'new') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <button onClick={() => setView('list')} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <X size={18}/> Discard
          </button>
          <div className="flex gap-3">
            {view === 'edit' && activeNote && (
              <button onClick={summarize} disabled={summarizing}
                className="px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all disabled:opacity-50">
                {summarizing ? <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"/> : <Sparkles size={16}/>}
                {summarizing ? 'Summarizing…' : 'AI Summary'}
              </button>
            )}
            <button onClick={saveNote} disabled={saving}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold flex items-center gap-2 text-sm transition-all disabled:opacity-50">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={16}/>}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 pt-6 pb-4 border-b border-slate-800">
              <input
                placeholder="Note title…"
                value={draft.title}
                onChange={e => setDraft({ ...draft, title: e.target.value })}
                className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder-slate-600"
              />
              <div className="flex gap-4 mt-3">
                <input placeholder="Subject" value={draft.subject}
                  onChange={e => setDraft({ ...draft, subject: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-violet-500 w-40"/>
                <div className="flex items-center gap-2 flex-1">
                  <Tag size={14} className="text-slate-500"/>
                  <input placeholder="tags, comma, separated"
                    value={draft.tags}
                    onChange={e => setDraft({ ...draft, tags: e.target.value })}
                    className="bg-transparent text-sm text-slate-400 outline-none flex-1 placeholder-slate-600"/>
                </div>
              </div>
            </div>
            <textarea
              placeholder="Start writing your notes here… Support markdown, LaTeX ($...$), code blocks."
              value={draft.contentMd}
              onChange={e => setDraft({ ...draft, contentMd: e.target.value })}
              className="flex-1 bg-transparent px-8 py-6 text-slate-200 text-base leading-relaxed resize-none outline-none font-mono"
            />
          </div>

          {/* AI Summary Panel */}
          {showSummary && activeNote?.summaryMd && (
            <div className="w-80 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm">
                  <Sparkles size={16}/> AI Summary
                </div>
                <button onClick={() => setShowSummary(false)} className="text-slate-500 hover:text-white">
                  <X size={16}/>
                </button>
              </div>
              <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                {activeNote.summaryMd}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── LIST ── */
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">My Notes</h1>
            <p className="text-slate-400 mt-1">Write, organize, and get AI summaries</p>
          </div>
          <button onClick={() => { setDraft({ title: '', contentMd: '', subject: '', tags: '' }); setActiveNote(null); setView('new'); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold transition-all">
            <Plus size={18}/> New Note
          </button>
        </div>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 focus:border-cyan-500/50 rounded-2xl text-white outline-none transition-all"/>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText size={48} className="mx-auto mb-4 opacity-30"/>
            <p className="text-lg">{search ? 'No notes match your search.' : 'No notes yet. Create your first!'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map(note => (
              <div key={note.id} onClick={() => openNote(note.id)}
                className="bg-slate-900 border border-slate-700 hover:border-cyan-500/40 rounded-2xl p-5 cursor-pointer transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 flex-1">{note.title}</h3>
                  <button onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                    className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0">
                    <Trash2 size={15}/>
                  </button>
                </div>
                {note.subject && <span className="text-xs text-cyan-400 mb-2 inline-block">{note.subject}</span>}
                {note.summaryMd ? (
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{note.summaryMd.slice(0, 200)}…</p>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Sparkles size={12}/> No summary yet
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {note.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">{t}</span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-600">{fmtDate(note.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
