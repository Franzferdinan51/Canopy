import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 animate-in fade-in duration-500">
      <div className="bg-canopy-50 dark:bg-canopy-900/20 p-4 rounded-full mb-4">
        <Icon size={48} className="text-canopy-600 dark:text-canopy-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6 text-sm">{description}</p>
      <button
        onClick={onAction}
        className="bg-canopy-600 hover:bg-canopy-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {actionLabel}
      </button>
    </div>
  );
};
