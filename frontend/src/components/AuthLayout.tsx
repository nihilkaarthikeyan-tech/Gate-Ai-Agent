import React from 'react';

const AuthLayout: React.FC<{ children: React.ReactNode; title: string; subtitle: string }> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            GATE AI
          </h1>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-slate-400 mt-2">{subtitle}</p>
        </div>
        
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-xl bg-opacity-80">
          {children}
        </div>
        
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm italic">
            "The best way to predict your GATE rank is to create it."
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
