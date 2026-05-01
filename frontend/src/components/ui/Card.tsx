import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hoverable = false }) => {
  return (
    <div className={`
      bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-6
      ${hoverable ? 'hover:border-slate-600 hover:bg-slate-800 transition-all duration-300' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;
