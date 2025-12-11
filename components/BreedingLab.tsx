
import React, { useState, useEffect } from 'react';
import { Strain, UserSettings, GeneticAnalysis, LineageNode, BreedingProject, BreedingStatus } from '../types';
import { analyzeGenetics } from '../services/geminiService';
import { Dna, Activity, Zap, Sprout, Heart, Loader2, ArrowRight, GitMerge, Pencil, Save, X, Beaker, Leaf, Plus, ClipboardList, Move, Trash2, Bot } from 'lucide-react';

interface BreedingLabProps {
  strains: Strain[];
  setStrains: React.Dispatch<React.SetStateAction<Strain[]>>;
  breedingProjects?: BreedingProject[];
  setBreedingProjects?: React.Dispatch<React.SetStateAction<BreedingProject[]>>;
  settings: UserSettings;
  onTriggerAI?: (prompt: string) => void;
}

const STATUS_COLUMNS: BreedingStatus[] = ['Planning', 'Pollination', 'Seed Harvest', 'Pheno Hunting', 'Completed'];

export const BreedingLab: React.FC<BreedingLabProps> = ({ strains, setStrains, breedingProjects = [], setBreedingProjects, settings, onTriggerAI }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'projects'>('analysis');
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

  // New Project Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    motherId: '',
    fatherId: '',
    notes: ''
  });

  const selectedStrain = strains.find(s => s.id === selectedStrainId);

  useEffect(() => {
    if (strains.length > 0 && !selectedStrainId) {
      setSelectedStrainId(strains[0].id);
    }
  }, [strains]);

  // Load existing lineage into view immediately if it exists
  useEffect(() => {
    if (selectedStrain) {
      if ((selectedStrain.parents && selectedStrain.parents.length > 0) || (selectedStrain.grandparents && selectedStrain.grandparents.length > 0)) {
        setAnalysis({
          strainName: selectedStrain.name,
          parents: selectedStrain.parents || [],
          grandparents: selectedStrain.grandparents || [],
          recommendations: analysis?.recommendations || [] 
        });
      } else {
        if (!analysis?.recommendations?.length) {
            setAnalysis(null);
        }
      }
    }
  }, [selectedStrainId, selectedStrain]); 

  // --- Analysis Functions ---

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

  // --- Project Board Functions ---

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setBreedingProjects) return;
    const mother = strains.find(s => s.id === newProject.motherId);
    const father = strains.find(s => s.id === newProject.fatherId);
    
    // Auto-generate name if empty
    const projectName = newProject.name || `${mother?.name || 'Unknown'} x ${father?.name || 'Unknown'}`;

    const project: BreedingProject = {
      id: crypto.randomUUID(),
      name: projectName,
      motherId: newProject.motherId,
      fatherId: newProject.fatherId,
      status: 'Planning',
      startDate: new Date().toLocaleDateString(),
      notes: newProject.notes
    };

    setBreedingProjects(prev => [...prev, project]);
    setIsProjectModalOpen(false);
    setNewProject({ name: '', motherId: '', fatherId: '', notes: '' });
  };

  const deleteProject = (id: string) => {
    if(confirm("Delete this breeding project?") && setBreedingProjects) {
      setBreedingProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("projectId", id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, status: BreedingStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("projectId");
    if(setBreedingProjects) {
      setBreedingProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    }
  };

  // --- Sub-components ---

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-full text-canopy-600 dark:text-canopy-400 shadow-sm border border-gray-100 dark:border-gray-700">
            <Dna size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Breeding Lab</h1>
            <p className="text-gray-500 dark:text-gray-400">Plan crosses & track genetic projects</p>
          </div>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
           <button 
             onClick={() => setActiveTab('analysis')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'analysis' ? 'bg-canopy-100 text-canopy-700 dark:bg-canopy-900/30 dark:text-canopy-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
           >
             <Activity size={16} /> Analysis
           </button>
           <button 
             onClick={() => setActiveTab('projects')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'projects' ? 'bg-canopy-100 text-canopy-700 dark:bg-canopy-900/30 dark:text-canopy-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
           >
             <ClipboardList size={16} /> Project Board
           </button>
        </div>
      </div>

      {/* --- Analysis View --- */}
      {activeTab === 'analysis' && (
        <>
            <div className="flex items-center gap-2 mb-8 bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-800 w-fit shadow-sm">
                <span className="text-sm font-medium ml-2 text-gray-500">Target Strain:</span>
                <select 
                    value={selectedStrainId}
                    onChange={(e) => setSelectedStrainId(e.target.value)}
                    className="bg-transparent text-gray-800 dark:text-white text-sm font-bold px-2 py-1 outline-none cursor-pointer min-w-[150px]"
                >
                    {strains.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button 
                    onClick={runAnalysis}
                    disabled={isLoading}
                    className="bg-canopy-600 hover:bg-canopy-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    Run AI Analysis
                </button>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800">{error}</div>}

            {/* Empty State */}
            {!analysis && !isLoading && !error && (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500">
                <GitMerge size={48} className="mb-4 opacity-20" />
                <p className="font-medium mb-4">Select a strain to visualize lineage or discover matches.</p>
                <button onClick={openEditModal} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Add History Manually
                </button>
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
                {/* Ancestry Tree */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center overflow-x-auto relative">
                    <div className="self-start w-full flex justify-between items-center mb-8">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <GitMerge size={18} className="text-canopy-500" /> Genetic Lineage
                    </h3>
                    <div className="flex gap-2">
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
                    <div className="flex gap-8 mb-8 relative">
                        <div className="flex gap-2">
                            <LineageCard node={analysis.grandparents?.[0]} role="GP 1" />
                            <LineageCard node={analysis.grandparents?.[1]} role="GP 2" />
                        </div>
                        <div className="flex gap-2">
                            <LineageCard node={analysis.grandparents?.[2]} role="GP 3" />
                            <LineageCard node={analysis.grandparents?.[3]} role="GP 4" />
                        </div>
                        <svg className="absolute top-full left-0 w-full h-8 pointer-events-none stroke-gray-300 dark:stroke-gray-600" fill="none">
                            <path d="M 70 0 V 15 H 150 V 32" strokeWidth="1.5" /> 
                            <path d="M 230 0 V 15 H 310 V 32" strokeWidth="1.5" />
                        </svg>
                    </div>

                    <div className="flex gap-24 mb-8 relative">
                        <LineageCard node={analysis.parents?.[0]} role="Mother" />
                        <LineageCard node={analysis.parents?.[1]} role="Father" />
                        <svg className="absolute top-full left-0 w-full h-8 pointer-events-none stroke-gray-300 dark:stroke-gray-600" fill="none">
                            <path d="M 64 0 V 15 H 192 V 32" strokeWidth="1.5" /> 
                            <path d="M 320 0 V 15 H 192 V 32" strokeWidth="1.5" />
                        </svg>
                    </div>

                    <div className="p-4 bg-canopy-50 dark:bg-canopy-900/20 border-2 border-canopy-500 rounded-xl shadow-lg w-48 text-center relative z-10">
                        <div className="font-bold text-gray-800 dark:text-white text-lg">{analysis.strainName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedStrain?.breeder}</div>
                    </div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Beaker size={18} className="text-pink-500" /> Breeding Suggestions
                        </h3>
                    </div>

                    <div className="grid gap-4">
                        {analysis.recommendations?.map((rec, idx) => {
                        const isExpanded = expandedPheno === rec.partnerId;
                        return (
                        <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-all group relative overflow-hidden">
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

                            <div className="pl-3 border-l-2 border-canopy-500 ml-1 mb-4">
                            <div className="text-xs font-semibold text-canopy-600 dark:text-canopy-400 mb-0.5">Projected Offspring</div>
                            <div className="text-2xl font-black text-gray-800 dark:text-white font-mono tracking-tight">{rec.projectedName}</div>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{rec.synergyAnalysis}</p>

                            {rec.dominantTerpenes?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {rec.dominantTerpenes.map((terp, i) => (
                                <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800 flex items-center gap-1">
                                    <Leaf size={8} /> {terp}
                                </span>
                                ))}
                            </div>
                            )}
                            
                            <button 
                            onClick={() => setExpandedPheno(isExpanded ? null : rec.partnerId)}
                            className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                                isExpanded ? 'bg-canopy-100 text-canopy-800 dark:bg-canopy-900/40 dark:text-canopy-300' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-canopy-50 dark:hover:bg-canopy-900/20'
                            }`}
                            >
                            <Zap size={14} className={isExpanded ? 'fill-current' : ''} /> 
                            {isExpanded ? 'Hide Phenotypes' : 'Simulate Phenotypes'}
                            </button>

                            {isExpanded && rec.potentialPhenotypes && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-fade-in space-y-3">
                                {rec.potentialPhenotypes.map((pheno, pIdx) => (
                                <div key={pIdx} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm border border-gray-100 dark:border-gray-800/50">
                                    <div className="font-bold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-canopy-500"></div>
                                    {pheno.name}
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">{pheno.description}</div>
                                </div>
                                ))}
                            </div>
                            )}
                        </div>
                        )})}
                        {(!analysis.recommendations || analysis.recommendations.length === 0) && (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                            Run analysis to generate breeding suggestions.
                        </div>
                        )}
                    </div>
                </div>
                </div>
            )}
        </>
      )}

      {/* --- Project Board View --- */}
      {activeTab === 'projects' && (
         <div className="h-full pb-20 overflow-x-auto">
             <div className="flex justify-between items-center mb-6">
                <p className="text-gray-500 dark:text-gray-400">Drag and drop projects to track progress.</p>
                <button onClick={() => setIsProjectModalOpen(true)} className="bg-canopy-600 hover:bg-canopy-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                    <Plus size={16} /> New Project
                </button>
             </div>

             <div className="flex gap-6 min-w-max pb-4">
                 {STATUS_COLUMNS.map(status => (
                     <div 
                        key={status}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, status)} 
                        className="w-80 bg-gray-100 dark:bg-gray-900 rounded-xl flex flex-col max-h-[70vh]"
                     >
                         <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-gray-100 dark:bg-gray-900 z-10 rounded-t-xl">
                             <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm">{status}</h3>
                             <span className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">
                                 {breedingProjects.filter(p => p.status === status).length}
                             </span>
                         </div>
                         
                         <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                             {breedingProjects.filter(p => p.status === status).map(project => {
                                 const mother = strains.find(s => s.id === project.motherId)?.name || 'Unknown';
                                 const father = strains.find(s => s.id === project.fatherId)?.name || 'Unknown';
                                 return (
                                     <div 
                                        key={project.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, project.id)}
                                        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-move hover:border-canopy-500 dark:hover:border-canopy-500 transition-colors group"
                                     >
                                         <div className="flex justify-between items-start mb-2">
                                             <h4 className="font-bold text-gray-800 dark:text-white text-sm">{project.name}</h4>
                                             <button onClick={() => deleteProject(project.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <Trash2 size={14} />
                                             </button>
                                         </div>
                                         <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1">
                                             <div className="flex items-center gap-1"><span className="text-pink-400">♀</span> {mother}</div>
                                             <div className="flex items-center gap-1"><span className="text-blue-400">♂</span> {father}</div>
                                         </div>
                                         <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                                             <span className="text-[10px] text-gray-400">{project.startDate}</span>
                                             {onTriggerAI && (
                                                <button 
                                                    onClick={() => onTriggerAI(`Analyze my breeding project "${project.name}" (Status: ${project.status}). Mother: ${mother}, Father: ${father}. Notes: ${project.notes}. Give me advice for the current stage.`)}
                                                    className="text-canopy-600 dark:text-canopy-400 hover:bg-canopy-50 dark:hover:bg-canopy-900/20 p-1 rounded transition-colors"
                                                    title="Ask AI for Advice"
                                                >
                                                    <Bot size={14} />
                                                </button>
                                             )}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                 ))}
             </div>
         </div>
      )}

      {/* Edit Lineage Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
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
                 {/* ... (Existing modal content logic kept same, simplified for brevity in this output, assume it matches previous) ... */}
                 <div>
                   <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3 border-b border-gray-100 dark:border-gray-800 pb-1">Parents (Generation 1)</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Parent 1 */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                         <div className="text-xs font-semibold mb-2 text-canopy-600 dark:text-canopy-400">Mother</div>
                         <div className="space-y-2">
                           <input placeholder="Strain Name" value={editLineageData.parents[0]?.name || ''} onChange={(e) => handleLineageChange('parents', 0, 'name', e.target.value)} className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                           <select value={editLineageData.parents[0]?.type || 'Hybrid'} onChange={(e) => handleLineageChange('parents', 0, 'type', e.target.value)} className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                             <option value="Indica">Indica</option><option value="Sativa">Sativa</option><option value="Hybrid">Hybrid</option><option value="Unknown">Unknown</option>
                           </select>
                         </div>
                      </div>
                      {/* Parent 2 */}
                       <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                         <div className="text-xs font-semibold mb-2 text-canopy-600 dark:text-canopy-400">Father</div>
                         <div className="space-y-2">
                           <input placeholder="Strain Name" value={editLineageData.parents[1]?.name || ''} onChange={(e) => handleLineageChange('parents', 1, 'name', e.target.value)} className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                           <select value={editLineageData.parents[1]?.type || 'Hybrid'} onChange={(e) => handleLineageChange('parents', 1, 'type', e.target.value)} className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                             <option value="Indica">Indica</option><option value="Sativa">Sativa</option><option value="Hybrid">Hybrid</option><option value="Unknown">Unknown</option>
                           </select>
                         </div>
                      </div>
                   </div>
                </div>
                <div>
                   <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3 border-b border-gray-100 dark:border-gray-800 pb-1">Grandparents (Generation 2)</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                           <div className="text-xs font-semibold mb-2 text-gray-400">GP {idx + 1}</div>
                           <div className="space-y-2">
                             <input placeholder="Name" value={editLineageData.grandparents[idx]?.name || ''} onChange={(e) => handleLineageChange('grandparents', idx, 'name', e.target.value)} className="w-full text-xs p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                             <select value={editLineageData.grandparents[idx]?.type || 'Hybrid'} onChange={(e) => handleLineageChange('grandparents', idx, 'type', e.target.value)} className="w-full text-xs p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                               <option value="Indica">Indica</option><option value="Sativa">Sativa</option><option value="Hybrid">Hybrid</option><option value="Unknown">Unknown</option>
                             </select>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button onClick={saveLineage} className="px-6 py-2 rounded-lg bg-canopy-600 text-white font-bold hover:bg-canopy-700 transition-colors shadow-sm">Save Lineage</button>
             </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Start Breeding Project</h3>
                    <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20}/></button>
                </div>
                <form onSubmit={handleAddProject} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">Project Name (Optional)</label>
                        <input 
                            value={newProject.name} 
                            onChange={(e) => setNewProject(prev => ({...prev, name: e.target.value}))}
                            placeholder="e.g. Project X"
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Mother (Female)</label>
                            <select 
                                required
                                value={newProject.motherId}
                                onChange={(e) => setNewProject(prev => ({...prev, motherId: e.target.value}))}
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">Select Strain</option>
                                {strains.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Father (Male/Reversed)</label>
                            <select 
                                required
                                value={newProject.fatherId}
                                onChange={(e) => setNewProject(prev => ({...prev, fatherId: e.target.value}))}
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">Select Strain</option>
                                {strains.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">Goal / Notes</label>
                        <textarea 
                            value={newProject.notes}
                            onChange={(e) => setNewProject(prev => ({...prev, notes: e.target.value}))}
                            placeholder="Hunting for high yield purple phenos..."
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white h-24" 
                        />
                    </div>
                    <button type="submit" className="w-full bg-canopy-600 hover:bg-canopy-700 text-white font-bold py-3 rounded-lg mt-2">Create Project</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
