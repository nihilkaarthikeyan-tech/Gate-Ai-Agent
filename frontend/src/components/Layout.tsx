import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Calendar, MessageSquare, FileText,
  BarChart2, Zap, Camera, BrainCircuit, Smile, Briefcase,
  LogOut, ChevronLeft, ChevronRight, StickyNote, Sparkles, GraduationCap
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const MENU = [
  { section: 'Core',       items: [
    { name: 'Dashboard',     icon: LayoutDashboard, path: '/' },
    { name: 'Study Planner', icon: Calendar,        path: '/planner' },
    { name: 'AI Tutor',      icon: MessageSquare,   path: '/tutor' },
  ]},
  { section: 'Practice',   items: [
    { name: 'Mock Tests',    icon: Zap,             path: '/mock-tests' },
    { name: 'PYQ Vault',     icon: FileText,        path: '/pyqs' },
    { name: 'Flashcards',    icon: BookOpen,        path: '/flashcards' },
    { name: 'Shortcuts',     icon: BrainCircuit,    path: '/shortcuts' },
    { name: 'Notes',         icon: StickyNote,      path: '/notes' },
  ]},
  { section: 'Analytics',  items: [
    { name: 'Weak Areas',    icon: BarChart2,       path: '/weak-areas' },
  ]},
  { section: 'Advanced',   items: [
    { name: 'Photo Solver',  icon: Camera,          path: '/photo-solver' },
    { name: 'Counselling',   icon: GraduationCap,   path: '/counselling' },
    { name: 'Motivation',    icon: Smile,           path: '/motivation' },
    { name: 'Interview Prep',icon: Briefcase,       path: '/interview-prep' },
  ]},
];

const Layout: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-[#05070a] text-slate-100 overflow-hidden font-sans">
      {/* Premium Sidebar */}
      <aside
        className={`${collapsed ? 'w-20' : 'w-72'} glass-sidebar flex flex-col transition-all duration-500 ease-in-out flex-shrink-0 relative z-20`}
      >
        {/* Logo Section */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-6 mb-4`}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center glow-primary">
                <Sparkles className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight premium-text-gradient">
                  GATE AI
                </h1>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Agent Pro</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-2 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all border border-transparent hover:border-slate-700"
          >
            {collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-8 scrollbar-hide">
          {MENU.map(({ section, items }) => (
            <div key={section} className="space-y-3">
              {!collapsed && (
                <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-[0.2em] px-4">{section}</p>
              )}
              <div className="space-y-1.5">
                {items.map(({ name, icon: Icon, path }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={name}
                      to={path}
                      title={collapsed ? name : undefined}
                      className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                        active
                          ? 'nav-item-active text-white bg-violet-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon 
                        size={20} 
                        className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'text-violet-400' : 'group-hover:text-violet-300'}`}
                      />
                      {!collapsed && <span className="font-medium text-[15px]">{name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Area */}
        <div className="p-4 mt-auto">
          <div className="glass-card rounded-2xl p-4 border border-white/5 bg-white/[0.03]">
            {!collapsed && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg border border-white/20">
                  {user?.name?.[0].toUpperCase() ?? 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user?.name ?? 'Student'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email ?? ''}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full rounded-xl transition-all duration-300 font-semibold text-sm ${
                collapsed 
                  ? 'justify-center py-2 text-slate-400 hover:text-red-400' 
                  : 'px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300'
              }`}
            >
              <LogOut size={18}/>
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* High-end Header */}
        <header className="h-20 bg-transparent border-b border-white/[0.05] flex items-center justify-between px-10 flex-shrink-0 z-10 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-sm text-slate-400 font-medium">Hello, <span className="text-white font-bold">{user?.name ?? 'Student'}</span></h2>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide">Ready for your next challenge?</p>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-white/5 text-xs font-bold text-slate-300">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               Live System Status: Optimal
             </div>
            <div className="px-5 py-2.5 premium-gradient rounded-xl text-xs font-extrabold text-white shadow-lg glow-primary tracking-wider uppercase">
              {user?.targetPaper ? `GATE ${user.targetPaper}` : 'GATE CS 2026'}
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-10 relative z-10 scrollbar-hide">
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Outlet/>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
