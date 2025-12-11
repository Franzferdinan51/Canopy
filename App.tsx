
import React, { useState, useEffect } from 'react';
import { View, Nutrient, Strain, NutrientType, StrainType, UserSettings, UsageLog } from './types';
import { LayoutDashboard, Beaker, Sprout, Bot, Menu, X, Settings as SettingsIcon, Newspaper, Dna, BarChart3, ShoppingCart } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { NutrientList } from './components/NutrientList';
import { StrainList } from './components/StrainList';
import { AIAssistant } from './components/AIAssistant';
import { Settings } from './components/Settings';
import { NewsFeed } from './components/NewsFeed';
import { BreedingLab } from './components/BreedingLab';
import { Analytics } from './components/Analytics';
import { OrderPage } from './components/OrderPage';
import { GlobalAssistant } from './components/GlobalAssistant';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Global Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState<string>('');

  // --- Initial State Loaders ---

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('canopy_settings');
    if (saved) return JSON.parse(saved);
    return {
      userName: 'Grower',
      experienceLevel: 'Intermediate',
      aiProvider: 'gemini',
      geminiApiKey: '',
      lmStudioUrl: 'http://localhost:1234/v1',
      lmStudioModel: '',
      theme: 'dark',
      preferredModel: 'gemini-2.5-flash'
    };
  });

  const [nutrients, setNutrients] = useState<Nutrient[]>(() => {
    const saved = localStorage.getItem('canopy_nutrients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((n: any) => ({ 
            ...n, 
            bottleCount: Number(n.bottleCount ?? 1),
            volumeLiters: Number(n.volumeLiters ?? 0),
            cost: Number(n.cost ?? 0)
          }));
        }
      } catch (e) {
        console.error("Error parsing nutrients", e);
      }
    }
    return [
      { id: '1', name: 'Veg 1', brand: 'FOOP', npk: '1-1-1', type: NutrientType.BASE, volumeLiters: 0.95, bottleCount: 1, cost: 24.99, notes: 'Contains nitrogen and calcium for root development' },
      { id: '2', name: 'Veg 2', brand: 'FOOP', npk: '1-2-1', type: NutrientType.BASE, volumeLiters: 0.95, bottleCount: 1, cost: 24.99, notes: 'Essential micronutrients for vegetative growth' },
      { id: '3', name: 'Bloom 1', brand: 'FOOP', npk: '0-3-5', type: NutrientType.BASE, volumeLiters: 0.95, bottleCount: 1, cost: 24.99, notes: 'Phosphorus and potassium for flowering' },
      { id: '4', name: 'Bloom 2', brand: 'FOOP', npk: '0-1-3', type: NutrientType.BASE, volumeLiters: 0.95, bottleCount: 1, cost: 24.99, notes: 'Secondary nutrients for bud production' },
      { id: '5', name: 'Sweetener', brand: 'FOOP', npk: '0-0-1', type: NutrientType.ADDITIVE, volumeLiters: 0.95, bottleCount: 1, cost: 19.99, notes: 'Flavor enhancer and soil conditioner' },
      { id: '6', name: 'Big Bloom', brand: 'FoxFarm', npk: '0-0.5-0.7', type: NutrientType.BASE, volumeLiters: 0.95, bottleCount: 1, cost: 15.00 },
      { id: '7', name: 'Grow Big', brand: 'FoxFarm', npk: '6-4-4', type: NutrientType.BASE, volumeLiters: 0.95, bottleCount: 1, cost: 15.00 },
      { id: '8', name: 'Tiger Bloom', brand: 'FoxFarm', npk: '2-8-4', type: NutrientType.BASE, volumeLiters: 0.95, bottleCount: 1, cost: 15.00 },
      { id: '9', name: 'CaliMagic', brand: 'General Hydroponics', npk: '1-0-0', type: NutrientType.ADDITIVE, volumeLiters: 0.95, bottleCount: 1, cost: 18.00 },
    ];
  });

  const [strains, setStrains] = useState<Strain[]>(() => {
    const saved = localStorage.getItem('canopy_strains');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((s: any) => ({ 
            ...s, 
            inventoryCount: Number(s.inventoryCount), // Fix: Ensure number for math operations
            floweringTimeWeeks: Number(s.floweringTimeWeeks),
            isLandrace: s.isLandrace ?? false,
            parents: s.parents || [],
            infoUrl: s.infoUrl || '',
            cost: Number(s.cost || 0),
            rating: Number(s.rating || 0)
          }));
        }
      } catch (e) {
        console.error("Error parsing strains", e);
      }
    }
    const defaultStrains = [
      { id: '1', name: 'Purple Sun Shine F1', breeder: 'Custom', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '2', name: 'Purple Sun Shine Bx1', breeder: 'Custom', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '3', name: 'PSAuto F2 + Fat Bastard', breeder: 'Custom', type: StrainType.RUDERALIS, floweringTimeWeeks: 10, inventoryCount: 10, isAuto: true, isLandrace: false },
      { id: '4', name: 'Purple ChemDawg', breeder: 'Custom', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '5', name: 'Purple Sun Shine F2', breeder: 'Custom', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '6', name: 'Ken Estes GDP Heirloom', breeder: 'Grand Daddy Purp', type: StrainType.INDICA, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '7', name: 'Purple Sun Shine Auto F2', breeder: 'Custom', type: StrainType.RUDERALIS, floweringTimeWeeks: 10, inventoryCount: 10, isAuto: true, isLandrace: false },
      { id: '8', name: 'Black Strap Auto F2', breeder: 'Brother Mendel', type: StrainType.RUDERALIS, floweringTimeWeeks: 10, inventoryCount: 10, isAuto: true, isLandrace: false },
      { id: '9', name: 'Banana Purple Jack', breeder: 'Custom', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '10', name: 'Glue Gelato', breeder: 'Barney\'s Farm', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '11', name: 'Purple Sun Shine Auto F3', breeder: 'Custom', type: StrainType.RUDERALIS, floweringTimeWeeks: 10, inventoryCount: 10, isAuto: true, isLandrace: false },
      { id: '12', name: 'Lemon Cookies + Garlic Bud', breeder: 'Custom', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '13', name: 'White Space F2', breeder: 'Custom', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '14', name: 'Fat Bastard', breeder: 'Blimburn', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '15', name: 'Fat Bastard Auto', breeder: 'Blimburn', type: StrainType.RUDERALIS, floweringTimeWeeks: 10, inventoryCount: 10, isAuto: true, isLandrace: false },
      { id: '16', name: 'Mimosa', breeder: 'Symbiotic Genetics', type: StrainType.SATIVA, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '17', name: 'Black Berry Moonstones Auto', breeder: 'Gnome Automatics', type: StrainType.RUDERALIS, floweringTimeWeeks: 10, inventoryCount: 10, isAuto: true, isLandrace: false },
      { id: '18', name: 'Blunt Force Trauma', breeder: 'Custom', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '19', name: 'Trop Cherry S1', breeder: 'Relentless Genetics', type: StrainType.SATIVA, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '20', name: 'GlitterBoof', breeder: 'Comphetua', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '21', name: 'Trich Dawg', breeder: 'Irie Genetics', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '22', name: 'Cantaloupe Skunk', breeder: 'Custom', type: StrainType.SATIVA, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '23', name: 'XXL Cheese', breeder: 'Dinafem', type: StrainType.HYBRID, floweringTimeWeeks: 9, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '24', name: 'Kazakastani', breeder: 'Landrace', type: StrainType.INDICA, floweringTimeWeeks: 8, inventoryCount: 10, isAuto: false, isLandrace: true },
      { id: '25', name: 'Black Russian', breeder: 'Delicious Seeds', type: StrainType.INDICA, floweringTimeWeeks: 8, inventoryCount: 10, isAuto: false, isLandrace: false },
      { id: '26', name: 'Taskurgan', breeder: 'Landrace', type: StrainType.INDICA, floweringTimeWeeks: 8, inventoryCount: 10, isAuto: false, isLandrace: true },
      { id: '27', name: 'Xinjiang', breeder: 'Landrace', type: StrainType.INDICA, floweringTimeWeeks: 8, inventoryCount: 10, isAuto: false, isLandrace: true },
    ];
    
    return defaultStrains.map(s => ({ 
      ...s, 
      cost: 0, 
      rating: 0, 
      parents: [], 
      grandparents: [], 
      infoUrl: '' 
    }));
  });

  const [history, setHistory] = useState<UsageLog[]>(() => {
     const saved = localStorage.getItem('canopy_history');
     return saved ? JSON.parse(saved) : [];
  });

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('canopy_nutrients', JSON.stringify(nutrients)); }, [nutrients]);
  useEffect(() => { localStorage.setItem('canopy_strains', JSON.stringify(strains)); }, [strains]);
  useEffect(() => { localStorage.setItem('canopy_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('canopy_history', JSON.stringify(history)); }, [history]);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
  };

  // --- Logging Helper ---
  const addLog = (log: Omit<UsageLog, 'id' | 'date'>) => {
    const newLog: UsageLog = {
      ...log,
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    };
    setHistory(prev => [newLog, ...prev]);
  };

  // --- Agentic Action Handler ---
  const handleAgentAction = (action: any) => {
    if (action.action === 'NAVIGATE' && action.payload) {
        const view = action.payload as View;
        if (['dashboard', 'nutrients', 'strains', 'breeding', 'order', 'analytics', 'assistant', 'news', 'settings'].includes(view)) {
            setCurrentView(view);
            // Optionally close sidebar on mobile if open
            setIsSidebarOpen(false);
        }
    }
  };

  // --- AI Trigger Helper ---
  const triggerGlobalAI = (prompt: string) => {
    setAssistantPrompt(prompt);
    setIsAssistantOpen(true);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mb-1 ${
        currentView === view 
          ? 'bg-canopy-100 text-canopy-800 font-semibold dark:bg-canopy-900 dark:text-canopy-300' 
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-canopy-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">C</div>
            <span className="font-bold text-gray-800 dark:text-white">Canopy</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600 dark:text-gray-300">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-canopy-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">C</div>
            <span className="text-xl font-bold text-gray-800 dark:text-white">Canopy</span>
          </div>

          <nav className="flex-1">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="nutrients" icon={Beaker} label="Nutrients" />
            <NavItem view="strains" icon={Sprout} label="Strain Library" />
            <NavItem view="breeding" icon={Dna} label="Breeding Lab" />
            <NavItem view="order" icon={ShoppingCart} label="Supply Chain" />
            <NavItem view="analytics" icon={BarChart3} label="Analytics" />
            <NavItem view="assistant" icon={Bot} label="AI Assistant" />
            <NavItem view="news" icon={Newspaper} label="News" />
          </nav>

          <div className="mt-auto">
             <NavItem view="settings" icon={SettingsIcon} label="Settings" />
             <div className="mt-4 bg-canopy-50 dark:bg-gray-800 p-4 rounded-xl border border-canopy-100 dark:border-gray-700">
              <p className="text-xs text-canopy-800 dark:text-canopy-300 font-semibold mb-1">Status</p>
              <div className="flex items-center gap-2 text-xs text-canopy-600 dark:text-canopy-400">
                <div className={`w-2 h-2 rounded-full ${settings.aiProvider === 'lm-studio' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                {settings.aiProvider === 'lm-studio' ? 'Local AI' : 'Gemini AI'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden pt-14 md:pt-0 relative dark:bg-gray-950">
        {currentView === 'dashboard' && <Dashboard nutrients={nutrients} strains={strains} onViewChange={setCurrentView} settings={settings} />}
        {currentView === 'nutrients' && <NutrientList nutrients={nutrients} setNutrients={setNutrients} settings={settings} addLog={addLog} onTriggerAI={triggerGlobalAI} />}
        {currentView === 'strains' && <StrainList strains={strains} setStrains={setStrains} settings={settings} addLog={addLog} onTriggerAI={triggerGlobalAI} />}
        {currentView === 'breeding' && <BreedingLab strains={strains} setStrains={setStrains} settings={settings} />}
        {currentView === 'order' && <OrderPage nutrients={nutrients} setNutrients={setNutrients} strains={strains} setStrains={setStrains} settings={settings} />}
        {currentView === 'assistant' && <AIAssistant nutrients={nutrients} strains={strains} settings={settings} onAgentAction={handleAgentAction} currentView={currentView} />}
        {currentView === 'news' && <NewsFeed settings={settings} />}
        {currentView === 'analytics' && <Analytics history={history} nutrients={nutrients} strains={strains} settings={settings} />}
        {currentView === 'settings' && <Settings settings={settings} onSave={handleSaveSettings} />}
        
        {/* Floating Global Assistant - Only show if NOT on the main assistant page */}
        {currentView !== 'assistant' && (
          <>
            <GlobalAssistant 
              nutrients={nutrients} 
              strains={strains} 
              settings={settings} 
              isOpen={isAssistantOpen} 
              setIsOpen={setIsAssistantOpen} 
              currentView={currentView}
              initialPrompt={assistantPrompt}
              onClearInitialPrompt={() => setAssistantPrompt('')}
              onAgentAction={handleAgentAction}
            />
            
            {/* Assistant Trigger FAB (Only show if not open) */}
            {!isAssistantOpen && (
              <button 
                onClick={() => setIsAssistantOpen(true)}
                className="fixed bottom-6 right-6 bg-canopy-600 hover:bg-canopy-700 text-white p-4 rounded-full shadow-lg z-50 transition-transform hover:scale-105"
                title="Open Canopy Assistant"
              >
                <Bot size={24} />
              </button>
            )}
          </>
        )}

      </main>
    </div>
  );
};

export default App;
