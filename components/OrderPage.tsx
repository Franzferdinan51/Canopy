
import React, { useState, useEffect } from 'react';
import { Nutrient, Strain, UserSettings, ProductAlternative } from '../types';
import { findProductAlternatives } from '../services/geminiService';
import { ShoppingCart, ExternalLink, DollarSign, RefreshCw, AlertTriangle, ArrowRight, Package, Leaf, Loader2, Sparkles, Copy, FileSpreadsheet, Check } from 'lucide-react';

interface OrderPageProps {
  nutrients: Nutrient[];
  setNutrients: React.Dispatch<React.SetStateAction<Nutrient[]>>;
  strains: Strain[];
  setStrains: React.Dispatch<React.SetStateAction<Strain[]>>;
  settings: UserSettings;
}

export const OrderPage: React.FC<OrderPageProps> = ({ nutrients, setNutrients, strains, setStrains, settings }) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [alternatives, setAlternatives] = useState<Map<string, ProductAlternative[]>>(new Map());
  const [loadingAlts, setLoadingAlts] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'nutrients' | 'strains'>('nutrients');
  const [copySuccess, setCopySuccess] = useState(false);

  // Pre-select low stock items
  useEffect(() => {
    const initialSelection = new Set<string>();
    nutrients.forEach(n => {
      if ((n.bottleCount || 0) <= 1) initialSelection.add(n.id);
    });
    strains.forEach(s => {
      if (s.inventoryCount < 3) initialSelection.add(s.id);
    });
    setSelectedItems(initialSelection);
  }, []); // Run once on mount

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  const updateCost = (id: string, type: 'nutrient' | 'strain', newCost: number) => {
    if (type === 'nutrient') {
      setNutrients(prev => prev.map(n => n.id === id ? { ...n, cost: newCost } : n));
    } else {
      setStrains(prev => prev.map(s => s.id === id ? { ...s, cost: newCost } : s));
    }
  };

  const getAlternatives = async (id: string, name: string, brand: string, category: 'Nutrient' | 'Seed') => {
    setLoadingAlts(id);
    try {
      const results = await findProductAlternatives(name, brand, category, settings);
      setAlternatives(prev => new Map(prev).set(id, results));
    } catch (error) {
      alert("Failed to fetch alternatives. Check AI Settings.");
    } finally {
      setLoadingAlts(null);
    }
  };

  const getShoppingLink = (query: string) => {
    return `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`;
  };

  // Calculate Totals
  const selectedNutrients = nutrients.filter(n => selectedItems.has(n.id));
  const selectedStrains = strains.filter(s => selectedItems.has(s.id));
  const totalCost = 
    selectedNutrients.reduce((acc, n) => acc + (n.cost || 0), 0) + 
    selectedStrains.reduce((acc, s) => acc + (s.cost || 0), 0);

  // --- Export Handlers ---

  const handleDownloadCsv = () => {
    const headers = ['Category', 'Item Name', 'Brand', 'Stock Level', 'Qty Needed', 'Est. Unit Cost', 'Search Link'];
    const rows: string[][] = [];

    // Nutrients
    selectedNutrients.forEach(n => {
      rows.push([
        'Nutrient',
        n.name,
        n.brand,
        `${n.bottleCount} btls`,
        '1', // Assumption for reorder
        (n.cost || 0).toFixed(2),
        getShoppingLink(`${n.brand} ${n.name}`)
      ]);
    });

    // Strains
    selectedStrains.forEach(s => {
      rows.push([
        'Genetics',
        s.name,
        s.breeder,
        `${s.inventoryCount} seeds`,
        '1',
        (s.cost || 0).toFixed(2),
        s.infoUrl || getShoppingLink(`${s.breeder} ${s.name} seeds`)
      ]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Canopy_Order_List_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyClipboard = async () => {
    let text = `🌱 Canopy Order List - ${new Date().toLocaleDateString()}\n`;
    text += `Total Estimated Cost: $${totalCost.toFixed(2)}\n\n`;
    
    if (selectedNutrients.length > 0) {
        text += `NUTRIENTS:\n`;
        selectedNutrients.forEach(n => {
            text += `[ ] ${n.brand} ${n.name} ($${n.cost || '?'})\n`;
        });
        text += `\n`;
    }

    if (selectedStrains.length > 0) {
        text += `GENETICS:\n`;
        selectedStrains.forEach(s => {
            text += `[ ] ${s.breeder} ${s.name} ($${s.cost || '?'})\n`;
        });
        text += `\n`;
    }

    try {
        await navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
        console.error('Failed to copy', err);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors">
      
      {/* Header & Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-canopy-100 dark:bg-canopy-900/30 rounded-full text-canopy-600 dark:text-canopy-400">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Supply Chain</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Verify vendors & restock inventory</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-end md:items-center gap-6">
           <div className="text-right">
             <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Estimated Total</div>
             <div className="text-3xl font-black text-gray-800 dark:text-white">${totalCost.toFixed(2)}</div>
             <div className="text-xs text-gray-400">{selectedItems.size} items selected</div>
           </div>
           
           <div className="flex items-center gap-2">
              <button 
                onClick={handleCopyClipboard}
                className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                title="Copy List to Clipboard"
              >
                {copySuccess ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                <span className="hidden lg:inline">{copySuccess ? "Copied" : "Copy"}</span>
              </button>
              
              <button 
                onClick={handleDownloadCsv}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <FileSpreadsheet size={18} />
                <span>Export CSV</span>
              </button>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-800 pb-1">
        <button 
          onClick={() => setActiveTab('nutrients')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'nutrients' ? 'border-canopy-500 text-canopy-600 dark:text-canopy-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          <Package size={16} /> Nutrients
        </button>
        <button 
          onClick={() => setActiveTab('strains')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'strains' ? 'border-canopy-500 text-canopy-600 dark:text-canopy-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          <Leaf size={16} /> Seeds / Genetics
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-20">
        {activeTab === 'nutrients' && nutrients.map(item => (
           <OrderItemCard 
             key={item.id}
             id={item.id}
             type="nutrient"
             name={item.name}
             brand={item.brand}
             stock={item.bottleCount || 0}
             stockThreshold={1}
             stockUnit="btls"
             cost={item.cost || 0}
             infoUrl={null}
             isSelected={selectedItems.has(item.id)}
             onToggle={() => toggleSelection(item.id)}
             onUpdateCost={(val) => updateCost(item.id, 'nutrient', val)}
             onGetAlternatives={() => getAlternatives(item.id, item.name, item.brand, 'Nutrient')}
             alternatives={alternatives.get(item.id)}
             loadingAlts={loadingAlts === item.id}
             getShoppingLink={getShoppingLink}
           />
        ))}

        {activeTab === 'strains' && strains.map(item => (
           <OrderItemCard 
             key={item.id}
             id={item.id}
             type="strain"
             name={item.name}
             brand={item.breeder}
             stock={item.inventoryCount}
             stockThreshold={3}
             stockUnit="seeds"
             cost={item.cost || 0}
             infoUrl={item.infoUrl}
             isSelected={selectedItems.has(item.id)}
             onToggle={() => toggleSelection(item.id)}
             onUpdateCost={(val) => updateCost(item.id, 'strain', val)}
             onGetAlternatives={() => getAlternatives(item.id, item.name, item.breeder, 'Seed')}
             alternatives={alternatives.get(item.id)}
             loadingAlts={loadingAlts === item.id}
             getShoppingLink={getShoppingLink}
           />
        ))}
      </div>
    </div>
  );
};

interface OrderItemCardProps {
  id: string;
  type: 'nutrient' | 'strain';
  name: string;
  brand: string;
  stock: number;
  stockThreshold: number;
  stockUnit: string;
  cost: number;
  infoUrl?: string | null;
  isSelected: boolean;
  onToggle: () => void;
  onUpdateCost: (val: number) => void;
  onGetAlternatives: () => void;
  alternatives?: ProductAlternative[];
  loadingAlts: boolean;
  getShoppingLink: (q: string) => string;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({
  id, type, name, brand, stock, stockThreshold, stockUnit, cost, infoUrl, isSelected, onToggle, onUpdateCost, onGetAlternatives, alternatives, loadingAlts, getShoppingLink
}) => {
  const isLowStock = stock <= stockThreshold;
  const searchLink = infoUrl || getShoppingLink(`${brand} ${name} ${type === 'strain' ? 'seeds' : ''}`);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border p-4 transition-all ${isSelected ? 'border-gray-300 dark:border-gray-600 shadow-md' : 'border-gray-100 dark:border-gray-800 shadow-sm'}`}>
       <div className="flex flex-col md:flex-row md:items-center gap-4">
          
          {/* Checkbox */}
          <div onClick={onToggle} className="cursor-pointer">
            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${isSelected ? 'bg-canopy-600 border-canopy-600 text-white' : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}>
              {isSelected && <Sparkles size={14} />}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
               <span className="font-bold text-gray-800 dark:text-white text-lg">{name}</span>
               {isLowStock && <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={10} /> LOW STOCK</span>}
             </div>
             <div className="text-sm text-gray-500 dark:text-gray-400">{brand} • {stock} {stockUnit} in inventory</div>
          </div>

          {/* Actions & Price */}
          <div className="flex flex-wrap items-center gap-3">
             <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <DollarSign size={14} className="text-gray-400" />
               </div>
               <input 
                 type="number" 
                 value={cost} 
                 onChange={(e) => onUpdateCost(parseFloat(e.target.value) || 0)}
                 className="pl-8 pr-3 py-2 w-28 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-canopy-500"
               />
               <span className="absolute -top-2 left-2 text-[9px] bg-white dark:bg-gray-900 px-1 text-gray-400">Unit Price</span>
             </div>

             <a href={searchLink} target="_blank" rel="noopener noreferrer" className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
               <ExternalLink size={16} /> Buy Verified
             </a>
             
             <button 
               onClick={onGetAlternatives}
               disabled={loadingAlts}
               className="bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
             >
               {loadingAlts ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
               Alternatives
             </button>
          </div>
       </div>

       {/* AI Alternatives Panel */}
       {alternatives && alternatives.length > 0 && (
         <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 animate-fade-in">
           <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2"><Sparkles size={12} /> AI Suggested Alternatives</h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             {alternatives.map((alt, idx) => (
               <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50 hover:border-canopy-300 dark:hover:border-canopy-700 transition-colors">
                 <div className="flex justify-between items-start mb-1">
                   <div className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate">{alt.name}</div>
                   <div className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded ml-2">~${alt.approxPrice}</div>
                 </div>
                 <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{alt.brand}</div>
                 <p className="text-xs text-gray-600 dark:text-gray-400 italic mb-2 line-clamp-2" title={alt.reason}>"{alt.reason}"</p>
                 <a href={getShoppingLink(alt.searchQuery)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline">
                   Find Deal <ArrowRight size={10} />
                 </a>
               </div>
             ))}
           </div>
         </div>
       )}
    </div>
  );
};
