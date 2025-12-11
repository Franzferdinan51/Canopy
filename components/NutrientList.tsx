
import React, { useState, useRef } from 'react';
import { Nutrient, NutrientType, UserSettings, UsageLog } from '../types';
import { Plus, Trash2, Camera, Droplet, Loader2, Pencil, Package, History, DollarSign } from 'lucide-react';
import { fileToGenerativePart, scanInventoryItem } from '../services/geminiService';

interface NutrientListProps {
  nutrients: Nutrient[];
  setNutrients: React.Dispatch<React.SetStateAction<Nutrient[]>>;
  settings: UserSettings;
  addLog: (log: Omit<UsageLog, 'id' | 'date'>) => void;
}

export const NutrientList: React.FC<NutrientListProps> = ({ nutrients, setNutrients, settings, addLog }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedNutrient, setSelectedNutrient] = useState<Nutrient | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<Nutrient, 'id'>>({
    name: '',
    brand: '',
    npk: '',
    type: NutrientType.BASE,
    volumeLiters: 1,
    bottleCount: 1,
    cost: 0,
    notes: ''
  });

  // Dose Log State
  const [doseAmount, setDoseAmount] = useState<number>(10);
  const [doseUnit, setDoseUnit] = useState<'ml' | 'bottle'>('ml');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setNutrients(prev => prev.map(n => n.id === editingId ? { ...formData, id: editingId } : n));
    } else {
      const newNutrient: Nutrient = {
        ...formData,
        id: crypto.randomUUID(),
      };
      setNutrients(prev => [...prev, newNutrient]);
      addLog({
        itemId: newNutrient.id,
        itemName: newNutrient.name,
        category: 'Nutrient',
        action: 'Restock',
        amount: formData.bottleCount,
        unit: 'bottles',
        note: 'Initial inventory add'
      });
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this nutrient?")) {
      setNutrients(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleEdit = (nutrient: Nutrient) => {
    setFormData({
      name: nutrient.name,
      brand: nutrient.brand,
      npk: nutrient.npk,
      type: nutrient.type,
      volumeLiters: nutrient.volumeLiters,
      bottleCount: nutrient.bottleCount || 1,
      cost: nutrient.cost || 0,
      notes: nutrient.notes || ''
    });
    setEditingId(nutrient.id);
    setIsModalOpen(true);
  };

  const openLogModal = (nutrient: Nutrient) => {
    setSelectedNutrient(nutrient);
    setDoseAmount(10);
    setDoseUnit('ml');
    setIsLogModalOpen(true);
  };

  const submitLog = () => {
    if (!selectedNutrient) return;

    addLog({
      itemId: selectedNutrient.id,
      itemName: selectedNutrient.name,
      category: 'Nutrient',
      action: 'Dose',
      amount: doseAmount,
      unit: doseUnit,
      note: 'Manual dose entry'
    });

    if (doseUnit === 'bottle') {
       // Reduce bottle count if logging whole bottles
       setNutrients(prev => prev.map(n => n.id === selectedNutrient.id ? { ...n, bottleCount: Math.max(0, n.bottleCount - doseAmount) } : n));
    }

    setIsLogModalOpen(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      npk: '',
      type: NutrientType.BASE,
      volumeLiters: 1,
      bottleCount: 1,
      cost: 0,
      notes: ''
    });
    setEditingId(null);
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
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
      const data = await scanInventoryItem(base64, 'nutrient', settings);
      
      setFormData(prev => ({
        ...prev,
        name: (data as any).name || prev.name,
        brand: (data as any).brand || prev.brand,
        npk: (data as any).npk || prev.npk,
        type: (data as any).type as NutrientType || prev.type,
      }));
    } catch (error) {
      alert("Failed to scan image.");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Nutrient Inventory</h2>
        <button 
          onClick={openNewModal}
          className="bg-canopy-600 hover:bg-canopy-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} /> Add Nutrient
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {nutrients.map(nutrient => (
          <div key={nutrient.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 flex flex-col justify-between hover:shadow-md transition-all group">
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
                   <button onClick={() => handleEdit(nutrient)} className="text-gray-400 hover:text-blue-500 transition-colors mr-2" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(nutrient.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
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
              onClick={() => openLogModal(nutrient)}
              className="mt-4 w-full py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-canopy-50 dark:hover:bg-canopy-900/20 hover:text-canopy-600 dark:hover:text-canopy-400 transition-colors flex items-center justify-center gap-2"
            >
              <History size={16} /> Log Dose / Usage
            </button>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingId ? 'Edit Nutrient' : 'Add New Nutrient'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">X</button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="flex justify-center mb-4">
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <button type="button" onClick={handleScanClick} disabled={isScanning} className="w-full border-2 border-dashed border-canopy-300 dark:border-canopy-700 bg-canopy-50 dark:bg-canopy-900/20 hover:bg-canopy-100 dark:hover:bg-canopy-900/40 text-canopy-700 dark:text-canopy-400 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {isScanning ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                  {isScanning ? "AI Analyzing Label..." : (editingId ? "Re-Scan Label" : "Scan Bottle Label with AI")}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input required name="brand" value={formData.brand} onChange={handleInputChange} className="input-field w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white" placeholder="Brand" />
                <input required name="name" value={formData.name} onChange={handleInputChange} className="input-field w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white" placeholder="Name" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input name="npk" value={formData.npk} onChange={handleInputChange} className="input-field w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white" placeholder="NPK (0-0-0)" />
                <select name="type" value={formData.type} onChange={handleInputChange} className="input-field w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white">
                  {Object.values(NutrientType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-xs text-gray-500">Size (L)</label>
                  <input type="number" step="0.1" name="volumeLiters" value={formData.volumeLiters} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white" />
                </div>
                <div className="col-span-1">
                   <label className="text-xs text-gray-500">Bottles</label>
                   <input type="number" step="1" name="bottleCount" value={formData.bottleCount} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white" />
                </div>
                <div className="col-span-1">
                   <label className="text-xs text-gray-500">Cost ($)</label>
                   <input type="number" step="0.01" name="cost" value={formData.cost} onChange={handleInputChange} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white" />
                </div>
              </div>

              <button type="submit" className="w-full bg-canopy-600 hover:bg-canopy-700 text-white font-bold py-3 rounded-lg mt-4 transition-colors">
                 {editingId ? 'Update Nutrient' : 'Save to Inventory'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Log Usage Modal */}
      {isLogModalOpen && selectedNutrient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl p-6 border border-gray-100 dark:border-gray-800">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Log Usage: {selectedNutrient.name}</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Record amount used. This helps track run rates.</p>
             
             <div className="flex gap-4 mb-6">
               <div className="flex-1">
                 <label className="text-xs font-semibold text-gray-500 uppercase">Amount</label>
                 <input 
                   type="number" 
                   value={doseAmount} 
                   onChange={(e) => setDoseAmount(parseFloat(e.target.value))} 
                   className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white text-lg font-bold"
                 />
               </div>
               <div className="flex-1">
                 <label className="text-xs font-semibold text-gray-500 uppercase">Unit</label>
                 <select 
                   value={doseUnit} 
                   onChange={(e) => setDoseUnit(e.target.value as any)} 
                   className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                 >
                   <option value="ml">Milliliters (ml)</option>
                   <option value="bottle">Whole Bottles</option>
                 </select>
               </div>
             </div>
             
             <div className="flex gap-2">
               <button onClick={() => setIsLogModalOpen(false)} className="flex-1 py-2 text-gray-600 dark:text-gray-400 font-semibold">Cancel</button>
               <button onClick={submitLog} className="flex-1 py-2 bg-canopy-600 text-white rounded-lg font-bold hover:bg-canopy-700">Record</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
