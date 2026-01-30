import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 transition-colors animate-fade-in h-full min-h-[400px]">
    <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm mb-4 ring-1 ring-gray-100 dark:ring-gray-700">
      <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" aria-hidden="true" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">{description}</p>
    <button
      onClick={onAction}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-canopy-600 rounded-lg hover:bg-canopy-700 focus:outline-none focus:ring-4 focus:ring-canopy-500/20 transition-all shadow-sm hover:shadow-md active:scale-95"
    >
      {actionLabel}
    </button>
  </div>
);
