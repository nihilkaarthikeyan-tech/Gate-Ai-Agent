import { useState, useEffect } from 'react';
import { Plus, Brain, Trash2, X, Layers, Star, Clock } from 'lucide-react';
import { flashcardApi } from '../lib/api';

interface Deck { id: string; title: string; subject?: string; description?: string; _count: { cards: number }; dueCount: number; }
interface Card { id: string; deckId: string; frontMd: string; backMd: string; subject?: string; easeFactor: number; intervalDays: number; repetitions: number; }
interface Stats { totalCards: number; dueCards: number; reviewsToday: number; }

const QUALITY = [
  { q: 0, label: 'Blackout', cls: 'bg-red-600', emoji: '💀' },
  { q: 1, label: 'Wrong',    cls: 'bg-red-500',    emoji: '✗' },
  { q: 2, label: 'Hard',     cls: 'bg-orange-500',  emoji: '😓' },
  { q: 3, label: 'Ok',       cls: 'bg-yellow-500',  emoji: '😐' },
  { q: 4, label: 'Good',     cls: 'bg-green-500',   emoji: '😊' },
  { q: 5, label: 'Easy',     cls: 'bg-emerald-500', emoji: '🔥' },
];

type View = 'decks' | 'detail' | 'review';

export default function Flashcards() {
  const [view, setView] = useState<View>('decks');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<Card[]>([]);
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newDeck, setNewDeck] = useState({ title: '', subject: '', description: '' });
  const [newCard, setNewCard] = useState({ frontMd: '', backMd: '', subject: '' });

  useEffect(() => { loadDecks(); loadStats(); }, []);

  const loadDecks  = async () => { try { const r = await flashcardApi.getDecks();  setDecks(r.data);  } catch {} };
  const loadStats  = async () => { try { const r = await flashcardApi.getStats();  setStats(r.data);  } catch {} };

  const openDeck = async (deck: Deck) => {
    setActiveDeck(deck);
    const r = await flashcardApi.getDeckCards(deck.id);
    setDeckCards(r.data);
    setView('detail');
  };

  const startReview = async (deckId?: string) => {
    const r = await flashcardApi.getDueCards(deckId);
    setDueCards(r.data);
    setReviewIdx(0);
    setFlipped(false);
    setReviewDone(r.data.length === 0);
    setView('review');
  };

  const submitReview = async (quality: number) => {
    const card = dueCards[reviewIdx];
    if (!card) return;
    await flashcardApi.submitReview(card.id, quality);
    if (reviewIdx + 1 >= dueCards.length) { setReviewDone(true); loadStats(); }
    else { setReviewIdx(i => i + 1); setFlipped(false); }
  };

  const createDeck = async () => {
    if (!newDeck.title.trim()) return;
    await flashcardApi.createDeck(newDeck);
    setNewDeck({ title: '', subject: '', description: '' });
    setShowNewDeck(false);
    loadDecks();
  };

  const addCard = async () => {
    if (!newCard.frontMd.trim() || !newCard.backMd.trim() || !activeDeck) return;
    await flashcardApi.addCard(activeDeck.id, newCard);
    setNewCard({ frontMd: '', backMd: '', subject: '' });
    setShowNewCard(false);
    const r = await flashcardApi.getDeckCards(activeDeck.id);
    setDeckCards(r.data);
  };

  const deleteDeck = async (id: string) => {
    if (!confirm('Delete this deck and all its cards?')) return;
    await flashcardApi.deleteDeck(id);
    loadDecks();
  };

  const deleteCard = async (cardId: string) => {
    await flashcardApi.deleteCard(cardId);
    if (activeDeck) { const r = await flashcardApi.getDeckCards(activeDeck.id); setDeckCards(r.data); }
  };

  /* ── REVIEW ── */
  if (view === 'review') {
    const card = dueCards[reviewIdx];
    if (reviewDone || !card) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">All caught up!</h2>
            <p className="text-slate-400 mb-6">{dueCards.length === 0 ? 'No cards due right now.' : `Reviewed ${dueCards.length} cards. Great work!`}</p>
            <button onClick={() => { setView('decks'); loadDecks(); }}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-all">Back to Decks</button>
          </div>
        </div>
      );
    }
    const pct = (reviewIdx / dueCards.length) * 100;
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setView('decks')} className="text-slate-400 hover:text-white flex items-center gap-2"><X size={18}/> Exit</button>
            <span className="text-sm text-slate-400">{reviewIdx + 1} / {dueCards.length}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mb-8">
            <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }}/>
          </div>

          <div className="relative" style={{ perspective: 1000 }}>
            <div onClick={() => setFlipped(f => !f)} className="cursor-pointer select-none"
              style={{ transformStyle: 'preserve-3d', transition: 'transform 0.5s', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>
              {/* Front */}
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 min-h-56 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: 'hidden' }}>
                <div className="text-xs text-violet-400 uppercase tracking-widest mb-4 font-semibold">Question</div>
                <p className="text-xl text-white leading-relaxed">{card.frontMd}</p>
                {card.subject && <span className="mt-4 text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">{card.subject}</span>}
                <p className="text-xs text-slate-500 mt-6">Click to reveal answer</p>
              </div>
              {/* Back */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-violet-950 border border-violet-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="text-xs text-green-400 uppercase tracking-widest mb-4 font-semibold">Answer</div>
                <p className="text-xl text-white leading-relaxed">{card.backMd}</p>
              </div>
            </div>
          </div>

          {flipped ? (
            <div className="mt-6 space-y-2">
              <p className="text-center text-sm text-slate-400 mb-3">How well did you know this?</p>
              <div className="grid grid-cols-3 gap-2">
                {QUALITY.slice(0, 3).map(({ q, label, cls, emoji }) => (
                  <button key={q} onClick={() => submitReview(q)} className={`py-3 rounded-xl ${cls} hover:opacity-90 font-semibold text-white text-sm transition-all`}>
                    {emoji} {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {QUALITY.slice(3).map(({ q, label, cls, emoji }) => (
                  <button key={q} onClick={() => submitReview(q)} className={`py-3 rounded-xl ${cls} hover:opacity-90 font-semibold text-white text-sm transition-all`}>
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button onClick={() => setFlipped(true)}
              className="w-full mt-6 py-4 bg-violet-600 hover:bg-violet-500 rounded-2xl font-bold text-lg transition-all">
              Reveal Answer
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── DECK DETAIL ── */
  if (view === 'detail' && activeDeck) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setView('decks')} className="text-slate-400 hover:text-white flex items-center gap-2 mb-6">← All Decks</button>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{activeDeck.title}</h2>
              {activeDeck.subject && <span className="text-violet-400 text-sm">{activeDeck.subject}</span>}
            </div>
            <button onClick={() => startReview(activeDeck.id)}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold flex items-center gap-2 transition-all">
              <Brain size={18}/> Review ({activeDeck.dueCount} due)
            </button>
          </div>

          {showNewCard ? (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold mb-4">New Card</h3>
              <textarea rows={3} placeholder="Front (Question / Term)…" value={newCard.frontMd}
                onChange={e => setNewCard({ ...newCard, frontMd: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white resize-none mb-3 outline-none focus:border-violet-500"/>
              <textarea rows={3} placeholder="Back (Answer / Definition)…" value={newCard.backMd}
                onChange={e => setNewCard({ ...newCard, backMd: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white resize-none mb-3 outline-none focus:border-violet-500"/>
              <input placeholder="Subject (optional)" value={newCard.subject}
                onChange={e => setNewCard({ ...newCard, subject: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white mb-3 outline-none focus:border-violet-500"/>
              <div className="flex gap-3">
                <button onClick={addCard} className="px-5 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-all">Add Card</button>
                <button onClick={() => setShowNewCard(false)} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewCard(true)}
              className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl mb-6 transition-all border border-dashed border-slate-600">
              <Plus size={18}/> Add Card
            </button>
          )}

          <div className="space-y-3">
            {deckCards.length === 0 && <div className="text-center py-12 text-slate-500">No cards yet. Add your first card above!</div>}
            {deckCards.map(card => (
              <div key={card.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium line-clamp-2">{card.frontMd}</p>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">{card.backMd}</p>
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    <span>EF: {card.easeFactor.toFixed(2)}</span>
                    <span>Interval: {card.intervalDays}d</span>
                    <span>Reps: {card.repetitions}</span>
                  </div>
                </div>
                <button onClick={() => deleteCard(card.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 size={16}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── DECKS OVERVIEW ── */
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Flashcards</h1>
            <p className="text-slate-400 mt-1">Spaced repetition with SM-2 algorithm</p>
          </div>
          <button onClick={() => setShowNewDeck(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-all">
            <Plus size={18}/> New Deck
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 text-center">
              <Layers className="mx-auto text-violet-400 mb-2" size={22}/>
              <div className="text-3xl font-bold text-violet-400">{stats.totalCards}</div>
              <div className="text-xs text-slate-400 mt-0.5">Total Cards</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5 text-center">
              <Clock className="mx-auto text-orange-400 mb-2" size={22}/>
              <div className="text-3xl font-bold text-orange-400">{stats.dueCards}</div>
              <div className="text-xs text-slate-400 mt-0.5">Due Now</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center">
              <Star className="mx-auto text-green-400 mb-2" size={22}/>
              <div className="text-3xl font-bold text-green-400">{stats.reviewsToday}</div>
              <div className="text-xs text-slate-400 mt-0.5">Reviewed Today</div>
            </div>
          </div>
        )}

        {stats && stats.dueCards > 0 && (
          <button onClick={() => startReview()}
            className="w-full mb-6 py-4 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all">
            <Brain size={22}/> Review All Due Cards ({stats.dueCards})
          </button>
        )}

        {showNewDeck && (
          <div className="bg-slate-900 border border-violet-500/30 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Create New Deck</h3>
            <input placeholder="Deck title…" value={newDeck.title}
              onChange={e => setNewDeck({ ...newDeck, title: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white mb-3 outline-none focus:border-violet-500"/>
            <input placeholder="Subject (e.g. CS, EC)" value={newDeck.subject}
              onChange={e => setNewDeck({ ...newDeck, subject: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white mb-3 outline-none focus:border-violet-500"/>
            <input placeholder="Description (optional)" value={newDeck.description}
              onChange={e => setNewDeck({ ...newDeck, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white mb-4 outline-none focus:border-violet-500"/>
            <div className="flex gap-3">
              <button onClick={createDeck} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-all">Create</button>
              <button onClick={() => setShowNewDeck(false)} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all">Cancel</button>
            </div>
          </div>
        )}

        {decks.length === 0 && !showNewDeck && (
          <div className="text-center py-16 text-slate-500">
            <Layers size={48} className="mx-auto mb-4 opacity-30"/>
            <p className="text-lg">No decks yet. Create your first deck!</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decks.map(deck => (
            <div key={deck.id} onClick={() => openDeck(deck)}
              className="bg-slate-900 border border-slate-700 hover:border-violet-500/50 rounded-2xl p-5 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">{deck.title}</h3>
                  {deck.subject && <span className="text-xs text-violet-400">{deck.subject}</span>}
                </div>
                <button onClick={e => { e.stopPropagation(); deleteDeck(deck.id); }}
                  className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={16}/>
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-slate-400">{deck._count.cards} cards</span>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${deck.dueCount > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                  {deck.dueCount > 0 ? `${deck.dueCount} due` : '✓ All done'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
