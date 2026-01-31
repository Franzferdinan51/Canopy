import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center p-12">
      <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
        <Loader2 className="animate-spin text-canopy-600 dark:text-canopy-400" size={48} />
        <p className="font-medium animate-pulse">Growing...</p>
      </div>
    </div>
  );
};
