import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', padding = 'p-6' }) => {
  return (
    <div className={`glass-panel ${padding} ${className}`}>
      {children}
    </div>
  );
};

interface GlassCardSmallProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCardSmall: React.FC<GlassCardSmallProps> = ({ children, className = '' }) => {
  return (
    <div className={`glass-card ${className}`}>
      {children}
    </div>
  );
};