
import React from 'react';
import { Strain, StrainType } from '../types';
import { Trash2, Flower, Clock, Pencil, StickyNote, ExternalLink, Sprout } from 'lucide-react';

interface StrainItemProps {
  strain: Strain;
  onEdit: (strain: Strain) => void;
  onDelete: (id: string) => void;
  onPopSeeds: (strain: Strain) => void;
}

export const StrainItem: React.FC<StrainItemProps> = React.memo(({ strain, onEdit, onDelete, onPopSeeds }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group">
      <div className="absolute top-0 right-0 flex z-10">
        {strain.isLandrace && <span className={`bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-1 ${!strain.isAuto ? 'rounded-bl-lg' : ''}`}>Landrace</span>}
        {strain.isAuto && <span className="bg-amber-400 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg">Auto</span>}
      </div>
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            strain.type === StrainType.SATIVA ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
            strain.type === StrainType.INDICA ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
            'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          }`}>{strain.type}</span>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(strain)} className="text-gray-400 hover:text-blue-500 transition-colors mr-2"><Pencil size={16} /></button>
            <button onClick={() => onDelete(strain.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate">{strain.name}</h3>
          {strain.infoUrl && <a href={strain.infoUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-canopy-500"><ExternalLink size={14} /></a>}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3 truncate">{strain.breeder}</p>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mt-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span>Flower: <span className="font-semibold">{strain.floweringTimeWeeks} wks</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Flower size={16} className="text-gray-400" />
            <span>Seeds: <span className="font-semibold">{strain.inventoryCount}</span></span>
          </div>
        </div>
        {/* Notes Preview */}
        {strain.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
            <StickyNote size={12} className="inline mr-1" />
            {strain.notes}
          </div>
        )}
      </div>

      <button onClick={() => onPopSeeds(strain)} className="mt-4 w-full py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-canopy-50 dark:hover:bg-canopy-900/20 hover:text-canopy-600 dark:hover:text-canopy-400 transition-colors flex items-center justify-center gap-2">
        <Sprout size={16} /> Pop Seeds
      </button>
    </div>
  );
});
