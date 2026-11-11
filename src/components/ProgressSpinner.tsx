import React from 'react';
import { Spinner } from '@phosphor-icons/react';

interface ProgressSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressSpinner: React.FC<ProgressSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <Spinner
      className={`${sizeClasses[size]} text-rose-500 animate-spin ${className}`}
      weight="duotone"
    />
  );
};

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '' }) => {
  return (
    <div className={`w-full h-2 bg-white/10 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-rose-500 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};