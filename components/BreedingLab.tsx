
import React, { useState, useEffect } from 'react';
import { Strain, UserSettings, GeneticAnalysis, LineageNode } from '../types';
import { analyzeGenetics } from '../services/geminiService';
import { Dna, Activity, Zap, Sprout, Heart, Loader2, ArrowRight, GitMerge, Pencil, Save, X, Beaker, Leaf } from 'lucide-react';

interface BreedingLabProps {
  strains: Strain[];
  setStrains: React.Dispatch<React.SetStateAction<Strain[]>>;
  settings: UserSettings;
}

export const BreedingLab: React.FC<BreedingLabProps> = ({ strains, setStrains, settings }) => {
  const [selectedStrainId, setSelectedStrainId] = useState<string>(strains[0]?.id || '');
  const [analysis, setAnalysis] = useState<GeneticAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPheno, setExpandedPheno] = useState<string | null>(null);

  // Edit Lineage Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLineageData, setEditLineageData] = useState<{
    parents: LineageNode[],
    grandparents: LineageNode[]
  }>({ parents: [], grandparents: [] });

  const selectedStrain = strains.find(s => s.id === selectedStrainId);

  useEffect(() => {
    if (strains.length > 0 && !selectedStrainId) {
      setSelectedStrainId(strains[0].id);
    }
  }, [strains]);

  // Load existing lineage into view immediately if it exists
  useEffect(() => {
    if (selectedStrain) {
      // If we have stored lineage, use that as the base analysis (minus recommendations)
      if ((selectedStrain.parents && selectedStrain.parents.length > 0) || (selectedStrain.grandparents && selectedStrain.grandparents.length > 0)) {
        setAnalysis({
          strainName: selectedStrain.name,
          parents: selectedStrain.parents || [],
          grandparents: selectedStrain.grandparents || [],
          recommendations: analysis?.recommendations || [] // Keep recs if we have them, else empty
        });
      } else {
        // Clear if no saved lineage and no analysis run yet
        if (!analysis?.recommendations?.length) {
            setAnalysis(null);
        }
      }
    }
  }, [selectedStrainId, selectedStrain]); // Only run when selection changes or strain updates

  const runAnalysis = async () => {
    if (!selectedStrain) return;
    
    setIsLoading(true);
    setError(null);
    setExpandedPheno(null);
    
    try {
      const result = await analyzeGenetics(selectedStrain, strains, settings);
      setAnalysis(result);
    } catch (err) {
      setError("Failed to analyze genetics. Ensure AI settings are correct.");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = () => {
    setEditLineageData({
      parents: selectedStrain?.parents && selectedStrain.parents.length > 0 ? selectedStrain.parents : [{name: '', type: 'Hybrid'}, {name: '', type: 'Hybrid'}],
      grandparents: selectedStrain?.grandparents && selectedStrain.grandparents.length > 0 ? selectedStrain.grandparents : Array(4).fill({name: '', type: 'Hybrid'})
    });
    setIsEditModalOpen(true);
  };

  const handleLineageChange = (gen: 'parents' | 'grandparents', index: number, field: keyof LineageNode, value: string) => {
    setEditLineageData(prev => {
      const newList = [...prev[gen]];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, [gen]: newList };
    });
  };

  const saveLineage = () => {
    if (!selectedStrain) return;
    
    const cleanParents = editLineageData.parents.filter(p => p.name.trim() !== '');
    const cleanGrandparents = editLineageData.grandparents.filter(p => p.name.trim() !== '');

    setStrains(prev => prev.map(s => 
      s.id === selectedStrainId 
      ? { ...s, parents: cleanParents, grandparents: cleanGrandparents }
      : s
    ));
    
    setIsEditModalOpen(false);
  };
  
  const saveAiLineageToStrain = () => {
     if (!selectedStrain || !analysis) return;
     
     if (confirm("Overwrite this strain's genetic history with these AI results?")) {
        setStrains(prev => prev.map(s => 
          s.id === selectedStrainId 
          ? { ...s, parents: analysis.parents, grandparents: analysis.grandparents }
          : s
        ));
     }
  };

  const NodeTypeBadge = ({ type }: { type: string }) => {
    const colorClass = 
      type.toLowerCase().includes('sativa') ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
      type.toLowerCase().includes('indica') ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    
    return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colorClass}`}>{type}</span>;
  };

  const LineageCard = ({ node, role }: { node?: LineageNode, role: string }) => {
    if (!node || !node.name) return (
      <div className="flex flex-col items-center justify-center p-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-20 w-32 bg-gray-50 dark:bg-gray-800/50">
        <span className="text-xs text-gray-400">Unknown</span>
      </div>
    );
    
    return (
      <div className="flex flex-col items-center p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm w-32 relative group hover:border-canopy-400 transition-colors z-10">
        <span className="absolute -top-2 bg-gray-100 dark:bg-gray-700 text-[9px] text-gray-500 dark:text-gray-400 px-1 rounded">{role}</span>
        <div className="w-full text-center truncate font-semibold text-xs text-gray-800 dark:text-gray-200 mt-1 mb-1" title={node.name}>
          {node.name}
        </div>
        <NodeTypeBadge type={node.type} />
      </div>
    );
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-full text-canopy-600 dark:text-canopy-400 shadow-sm border border-gray-100 dark:border-gray-700">
            <Dna size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Breeding Lab</h1>
            <p className="text-gray-500 dark:text-gray-400">Analyze lineage & discover potential crosses</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
           <select 
             value={selectedStrainId}
             onChange={(e) => setSelectedStrainId(e.target.value)}
             className="bg-transparent text-gray-800 dark:text-white text-sm font-medium px-2 py-1.5 outline-none cursor-pointer min-w-[150px]"
           >
             {strains.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
           </select>
           <button 
             onClick={runAnalysis}
             disabled={isLoading}
             className="bg-canopy-600 hover:bg-canopy-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
           >
             {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
             Analyze
           </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Empty State / Prompt */}
      {!analysis && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500">
           <GitMerge size={48} className="mb-4 opacity-20" />
           <p className="font-medium mb-4">No genetic data displayed.</p>
           <div className="flex gap-3">
             <button onClick={openEditModal} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
               Add History Manually
             </button>
             <button onClick={runAnalysis} className="px-4 py-2 bg-canopy-50 dark:bg-canopy-900/20 text-canopy-700 dark:text-canopy-400 rounded-lg text-sm font-semibold hover:bg-canopy-100 dark:hover:bg-canopy-900/40 transition-colors">
               Analyze with AI
             </button>
           </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
           <div className="relative">
             <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
             <div className="w-16 h-16 border-4 border-canopy-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
             <Dna size={24} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-canopy-500" />
           </div>
           <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Mapping Genetic Markers...</p>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in pb-20">
          
          {/* Left Column: Ancestry Tree */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center overflow-x-auto relative">
            <div className="self-start w-full flex justify-between items-center mb-8">
               <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <GitMerge size={18} className="text-canopy-500" /> Genetic Lineage
              </h3>
              <div className="flex gap-2">
                 {/* Only show "Save AI" if the current analysis has data AND the strain doesn't have it saved yet */}
                 {(!selectedStrain?.parents || selectedStrain.parents.length === 0) && analysis.parents.length > 0 && (
                     <button onClick={saveAiLineageToStrain} className="text-xs bg-canopy-50 dark:bg-canopy-900/20 text-canopy-700 dark:text-canopy-400 px-3 py-1.5 rounded-lg font-bold hover:bg-canopy-100 dark:hover:bg-canopy-900/40 transition-colors flex items-center gap-1">
                       <Save size={12} /> Save AI Data
                     </button>
                 )}
                 <button onClick={openEditModal} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1">
                   <Pencil size={12} /> Edit
                 </button>
              </div>
            </div>
            
            <div className="flex flex-col items-center relative min-w-[300px]">
               {/* Gen 1: Grandparents */}
               <div className="flex gap-8 mb-8 relative">
                 <div className="flex gap-2">
                    <LineageCard node={analysis.grandparents?.[0]} role="GP 1" />
                    <LineageCard node={analysis.grandparents?.[1]} role="GP 2" />
                 </div>
                 <div className="flex gap-2">
                    <LineageCard node={analysis.grandparents?.[2]} role="GP 3" />
                    <LineageCard node={analysis.grandparents?.[3]} role="GP 4" />
                 </div>
                 
                 {/* Connectors */}
                 <svg className="absolute top-full left-0 w-full h-8 pointer-events-none stroke-gray-300 dark:stroke-gray-600" fill="none">
                    <path d="M 70 0 V 15 H 150 V 32" strokeWidth="1.5" /> 
                    <path d="M 230 0 V 15 H 310 V 32" strokeWidth="1.5" />
                 </svg>
               </div>

               {/* Gen 2: Parents */}
               <div className="flex gap-24 mb-8 relative">
                  <LineageCard node={analysis.parents?.[0]} role="Mother" />
                  <LineageCard node={analysis.parents?.[1]} role="Father" />
                  
                   {/* Connectors */}
                   <svg className="absolute top-full left-0 w-full h-8 pointer-events-none stroke-gray-300 dark:stroke-gray-600" fill="none">
                    <path d="M 64 0 V 15 H 192 V 32" strokeWidth="1.5" /> 
                    <path d="M 320 0 V 15 H 192 V 32" strokeWidth="1.5" />
                 </svg>
               </div>

               {/* Gen 3: Target */}
               <div className="p-4 bg-canopy-50 dark:bg-canopy-900/20 border-2 border-canopy-500 rounded-xl shadow-lg w-48 text-center relative z-10">
                 <div className="font-bold text-gray-800 dark:text-white text-lg">{analysis.strainName}</div>
                 <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedStrain?.breeder}</div>
               </div>
            </div>
          </div>

          {/* Right Column: Breeding Suggestions */}
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Beaker size={18} className="text-pink-500" /> Breeding Lab
                </h3>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">Based on Inventory</span>
             </div>

             <div className="grid gap-4">
                {analysis.recommendations.map((rec, idx) => {
                  const isExpanded = expandedPheno === rec.partnerId;
                  
                  return (
                  <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-canopy-100 to-transparent dark:from-canopy-900/20 rounded-bl-full opacity-50"></div>
                    
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4">
                       <div className="bg-gray-100 dark:bg-gray-800 p-2.5 rounded-lg text-gray-500 dark:text-gray-400">
                          <Sprout size={20} />
                       </div>
                       <ArrowRight size={16} className="text-gray-300 dark:text-gray-600" />
                       <div className="bg-pink-50 dark:bg-pink-900/20 p-2.5 rounded-lg text-pink-500 dark:text-pink-400">
                          <Heart size={20} />
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Breeding Partner</div>
                          <div className="font-bold text-gray-800 dark:text-gray-200">{rec.partnerName}</div>
                       </div>
                    </div>

                    {/* Result Name */}
                    <div className="pl-3 border-l-2 border-canopy-500 ml-1 mb-4">
                       <div className="text-xs font-semibold text-canopy-600 dark:text-canopy-400 mb-0.5">Projected Offspring</div>
                       <div className="text-2xl font-black text-gray-800 dark:text-white font-mono tracking-tight">{rec.projectedName}</div>
                    </div>

                    {/* Analysis */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                       {rec.synergyAnalysis}
                    </p>

                    {/* Terpenes */}
                    {rec.dominantTerpenes && rec.dominantTerpenes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {rec.dominantTerpenes.map((terp, i) => (
                           <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800 flex items-center gap-1">
                             <Leaf size={8} /> {terp}
                           </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Pheno Simulator Toggle */}
                    <button 
                      onClick={() => setExpandedPheno(isExpanded ? null : rec.partnerId)}
                      className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                        isExpanded 
                          ? 'bg-canopy-100 text-canopy-800 dark:bg-canopy-900/40 dark:text-canopy-300' 
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-canopy-50 dark:hover:bg-canopy-900/20'
                      }`}
                    >
                       <Zap size={14} className={isExpanded ? 'fill-current' : ''} /> 
                       {isExpanded ? 'Hide Phenotypes' : 'Simulate Phenotypes'}
                    </button>

                    {/* Pheno Reveal Section */}
                    {isExpanded && rec.potentialPhenotypes && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-fade-in space-y-3">
                         <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Expected Variations</h4>
                         {rec.potentialPhenotypes.map((pheno, pIdx) => (
                           <div key={pIdx} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm border border-gray-100 dark:border-gray-800/50">
                             <div className="font-bold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-canopy-500"></div>
                               {pheno.name}
                             </div>
                             <div className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                               {pheno.description}
                             </div>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                )})}
                {(!analysis.recommendations || analysis.recommendations.length === 0) && (
                   <div className="text-center py-8 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      Click "Analyze" to generate breeding suggestions based on your library.
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Manual Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-fade-in border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
               <div>
                 <h3 className="text-xl font-bold text-gray-800 dark:text-white">Edit Genetic History</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Manually record ancestry for {selectedStrain?.name}</p>
               </div>
               <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                 <X size={20} />
               </button>
             </div>

             <div className="p-6 space-y-6">
                {/* Parents Section */}
                <div>
                   <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3 border-b border-gray-100 dark:border-gray-800 pb-1">Parents (Generation 1)</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Parent 1 */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                         <div className="text-xs font-semibold mb-2 text-canopy-600 dark:text-canopy-400">Mother</div>
                         <div className="space-y-2">
                           <input 
                             placeholder="Strain Name" 
                             value={editLineageData.parents[0]?.name || ''}
                             onChange={(e) => handleLineageChange('parents', 0, 'name', e.target.value)}
                             className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                           />
                           <select 
                             value={editLineageData.parents[0]?.type || 'Hybrid'}
                             onChange={(e) => handleLineageChange('parents', 0, 'type', e.target.value)}
                             className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                           >
                             <option value="Indica">Indica</option>
                             <option value="Sativa">Sativa</option>
                             <option value="Hybrid">Hybrid</option>
                             <option value="Unknown">Unknown</option>
                           </select>
                         </div>
                      </div>
                      
                      {/* Parent 2 */}
                       <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                         <div className="text-xs font-semibold mb-2 text-canopy-600 dark:text-canopy-400">Father</div>
                         <div className="space-y-2">
                           <input 
                             placeholder="Strain Name" 
                             value={editLineageData.parents[1]?.name || ''}
                             onChange={(e) => handleLineageChange('parents', 1, 'name', e.target.value)}
                             className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                           />
                           <select 
                             value={editLineageData.parents[1]?.type || 'Hybrid'}
                             onChange={(e) => handleLineageChange('parents', 1, 'type', e.target.value)}
                             className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                           >
                             <option value="Indica">Indica</option>
                             <option value="Sativa">Sativa</option>
                             <option value="Hybrid">Hybrid</option>
                             <option value="Unknown">Unknown</option>
                           </select>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Grandparents Section */}
                 <div>
                   <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3 border-b border-gray-100 dark:border-gray-800 pb-1">Grandparents (Generation 2)</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                           <div className="text-xs font-semibold mb-2 text-gray-400">GP {idx + 1}</div>
                           <div className="space-y-2">
                             <input 
                               placeholder="Name" 
                               value={editLineageData.grandparents[idx]?.name || ''}
                               onChange={(e) => handleLineageChange('grandparents', idx, 'name', e.target.value)}
                               className="w-full text-xs p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                             />
                             <select 
                               value={editLineageData.grandparents[idx]?.type || 'Hybrid'}
                               onChange={(e) => handleLineageChange('grandparents', idx, 'type', e.target.value)}
                               className="w-full text-xs p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                             >
                               <option value="Indica">Indica</option>
                               <option value="Sativa">Sativa</option>
                               <option value="Hybrid">Hybrid</option>
                               <option value="Unknown">Unknown</option>
                             </select>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button onClick={saveLineage} className="px-6 py-2 rounded-lg bg-canopy-600 text-white font-bold hover:bg-canopy-700 transition-colors shadow-sm">
                  Save Lineage
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
