import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const TOPIC_STARTERS = [
  { label: 'GATE Application', question: 'How do I apply for GATE? What are the eligibility criteria and important dates?' },
  { label: 'COAP Rounds', question: 'How does COAP work? Explain the round-wise seat allocation process.' },
  { label: 'CCMT Choice Filling', question: 'What is the best strategy for CCMT choice filling to maximize my chances?' },
  { label: 'PSU Recruitment', question: 'Which PSUs recruit through GATE CS? What are the selection stages?' },
  { label: 'IIT M.Tech Cutoffs', question: 'How do IIT M.Tech admissions work and where can I find branch-wise cutoffs?' },
];

const Counselling: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (query: string) => {
    if (!query.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post('/advanced/counselling', { query, history });
      setMessages([...updatedMessages, { role: 'assistant', content: res.data.answer }]);
    } catch {
      setMessages([...updatedMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-200px)] flex flex-col">
      <div>
        <h1 className="text-4xl font-black text-white flex items-center gap-4 font-heading">
          <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 shadow-lg text-teal-400">
            <GraduationCap size={32} />
          </div>
          Counselling <span className="premium-text-gradient">Assistant</span>
        </h1>
        <p className="text-slate-400 font-medium mt-2">Expert guidance on GATE applications, COAP, CCMT, PSU recruitment, and M.Tech admissions.</p>
      </div>

      {/* Topic chips */}
      <div className="flex flex-wrap gap-3">
        {TOPIC_STARTERS.map((t) => (
          <button
            key={t.label}
            onClick={() => sendMessage(t.question)}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-bold hover:bg-teal-500/20 transition-all disabled:opacity-50"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col glass-card rounded-[2.5rem] overflow-hidden border-white/5 shadow-2xl min-h-0">
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
              <div className="w-16 h-16 rounded-3xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                <Sparkles size={32} />
              </div>
              <p className="text-slate-400 font-medium">Ask a question or pick a topic above to get started.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                msg.role === 'user'
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-600'
                  : 'bg-slate-800 border border-white/10 text-teal-400'
              }`}>
                {msg.role === 'user' ? <User size={18} className="text-white" /> : <Bot size={18} />}
              </div>
              <div className={`max-w-[80%] p-5 rounded-[1.5rem] text-base font-medium leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-violet-600/90 text-white rounded-tr-none'
                  : 'bg-white/[0.03] border border-white/5 text-slate-200 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-teal-400">
                <Bot size={18} />
              </div>
              <div className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask about GATE counselling, COAP, CCMT, PSU recruitment..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/5 transition-all text-white font-medium placeholder-slate-600"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-lg disabled:opacity-40 disabled:grayscale hover:scale-105 transition-transform"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Counselling;
