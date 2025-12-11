
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Nutrient, Strain, StrainType, NutrientType, View } from '../types';
import { Leaf, Droplets, Sprout, Wind, AlertTriangle, TrendingDown, PlusCircle, ArrowRight } from 'lucide-react';

interface DashboardProps {
  nutrients: Nutrient[];
  strains: Strain[];
  onViewChange?: (view: View) => void;
}

// Fixed Color Mapping for Consistency
const STRAIN_COLORS = {
  [StrainType.INDICA]: '#8b5cf6',   // Purple
  [StrainType.SATIVA]: '#ef4444',   // Red/Orange
  [StrainType.HYBRID]: '#22c55e',   // Green
  [StrainType.RUDERALIS]: '#f59e0b', // Amber/Yellow
};

export const Dashboard: React.FC<DashboardProps> = ({ nutrients, strains, onViewChange }) => {
  
  // Data for Strain Type Distribution
  const strainTypeData = React.useMemo(() => {
    const counts = {
      [StrainType.INDICA]: 0,
      [StrainType.SATIVA]: 0,
      [StrainType.HYBRID]: 0,
      [StrainType.RUDERALIS]: 0,
    };
    strains.forEach(s => { 
      if(counts[s.type] !== undefined) counts[s.type]++; 
      else counts[StrainType.HYBRID]++; // Fallback
    });
    
    return Object.keys(counts).map(key => ({ 
      name: key, 
      value: counts[key as StrainType],
      color: STRAIN_COLORS[key as StrainType]
    }));
  }, [strains]);

  // Data for Nutrient Types
  const nutrientTypeData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    nutrients.forEach(n => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [nutrients]);

  // Data for Top Strains (by Inventory Count)
  const topStrainsData = React.useMemo(() => {
    // Sort by inventory count descending
    return [...strains]
      .sort((a, b) => b.inventoryCount - a.inventoryCount)
      .slice(0, 5)
      .map(s => ({ name: s.name, value: s.inventoryCount }));
  }, [strains]);

  // Low Stock Alerts
  const lowStockNutrients = nutrients.filter(n => (n.bottleCount || 0) <= 1);
  const lowStockSeeds = strains.filter(s => s.inventoryCount < 3);

  const totalSeeds = strains.reduce((acc, curr) => acc + curr.inventoryCount, 0);
  const totalBottles = nutrients.reduce((acc, curr) => acc + (curr.bottleCount || 1), 0);

  return (
    <div className="p-6 h-full overflow-y-auto pb-20 bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Command Center</h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome back, grower.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => onViewChange?.('nutrients')} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors">
              <PlusCircle size={16} /> Add Nutrient
           </button>
           <button onClick={() => onViewChange?.('strains')} className="bg-canopy-600 hover:bg-canopy-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors">
              <PlusCircle size={16} /> Add Strain
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-28 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Strains</span>
                <div className="p-2 bg-canopy-100 dark:bg-canopy-900/30 rounded-full text-canopy-600 dark:text-canopy-400"><Sprout size={18} /></div>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{strains.length}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-28 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Nutrients</span>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400"><Droplets size={18} /></div>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalBottles}<span className="text-sm text-gray-400 font-normal ml-1">btls</span></p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-28 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Seeds</span>
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400"><Leaf size={18} /></div>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalSeeds}</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-28 transition-colors">
               <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Avg Flower</span>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400"><Wind size={18} /></div>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {strains.length > 0 ? Math.round(strains.reduce((acc, s) => acc + s.floweringTimeWeeks, 0) / strains.length) : 0}<span className="text-sm text-gray-400 font-normal ml-1">wks</span>
              </p>
            </div>
          </div>

          {/* Genetic Diversity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 min-h-[320px] flex flex-col transition-colors">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Genetic Profile</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Distribution by strain type</p>
              
              <div className="flex-1 flex items-center justify-center">
                 {strains.length > 0 ? (
                  <div className="w-full h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={strainTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {strainTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#1f2937', color: '#fff' }} 
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Custom Legend */}
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                       {strainTypeData.map((type) => (
                         <div key={type.name} className="flex items-center gap-1.5 opacity-90">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }}></div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{type.name}</span>
                            <span className="text-xs text-gray-400">({type.value})</span>
                         </div>
                       ))}
                    </div>
                  </div>
                ) : (
                   <div className="text-center text-gray-400 dark:text-gray-600">
                     <Sprout size={40} className="mx-auto mb-2 opacity-20" />
                     <p className="text-sm">No genetics data</p>
                   </div>
                )}
              </div>
            </div>

            {/* Top Strains Chart (Largest Stashes) */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 min-h-[320px] flex flex-col transition-colors">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Largest Stashes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Strains with the most seeds</p>
              <div className="flex-1">
                 {topStrainsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topStrainsData} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" opacity={0.2} />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={130} tick={{fontSize: 11, fill: '#9ca3af'}} interval={0} />
                      <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#1f2937', color: '#fff' }} 
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={16} name="Seeds" />
                    </BarChart>
                  </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">No inventory data</div>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Insights & Actions */}
        <div className="space-y-6">
          
          {/* AI Quick Insight */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer" onClick={() => onViewChange?.('assistant')}>
             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-3">
                 <div className="p-1.5 bg-white/20 rounded-lg">
                   <Wind size={16} className="text-white" />
                 </div>
                 <span className="font-semibold text-sm text-indigo-100">AI Grow Assistant</span>
               </div>
               <h3 className="text-xl font-bold mb-2">Inventory Analysis</h3>
               <p className="text-indigo-100 text-sm mb-4">
                 Ask Canopy to analyze your nutrient balance or suggest a feeding schedule based on your current stock.
               </p>
               <div className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 w-fit px-3 py-2 rounded-lg transition-colors">
                 Start Analysis <ArrowRight size={14} />
               </div>
             </div>
             <div className="absolute -bottom-4 -right-4 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
             <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
               <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                 <TrendingDown size={18} className="text-amber-500" /> 
                 Low Stock Alerts
               </h3>
               {(lowStockNutrients.length + lowStockSeeds.length) > 0 && (
                 <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
                   {lowStockNutrients.length + lowStockSeeds.length} Items
                 </span>
               )}
             </div>
             <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[300px] overflow-y-auto">
               {lowStockNutrients.map(n => (
                 <div key={n.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center justify-between group transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                         <Droplets size={16} />
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{n.name}</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400">{n.brand}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">{n.bottleCount} left</span>
                    </div>
                 </div>
               ))}
                {lowStockSeeds.map(s => (
                 <div key={s.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center justify-between group transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">
                         <Sprout size={16} />
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.name}</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400">{s.breeder}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">{s.inventoryCount} seeds</span>
                    </div>
                 </div>
               ))}
               
               {lowStockNutrients.length === 0 && lowStockSeeds.length === 0 && (
                 <div className="p-8 text-center text-gray-400 dark:text-gray-600">
                    <div className="bg-green-50 dark:bg-green-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 text-green-500 dark:text-green-400">
                       <Leaf size={20} />
                    </div>
                    <p className="text-sm">Inventory levels look healthy!</p>
                 </div>
               )}
             </div>
          </div>
          
          {/* Nutrient Type Breakdown */}
           <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Nutrient Types</h3>
              <div className="space-y-3">
                 {nutrientTypeData.map((type, idx) => (
                   <div key={type.name}>
                     <div className="flex justify-between text-xs mb-1">
                       <span className="font-medium text-gray-600 dark:text-gray-300">{type.name}</span>
                       <span className="text-gray-400">{type.value} items</span>
                     </div>
                     <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                       <div 
                         className="h-2 rounded-full transition-all duration-500" 
                         style={{ 
                           width: `${(type.value / nutrients.length) * 100}%`,
                           backgroundColor: ['#16a34a', '#8b5cf6', '#3b82f6', '#f59e0b'][idx % 4] 
                         }}
                       ></div>
                     </div>
                   </div>
                 ))}
                 {nutrientTypeData.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No nutrients added</p>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
