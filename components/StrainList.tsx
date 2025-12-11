
import React, { useState, useRef } from 'react';
import { Strain, StrainType, UserSettings, LineageNode } from '../types';
import { Plus, Trash2, Camera, Flower, Clock, Pencil, Loader2, StickyNote, Link as LinkIcon, GitMerge, ExternalLink } from 'lucide-react';
import { fileToGenerativePart, scanInventoryItem } from '../services/geminiService';

interface StrainListProps {
  strains: Strain[];
  setStrains: React.Dispatch<React.SetStateAction<Strain[]>>;
  settings: UserSettings;
}

export const StrainList: React.FC<StrainListProps> = ({ strains, setStrains, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<Strain, 'id'>>({
    name: '',
    breeder: '',
    type: StrainType.HYBRID,
    floweringTimeWeeks: 9,
    inventoryCount: 10,
    isAuto: false,
    isLandrace: false,
    notes: '',
    infoUrl: '',
    parents: [],
    grandparents: []
  });

  // Local state for lineage inputs in the form
  const [lineageInput, setLineageInput] = useState<{
    parent1Name: string;
    parent1Type: string;
    parent2Name: string;
    parent2Type: string;
  }>({
    parent1Name: '',
    parent1Type: 'Hybrid',
    parent2Name: '',
    parent2Type: 'Hybrid'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };
  
  const handleLineageInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLineageInput(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      breeder: '',
      type: StrainType.HYBRID,
      floweringTimeWeeks: 9,
      inventoryCount: 10,
      isAuto: false,
      isLandrace: false,
      notes: '',
      infoUrl: '',
      parents: [],
      grandparents: []
    });
    setLineageInput({
      parent1Name: '',
      parent1Type: 'Hybrid',
      parent2Name: '',
      parent2Type: 'Hybrid'
    });
    setEditingId(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct parents array from lineage inputs
    const newParents: LineageNode[] = [];
    if (lineageInput.parent1Name.trim()) {
      newParents.push({ name: lineageInput.parent1Name, type: lineageInput.parent1Type as any });
    }
    if (lineageInput.parent2Name.trim()) {
      newParents.push({ name: lineageInput.parent2Name, type: lineageInput.parent2Type as any });
    }

    const submissionData = {
      ...formData,
      parents: newParents
    };
    
    if (editingId) {
      setStrains(prev => prev.map(strain => 
        strain.id === editingId 
          ? { ...submissionData, id: editingId } 
          : strain
      ));
    } else {
      const newStrain: Strain = {
        ...submissionData,
        id: crypto.randomUUID(),
      };
      setStrains(prev => [...prev, newStrain]);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (strain: Strain) => {
    setFormData({
      name: strain.name,
      breeder: strain.breeder,
      type: strain.type,
      floweringTimeWeeks: strain.floweringTimeWeeks,
      inventoryCount: strain.inventoryCount,
      isAuto: strain.isAuto,
      isLandrace: strain.isLandrace || false,
      notes: strain.notes || '',
      infoUrl: strain.infoUrl || '',
      parents: strain.parents || [],
      grandparents: strain.grandparents || []
    });
    
    // Populate lineage inputs
    setLineageInput({
      parent1Name: strain.parents?.[0]?.name || '',
      parent1Type: strain.parents?.[0]?.type || 'Hybrid',
      parent2Name: strain.parents?.[1]?.name || '',
      parent2Type: strain.parents?.[1]?.type || 'Hybrid',
    });

    setEditingId(strain.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this strain?")) {
      setStrains(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const base64 = await fileToGenerativePart(file);
      const data = await scanInventoryItem(base64, 'strain', settings);
      
      setFormData(prev => ({
        ...prev,
        name: (data as any).name || prev.name,
        breeder: (data as any).breeder || prev.breeder,
        floweringTimeWeeks: (data as any).floweringTimeWeeks || prev.floweringTimeWeeks,
        type: (data as any).type as StrainType || prev.type,
        isAuto: (data as any).isAuto !== undefined ? (data as any).isAuto : prev.isAuto
      }));
    } catch (error) {
      alert("Failed to scan image. Please enter details manually or check your Gemini API key.");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Strain Library</h2>
           <p className="text-sm text-gray-500 dark:text-gray-400">Manage your seed inventory</p>
        </div>
        <button 
          onClick={openNewModal}
          className="bg-canopy-600 hover:bg-canopy-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} /> Add Strain
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {strains.map(strain => (
          <div key={strain.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 flex z-10">
               {strain.isLandrace && (
                  <span className={`bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-1 ${!strain.isAuto ? 'rounded-bl-lg' : ''}`}>
                    Landrace
                  </span>
               )}
               {strain.isAuto && (
                  <span className="bg-amber-400 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg">
                    Auto
                  </span>
               )}
            </div>
            <div>
              <div className="flex justify-between items-start mb-2">
                 <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  strain.type === StrainType.SATIVA ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                  strain.type === StrainType.INDICA ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                }`}>
                  {strain.type}
                </span>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(strain)} className="text-gray-400 hover:text-blue-500 transition-colors mr-2" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(strain.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                 <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate">{strain.name}</h3>
                 {strain.infoUrl && (
                   <a href={strain.infoUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-canopy-500 transition-colors">
                     <ExternalLink size={14} />
                   </a>
                 )}
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
                 {strain.parents && strain.parents.length > 0 && (
                  <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                    <GitMerge size={14} className="mt-0.5 flex-shrink-0" />
                    <span>
                      {strain.parents.map(p => p.name).join(' x ')}
                    </span>
                  </div>
                 )}
              </div>

              {strain.notes && (
                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
                   <div className="flex items-start gap-1.5">
                     <StickyNote size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                     <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
                       {strain.notes}
                     </p>
                   </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {strains.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
            <Flower size={48} className="mb-4 opacity-20" />
            <p>Your library is empty. Add some beans!</p>
          </div>
        )}
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-20">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingId ? 'Edit Strain' : 'Add New Strain'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">X</button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-6">
               {/* Scan Button */}
               <div className="flex justify-center">
                 <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <button 
                  type="button"
                  onClick={handleScanClick}
                  disabled={isScanning}
                  className="w-full border-2 border-dashed border-canopy-300 dark:border-canopy-700 bg-canopy-50 dark:bg-canopy-900/20 hover:bg-canopy-100 dark:hover:bg-canopy-900/40 text-canopy-700 dark:text-canopy-400 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isScanning ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                  {isScanning ? "AI Reading Pack..." : (editingId ? "Re-Scan Seed Pack" : "Scan Seed Pack")}
                </button>
              </div>

              {/* General Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Breeder</label>
                  <input required name="breeder" value={formData.breeder} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-canopy-500 outline-none dark:bg-gray-800 dark:text-white" placeholder="e.g. Barney's" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Strain Name</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-canopy-500 outline-none dark:bg-gray-800 dark:text-white" placeholder="e.g. GSC" />
                </div>
              </div>

               {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-canopy-500 outline-none dark:bg-gray-800 dark:text-white">
                    {Object.values(StrainType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                 <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Flowering (Wks)</label>
                  <input type="number" name="floweringTimeWeeks" value={formData.floweringTimeWeeks} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-canopy-500 outline-none dark:bg-gray-800 dark:text-white" />
                </div>
              </div>

               {/* Inventory & Metadata */}
               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Seed Count</label>
                  <input type="number" name="inventoryCount" value={formData.inventoryCount} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-canopy-500 outline-none dark:bg-gray-800 dark:text-white" />
                </div>
                 <div className="flex flex-col justify-center h-full pt-4 gap-2">
                    <label className="flex items-center cursor-pointer gap-2">
                      <input type="checkbox" name="isAuto" checked={formData.isAuto} onChange={handleInputChange} className="w-4 h-4 text-canopy-600 rounded focus:ring-canopy-500 border-gray-300" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Autoflower</span>
                    </label>
                    <label className="flex items-center cursor-pointer gap-2">
                      <input type="checkbox" name="isLandrace" checked={formData.isLandrace} onChange={handleInputChange} className="w-4 h-4 text-canopy-600 rounded focus:ring-canopy-500 border-gray-300" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Landrace</span>
                    </label>
                </div>
              </div>

              {/* URL */}
              <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <LinkIcon size={12} /> Breeder / Info URL
                  </label>
                  <input name="infoUrl" value={formData.infoUrl} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-canopy-500 outline-none dark:bg-gray-800 dark:text-white" placeholder="https://..." />
              </div>

              {/* Genetic History Section */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <GitMerge size={16} /> Genetic History (Parents)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Parent 1 */}
                   <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Parent 1 (Mother)</div>
                      <input 
                        name="parent1Name" 
                        value={lineageInput.parent1Name} 
                        onChange={handleLineageInputChange}
                        placeholder="Name" 
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg outline-none dark:bg-gray-800 dark:text-white mb-1" 
                      />
                       <select 
                        name="parent1Type" 
                        value={lineageInput.parent1Type} 
                        onChange={handleLineageInputChange} 
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg outline-none dark:bg-gray-800 dark:text-white"
                      >
                         <option value="Indica">Indica</option>
                         <option value="Sativa">Sativa</option>
                         <option value="Hybrid">Hybrid</option>
                         <option value="Unknown">Unknown</option>
                      </select>
                   </div>
                   
                   {/* Parent 2 */}
                   <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Parent 2 (Father)</div>
                      <input 
                        name="parent2Name" 
                        value={lineageInput.parent2Name} 
                        onChange={handleLineageInputChange}
                        placeholder="Name" 
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg outline-none dark:bg-gray-800 dark:text-white mb-1" 
                      />
                       <select 
                        name="parent2Type" 
                        value={lineageInput.parent2Type} 
                        onChange={handleLineageInputChange} 
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg outline-none dark:bg-gray-800 dark:text-white"
                      >
                         <option value="Indica">Indica</option>
                         <option value="Sativa">Sativa</option>
                         <option value="Hybrid">Hybrid</option>
                         <option value="Unknown">Unknown</option>
                      </select>
                   </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Notes</label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-canopy-500 outline-none h-20 resize-none dark:bg-gray-800 dark:text-white" 
                  placeholder="Phenotype notes, feeding requirements, etc..."
                ></textarea>
              </div>

              <button type="submit" className="w-full bg-canopy-600 hover:bg-canopy-700 text-white font-bold py-3 rounded-lg mt-4 transition-colors">
                {editingId ? 'Update Strain' : 'Save to Library'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
