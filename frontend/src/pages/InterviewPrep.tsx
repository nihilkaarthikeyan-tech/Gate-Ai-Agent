import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, Mic, Send, Bot, User, Loader2, Sparkles, Terminal } from 'lucide-react';
import { api } from '../lib/api';

const InterviewPrep: React.FC = () => {
  const [messages, setMessages] = useState<{role: 'system'|'user', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startMockInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post('/advanced/interview-prep/start');
      setMessages([{ role: 'system', content: res.data.question }]);
      setSessionId(res.data.sessionId);
      setSessionActive(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: 'user' as const, content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/advanced/interview-prep/message', {
        messages: newMessages,
        sessionId,
      });
      setMessages([...newMessages, { role: 'system', content: res.data.question }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: 'system', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-200px)] flex flex-col">
      <div>
        <h1 className="text-4xl font-black text-white flex items-center gap-4 font-heading">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-lg text-amber-400">
            <Briefcase size={32} />
          </div>
          Interview <span className="premium-text-gradient">Simulator</span>
        </h1>
        <p className="text-slate-400 font-medium mt-2">Elite mock interviews for BARC, ISRO, and IIT M.Tech admissions.</p>
      </div>

      {!sessionActive ? (
        <div className="glass-card rounded-[3rem] p-20 text-center flex-1 flex flex-col items-center justify-center border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none"></div>
          <div className="w-24 h-24 bg-amber-500/10 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl animate-float relative z-10">
            <Mic className="text-amber-400 w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 relative z-10 font-heading tracking-tight">Deploy Interview Protocol?</h2>
          <p className="text-slate-400 max-w-lg mb-10 text-lg font-medium relative z-10 leading-relaxed">
            Our AI interviewer will evaluate your technical depth, problem-solving speed, and communication clarity. Prepare as if it's the real thing.
          </p>
          <button 
            onClick={startMockInterview}
            disabled={loading}
            className="px-10 py-5 bg-gradient-to-tr from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 relative z-10 tracking-wider"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <><Sparkles size={24} /> INITIALIZE SIMULATION</>}
          </button>
          
          <div className="mt-12 grid grid-cols-3 gap-8 relative z-10">
            <div className="text-center">
              <p className="text-white font-bold text-sm">30,000+</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Question Bank</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm">Real-time</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Feedback Loop</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-sm">Adaptive</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Difficulty</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col glass-card rounded-[2.5rem] overflow-hidden border-white/5 shadow-2xl">
          {/* Simulation Header */}
          <div className="px-10 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Terminal size={28} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Active Simulation Session</h3>
                <p className="text-xs text-amber-500 font-bold flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> RECORDING IN PROGRESS
                </p>
              </div>
            </div>
            <button 
              onClick={() => { if(window.confirm('Terminate simulation? Data will be lost.')) setSessionActive(false); }}
              className="px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all uppercase tracking-widest"
            >
              Terminate
            </button>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                  msg.role === 'user' ? 'bg-gradient-to-tr from-violet-600 to-indigo-600' : 'bg-slate-800 border border-white/10 text-amber-400'
                }`}>
                  {msg.role === 'user' ? <User size={24} className="text-white"/> : <Bot size={24}/>}
                </div>
                <div className={`flex flex-col space-y-2 max-w-[75%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-6 rounded-[2rem] text-lg font-medium leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-violet-600/90 text-white rounded-tr-none' 
                      : 'bg-white/[0.03] border border-white/5 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest px-4">
                    {msg.role === 'user' ? 'Cadet Response' : 'Interviewer AI'}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-6 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-amber-400">
                  <Bot size={24}/>
                </div>
                <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 rounded-tl-none flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                  <span className="ml-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Processing response...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
          
          {/* Input Area */}
          <div className="p-10 bg-white/[0.01] border-t border-white/5">
            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="State your answer clearly..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-[2rem] px-8 py-6 pr-20 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all text-white text-lg font-medium placeholder-slate-700"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 disabled:opacity-50 disabled:grayscale hover:scale-105 transition-transform"
              >
                <Send size={24} />
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-6">
              Simulation Environment Locked • Answer precisely to increase score
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;
