import React from 'react';
import { Nutrient, NutrientType } from '../types';
import { Pencil, Trash2, Package, DollarSign, History } from 'lucide-react';

interface NutrientItemProps {
  nutrient: Nutrient;
  onEdit: (nutrient: Nutrient) => void;
  onDelete: (id: string) => void;
  onLog: (nutrient: Nutrient) => void;
}

export const NutrientItem = React.memo(({ nutrient, onEdit, onDelete, onLog }: NutrientItemProps) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 flex flex-col justify-between hover:shadow-md transition-all group">
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            nutrient.type === NutrientType.BASE ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
            nutrient.type === NutrientType.ADDITIVE ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            {nutrient.type}
          </span>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(nutrient)} className="text-gray-400 hover:text-blue-500 transition-colors mr-2" title="Edit">
              <Pencil size={16} />
            </button>
            <button onClick={() => onDelete(nutrient.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate">{nutrient.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3">{nutrient.brand}</p>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xs font-bold text-blue-500">N</span>
            <span>NPK: <span className="font-mono font-medium">{nutrient.npk}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Package size={14} className="text-blue-500" />
            <span>{nutrient.bottleCount} bottles ({nutrient.volumeLiters}L)</span>
          </div>
          {nutrient.cost && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <DollarSign size={14} />
              <span>${nutrient.cost} / unit</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => onLog(nutrient)}
        className="mt-4 w-full py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-canopy-50 dark:hover:bg-canopy-900/20 hover:text-canopy-600 dark:hover:text-canopy-400 transition-colors flex items-center justify-center gap-2"
      >
        <History size={16} /> Log Dose / Usage
      </button>
    </div>
  );
});

NutrientItem.displayName = 'NutrientItem';
