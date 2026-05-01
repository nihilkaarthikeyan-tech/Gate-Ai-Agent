import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, Sparkles, MessageSquare, Plus } from 'lucide-react';
import { tutorApi, streamChat } from '../lib/api';
import ReactMarkdown from 'react-markdown';

const Tutor: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tutorApi.getSessions().then(res => setSessions(res.data));
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      tutorApi.getSession(currentSessionId).then(res => setMessages(res.data.messages));
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      const res = await tutorApi.createSession(input.slice(0, 30) + '...', 'General');
      sessionId = res.data.id;
      setCurrentSessionId(sessionId);
      setSessions([res.data, ...sessions]);
    }

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setIsTyping(true);

    let assistantContent = '';
    const assistantMsg = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      await streamChat(
        newMessages,
        'Computer Science',
        (chunk) => {
          assistantContent += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = assistantContent;
            return updated;
          });
        },
        async () => {
          setLoading(false);
          setIsTyping(false);
          await tutorApi.saveMessage(sessionId!, 'user', input);
          await tutorApi.saveMessage(sessionId!, 'assistant', assistantContent);
        },
        (err) => {
          console.error(err);
          setLoading(false);
          setIsTyping(false);
        }
      );
    } catch (err) {
      setLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-180px)] gap-6 animate-in fade-in duration-700">
      {/* Sessions Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        <button 
          onClick={() => setCurrentSessionId(null)}
          className="w-full py-4 premium-gradient rounded-2xl flex items-center justify-center gap-2 font-bold text-white shadow-lg glow-primary hover:scale-[1.02] transition-transform"
        >
          <Plus size={20} /> New Consultation
        </button>
        
        <div className="flex-1 glass-card rounded-[2rem] p-4 flex flex-col gap-2 overflow-y-auto">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-4 py-2">Recent Sessions</p>
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setCurrentSessionId(s.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-left group ${
                currentSessionId === s.id 
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <MessageSquare size={18} className={currentSessionId === s.id ? 'text-violet-400' : 'text-slate-600'} />
              <span className="text-sm font-medium truncate flex-1">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col glass-card rounded-[2rem] overflow-hidden border-white/[0.05]">
        {/* Chat Header */}
        <div className="px-8 py-5 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Bot className="text-violet-400" size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold">GATE Intelligence Engine</h3>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online & Ready
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Powered by Claude 3.5 Sonnet
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-violet-500/10 flex items-center justify-center animate-float">
                <Sparkles className="text-violet-400" size={40} />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-bold text-white font-heading">How can I accelerate your learning?</h4>
                <p className="text-slate-400 font-medium">Ask me about complex theorems, numerical problems, or your study strategy. I'm trained on 30 years of GATE data.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                {['Explain P vs NP', 'Dijkstra Complexity', 'Mock Test Strategy', 'OS Scheduling'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => setInput(tag)}
                    className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-bold text-slate-400 hover:text-white hover:bg-violet-500/10 hover:border-violet-500/20 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-600' 
                    : 'bg-slate-800 border border-white/10'
                }`}>
                  {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-violet-400" />}
                </div>
                <div className={`flex flex-col space-y-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-5 rounded-3xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-violet-600/90 text-white rounded-tr-none' 
                      : 'bg-white/[0.03] border border-white/5 text-slate-200 rounded-tl-none'
                  }`}>
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950/50">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest px-2">
                    {msg.role === 'user' ? 'You' : 'AI Tutor'}
                  </span>
                </div>
              </div>
            ))
          )}
          {isTyping && (
             <div className="flex gap-6">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shadow-lg">
                  <Bot size={20} className="text-violet-400" />
                </div>
                <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 rounded-tl-none flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 bg-white/[0.01] border-t border-white/[0.05]">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question here (e.g. explain TCP flow control)..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-5 pr-16 focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all text-white placeholder-slate-600 font-medium"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl premium-gradient flex items-center justify-center text-white shadow-lg disabled:opacity-50 disabled:grayscale hover:scale-105 transition-transform"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-4">
            Press Enter to transmit • AI can make mistakes, verify important formulas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tutor;
