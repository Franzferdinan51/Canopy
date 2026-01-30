import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full w-full bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-canopy-600 dark:text-canopy-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading Canopy...</span>
      </div>
    </div>
  );
};
