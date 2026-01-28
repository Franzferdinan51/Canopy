import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-[50vh] text-canopy-600 dark:text-canopy-400">
      <Loader2 size={48} className="animate-spin" />
    </div>
  );
};
