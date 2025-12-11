
import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Save, User, Cpu, Server, Key, AlertTriangle, CheckCircle, Moon, Sun } from 'lucide-react';

interface SettingsProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleThemeToggle = () => {
    setFormData(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 h-full overflow-y-auto max-w-4xl mx-auto dark:text-gray-200">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
          <User size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Configure your profile, appearance and AI connections</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* User Profile Section */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <User size={18} /> Grower Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Your Name</label>
              <input 
                name="userName" 
                value={formData.userName} 
                onChange={handleChange} 
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-canopy-500 outline-none dark:bg-gray-800 dark:text-white" 
                placeholder="Grower Name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Experience Level</label>
              <select 
                name="experienceLevel" 
                value={formData.experienceLevel} 
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-canopy-500 outline-none dark:bg-gray-800 dark:text-white"
              >
                <option value="Beginner">Beginner (Explain concepts)</option>
                <option value="Intermediate">Intermediate (Practical advice)</option>
                <option value="Master">Master (Technical & Scientific)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">This adjusts how technical the AI's advice will be.</p>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            {formData.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white">Dark Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reduce eye strain during night cycles</p>
            </div>
            <button 
              type="button"
              onClick={handleThemeToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.theme === 'dark' ? 'bg-canopy-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </section>

        {/* AI Configuration Section */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Cpu size={18} /> AI Configuration
          </h3>
          
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-2">Preferred AI Provider</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.aiProvider === 'gemini' ? 'border-canopy-500 bg-canopy-50 dark:bg-canopy-900/30 ring-1 ring-canopy-500' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                <input 
                  type="radio" 
                  name="aiProvider" 
                  value="gemini" 
                  checked={formData.aiProvider === 'gemini'} 
                  onChange={handleChange}
                  className="w-4 h-4 text-canopy-600"
                />
                <div>
                  <div className="font-bold text-gray-800 dark:text-white flex items-center gap-2">Google Gemini <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">Recommended</span></div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Fast, supports Vision (Image Scanning).</div>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.aiProvider === 'lm-studio' ? 'border-canopy-500 bg-canopy-50 dark:bg-canopy-900/30 ring-1 ring-canopy-500' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                <input 
                  type="radio" 
                  name="aiProvider" 
                  value="lm-studio" 
                  checked={formData.aiProvider === 'lm-studio'} 
                  onChange={handleChange}
                  className="w-4 h-4 text-canopy-600"
                />
                <div>
                  <div className="font-bold text-gray-800 dark:text-white">LM Studio (Local)</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Run LLMs locally on your own hardware.</div>
                </div>
              </label>
            </div>
          </div>

          {formData.aiProvider === 'gemini' && (
             <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Key size={14} /> Custom Gemini API Key (Optional)
                  </label>
                  <input 
                    type="password" 
                    name="geminiApiKey" 
                    value={formData.geminiApiKey} 
                    onChange={handleChange} 
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-canopy-500 outline-none font-mono dark:bg-gray-800 dark:text-white" 
                    placeholder="Leave empty to use system default"
                  />
                  <p className="text-xs text-gray-400">If using the hosted version, a key is already provided. Enter one here only to override it.</p>
                </div>
             </div>
          )}

          {formData.aiProvider === 'lm-studio' && (
            <div className="space-y-4 animate-fade-in p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
               <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-900/30 p-3 rounded mb-4">
                 <AlertTriangle size={16} className="mt-0.5" />
                 <p>Make sure LM Studio Server is ON and "Cross-Origin-Resource-Sharing (CORS)" is enabled in LM Studio settings. Image scanning will still use Gemini if a key is available, or be disabled.</p>
               </div>
               
               <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Server size={14} /> LM Studio Base URL
                  </label>
                  <input 
                    name="lmStudioUrl" 
                    value={formData.lmStudioUrl} 
                    onChange={handleChange} 
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-canopy-500 outline-none font-mono dark:bg-gray-800 dark:text-white" 
                    placeholder="http://localhost:1234/v1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Model Name (Optional)</label>
                  <input 
                    name="lmStudioModel" 
                    value={formData.lmStudioModel} 
                    onChange={handleChange} 
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-canopy-500 outline-none dark:bg-gray-800 dark:text-white" 
                    placeholder="e.g. mistral-7b-instruct"
                  />
                </div>
            </div>
          )}
        </section>

        <div className="flex items-center justify-end gap-4">
          {saved && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-fade-in">
              <CheckCircle size={18} />
              <span className="text-sm font-bold">Settings Saved</span>
            </div>
          )}
          <button 
            type="submit" 
            className="bg-canopy-600 hover:bg-canopy-700 text-white font-bold py-3 px-8 rounded-xl shadow-sm flex items-center gap-2 transition-colors"
          >
            <Save size={18} /> Save Settings
          </button>
        </div>

      </form>
    </div>
  );
};
