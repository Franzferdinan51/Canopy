
import React, { useState } from 'react';
import { Nutrient, Strain, UsageLog, UserSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { analyzeGrowData } from '../services/geminiService';
import { History, DollarSign, Activity, TrendingUp, Filter, Loader2, Sparkles, AlertCircle, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AnalyticsProps {
  history: UsageLog[];
  nutrients: Nutrient[];
  strains: Strain[];
  settings: UserSettings;
}

const COLORS = ['#22c55e', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];

export const Analytics: React.FC<AnalyticsProps> = ({ history, nutrients, strains, settings }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Financial Calculations ---
  const nutrientValue = nutrients.reduce((acc, n) => acc + ((n.cost || 0) * (n.bottleCount || 0)), 0);
  const strainValue = strains.reduce((acc, s) => acc + (s.cost || 0), 0);
  const totalValue = nutrientValue + strainValue;

  const costData = [
    { name: 'Nutrients', value: nutrientValue },
    { name: 'Seeds', value: strainValue }
  ];

  // --- Usage Trends ---
  // Count actions over the last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const activityData = last7Days.map(date => {
    const count = history.filter(h => h.date.startsWith(date)).length;
    return { date: date.slice(5), count };
  });

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeGrowData(history, nutrients, strains, settings);
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis("Failed to generate analysis. Check API key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-full text-canopy-600 dark:text-canopy-400 shadow-sm border border-gray-100 dark:border-gray-700">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">Financials, Usage Trends, and History</p>
          </div>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 font-bold transition-all disabled:opacity-50"
        >
          {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          Generate AI Report
        </button>
      </div>

      {/* AI Analysis Result */}
      {aiAnalysis && (
        <div className="mb-8 p-6 bg-white dark:bg-gray-900 rounded-xl border border-indigo-100 dark:border-indigo-900 shadow-sm animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <Bot size={20} className="text-indigo-500" /> Canopy Insight
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
            <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Cost Analysis */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
            <DollarSign size={18} className="text-green-500" /> Inventory Value
          </h3>
          <p className="text-3xl font-black text-gray-800 dark:text-white mb-6">${totalValue.toFixed(2)}</p>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#1f2937', color: '#fff' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {costData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" /> Activity (7 Days)
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Actions logged over time</p>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#1f2937', color: '#fff' }} 
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed History Log Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <History size={18} /> Transaction History
          </h3>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            {history.length} records
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3">Details</th>
                <th className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No history logged yet. Start dosing nutrients or popping seeds!</td>
                </tr>
              ) : (
                history.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {new Date(log.date).toLocaleDateString()} <span className="text-xs opacity-50">{new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        log.action === 'Dose' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        log.action === 'Germinate' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        log.action === 'Restock' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{log.itemName}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {log.amount} {log.unit}
                    </td>
                    <td className="px-6 py-4 text-gray-500 italic max-w-xs truncate">{log.note || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
