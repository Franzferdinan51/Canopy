
import React, { useState, useRef, useCallback } from 'react';
import { Strain, StrainType, UserSettings, LineageNode, UsageLog } from '../types';
import { Plus, Camera, Loader2, Link as LinkIcon, GitMerge, Bot, Sparkles } from 'lucide-react';
import { fileToGenerativePart, scanInventoryItem, fetchStrainDataFromUrl } from '../services/geminiService';
import { StrainItem } from './StrainItem';

interface StrainListProps {
  strains: Strain[];
  setStrains: React.Dispatch<React.SetStateAction<Strain[]>>;
  settings: UserSettings;
  addLog: (log: Omit<UsageLog, 'id' | 'date'>) => void;
  onTriggerAI: (prompt: string) => void;
}

export const StrainList: React.FC<StrainListProps> = ({ strains, setStrains, settings, addLog, onTriggerAI }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
  const [popCount, setPopCount] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<Strain, 'id'>>({
    name: '',
    breeder: '',
    type: StrainType.HYBRID,
    floweringTimeWeeks: 9,
    inventoryCount: 10,
    cost: 0,
    rating: 0,
    isAuto: false,
    isLandrace: false,
    notes: '',
    infoUrl: '',
    parents: [],
    grandparents: []
  });

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
    let val: any = value;
    if (type === 'checkbox') {
        val = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
        val = Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: val }));
  };
  
  const handleLineageInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLineageInput(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newParents: LineageNode[] = [];
    if (lineageInput.parent1Name.trim()) newParents.push({ name: lineageInput.parent1Name, type: lineageInput.parent1Type as any });
    if (lineageInput.parent2Name.trim()) newParents.push({ name: lineageInput.parent2Name, type: lineageInput.parent2Type as any });

    const submissionData = { ...formData, parents: newParents };
    
    if (editingId) {
      setStrains(prev => prev.map(strain => strain.id === editingId ? { ...submissionData, id: editingId } : strain));
    } else {
      const newStrain = { ...submissionData, id: crypto.randomUUID() };
      setStrains(prev => [...prev, newStrain]);
      addLog({ itemId: newStrain.id, itemName: newStrain.name, category: 'Strain', action: 'Restock', amount: formData.inventoryCount, unit: 'seeds', note: 'Initial add' });
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = useCallback((strain: Strain) => {
    setFormData({
      name: strain.name,
      breeder: strain.breeder,
      type: strain.type,
      floweringTimeWeeks: Number(strain.floweringTimeWeeks),
      inventoryCount: Number(strain.inventoryCount),
      cost: Number(strain.cost || 0),
      rating: Number(strain.rating || 0),
      isAuto: strain.isAuto,
      isLandrace: strain.isLandrace || false,
      notes: strain.notes || '',
      infoUrl: strain.infoUrl || '',
      parents: strain.parents || [],
      grandparents: strain.grandparents || []
    });
    setLineageInput({
      parent1Name: strain.parents?.[0]?.name || '',
      parent1Type: strain.parents?.[0]?.type || 'Hybrid',
      parent2Name: strain.parents?.[1]?.name || '',
      parent2Type: strain.parents?.[1]?.type || 'Hybrid',
    });
    setEditingId(strain.id);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm("Are you sure you want to delete this strain?")) {
      setStrains(prev => prev.filter(s => s.id !== id));
    }
  }, [setStrains]);

  const openLogModal = useCallback((strain: Strain) => {
    setSelectedStrain(strain);
    setPopCount(1);
    setIsLogModalOpen(true);
  }, []);

  const submitPopLog = () => {
    if (!selectedStrain) return;
    addLog({
      itemId: selectedStrain.id,
      itemName: selectedStrain.name,
      category: 'Strain',
      action: 'Germinate',
      amount: popCount,
      unit: 'seeds',
      note: 'Popped seeds for cultivation'
    });
    setStrains(prev => prev.map(s => s.id === selectedStrain.id ? { ...s, inventoryCount: Math.max(0, s.inventoryCount - popCount) } : s));
    setIsLogModalOpen(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      breeder: '',
      type: StrainType.HYBRID,
      floweringTimeWeeks: 9,
      inventoryCount: 10,
      cost: 0,
      rating: 0,
      isAuto: false,
      isLandrace: false,
      notes: '',
      infoUrl: '',
      parents: [],
      grandparents: []
    });
    setLineageInput({ parent1Name: '', parent1Type: 'Hybrid', parent2Name: '', parent2Type: 'Hybrid' });
    setEditingId(null);
  };

  const handleScanClick = () => fileInputRef.current?.click();

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
        floweringTimeWeeks: Number((data as any).floweringTimeWeeks || prev.floweringTimeWeeks),
        type: (data as any).type as StrainType || prev.type,
        isAuto: (data as any).isAuto !== undefined ? (data as any).isAuto : prev.isAuto
      }));
    } catch (error) {
      alert("Failed to scan.");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlFetch = async () => {
    if (!formData.infoUrl) {
      alert("Please enter a URL first.");
      return;
    }
    setIsFetchingUrl(true);
    try {
      const data = await fetchStrainDataFromUrl(formData.infoUrl, settings);
      
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        breeder: data.breeder || prev.breeder,
        type: data.type || prev.type,
        // Only update if we got a real number, otherwise keep current value
        floweringTimeWeeks: (data.floweringTimeWeeks !== null && data.floweringTimeWeeks !== undefined) ? Number(data.floweringTimeWeeks) : prev.floweringTimeWeeks,
        isAuto: data.isAuto ?? prev.isAuto,
        notes: data.notes || prev.notes
      }));

      // Update Lineage inputs if parents found
      if (data.parents && data.parents.length > 0) {
        setLineageInput(prev => ({
          ...prev,
          parent1Name: data.parents?.[0]?.name || prev.parent1Name,
          parent1Type: data.parents?.[0]?.type || prev.parent1Type,
          parent2Name: data.parents?.[1]?.name || prev.parent2Name,
          parent2Type: data.parents?.[1]?.type || prev.parent2Type
        }));
      }

    } catch (error) {
      alert("Failed to fetch data from URL. Try entering manually.");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Strain Library</h2>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => onTriggerAI("Suggest a lineup for my next grow based on my seed inventory. I want a mix of flavors but roughly same flowering time.")}
             className="bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm font-semibold"
           >
             <Bot size={18} /> Suggest Next Run
           </button>
           <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-canopy-600 hover:bg-canopy-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors">
             <Plus size={18} /> Add Strain
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {strains.map(strain => (
          <StrainItem
            key={strain.id}
            strain={strain}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPopSeeds={openLogModal}
          />
        ))}
      </div>

       {/* Edit Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-20">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editingId ? 'Edit Strain' : 'Add New Strain'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">X</button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-6">
               <div className="flex justify-center">
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <button type="button" onClick={handleScanClick} disabled={isScanning} className="w-full border-2 border-dashed border-canopy-300 dark:border-canopy-700 bg-canopy-50 dark:bg-canopy-900/20 hover:bg-canopy-100 dark:hover:bg-canopy-900/40 text-canopy-700 dark:text-canopy-400 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {isScanning ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                  {isScanning ? "AI Reading Pack..." : (editingId ? "Re-Scan Seed Pack" : "Scan Seed Pack")}
                </button>
              </div>

              {/* URL Auto-Fill Section */}
              <div className="space-y-1">
                  <label className="text-xs text-gray-500">Source / Info URL</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input 
                        name="infoUrl" 
                        value={formData.infoUrl} 
                        onChange={handleInputChange} 
                        placeholder="https://seedbank.com/strain..."
                        className="w-full pl-9 p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleUrlFetch} 
                      disabled={isFetchingUrl || !formData.infoUrl}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 rounded-lg flex items-center gap-2 text-xs font-bold transition-colors disabled:opacity-50"
                      title="Auto-fill form from URL"
                    >
                      {isFetchingUrl ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      Auto-Fill
                    </button>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Breeder</label>
                  <input required name="breeder" value={formData.breeder} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Strain Name</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white" />
                </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white">
                    {Object.values(StrainType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                 <div className="space-y-1">
                  <label className="text-xs text-gray-500">Flowering (Wks)</label>
                  <input type="number" name="floweringTimeWeeks" value={formData.floweringTimeWeeks} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white" />
                </div>
              </div>

               <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-xs text-gray-500">Seeds</label>
                  <input type="number" name="inventoryCount" value={formData.inventoryCount} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white" />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-gray-500">Cost ($)</label>
                  <input type="number" name="cost" value={formData.cost} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white" />
                </div>
                 <div className="col-span-1">
                  <label className="text-xs text-gray-500">Rating (0-5)</label>
                  <input type="number" max="5" name="rating" value={formData.rating} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white" />
                </div>
              </div>

              <div className="flex gap-4">
                 <label className="flex items-center cursor-pointer gap-2">
                    <input type="checkbox" name="isAuto" checked={formData.isAuto} onChange={handleInputChange} className="w-4 h-4 text-canopy-600 rounded" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Autoflower</span>
                  </label>
                  <label className="flex items-center cursor-pointer gap-2">
                    <input type="checkbox" name="isLandrace" checked={formData.isLandrace} onChange={handleInputChange} className="w-4 h-4 text-canopy-600 rounded" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Landrace</span>
                  </label>
              </div>

              <div className="space-y-1">
                 <label className="text-xs text-gray-500">Notes / Description</label>
                 <textarea 
                   name="notes" 
                   value={formData.notes} 
                   onChange={handleInputChange} 
                   rows={3}
                   className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white text-sm"
                   placeholder="Genetics, terpenes, growth patterns..."
                 />
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <GitMerge size={16} /> Genetic History (Parents)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Mother</div>
                      <input name="parent1Name" value={lineageInput.parent1Name} onChange={handleLineageInputChange} placeholder="Name" className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg outline-none dark:bg-gray-800 dark:text-white mb-1" />
                   </div>
                   <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Father</div>
                      <input name="parent2Name" value={lineageInput.parent2Name} onChange={handleLineageInputChange} placeholder="Name" className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg outline-none dark:bg-gray-800 dark:text-white mb-1" />
                   </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-canopy-600 hover:bg-canopy-700 text-white font-bold py-3 rounded-lg mt-4 transition-colors">
                {editingId ? 'Update Strain' : 'Save to Library'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pop Seeds Log Modal */}
      {isLogModalOpen && selectedStrain && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl p-6 border border-gray-100 dark:border-gray-800">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Pop Seeds: {selectedStrain.name}</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">How many seeds are you germinating?</p>
             
             <div className="mb-6">
                 <input 
                   type="number" 
                   value={popCount} 
                   onChange={(e) => setPopCount(parseInt(e.target.value))} 
                   className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white text-lg font-bold text-center"
                   min="1"
                   max={selectedStrain.inventoryCount}
                 />
                 <p className="text-xs text-center mt-2 text-gray-400">Current Inventory: {selectedStrain.inventoryCount}</p>
             </div>
             
             <div className="flex gap-2">
               <button onClick={() => setIsLogModalOpen(false)} className="flex-1 py-2 text-gray-600 dark:text-gray-400 font-semibold">Cancel</button>
               <button onClick={submitPopLog} className="flex-1 py-2 bg-canopy-600 text-white rounded-lg font-bold hover:bg-canopy-700">Germinate</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
