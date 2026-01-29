import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-canopy-600 dark:text-canopy-400" size={48} />
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Canopy...</p>
      </div>
    </div>
  );
};
