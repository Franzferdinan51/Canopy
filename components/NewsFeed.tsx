
import React, { useEffect, useState } from 'react';
import { UserSettings, NewsArticle } from '../types';
import { fetchCannabisNews } from '../services/geminiService';
import { Newspaper, ExternalLink, Loader2, RefreshCw, AlertCircle, Calendar, Hash } from 'lucide-react';

interface NewsFeedProps {
  settings: UserSettings;
}

const CATEGORIES = ['Latest', 'Legislation', 'Cultivation', 'Business', 'Medical'];

export const NewsFeed: React.FC<NewsFeedProps> = ({ settings }) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Latest');

  const loadNews = async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCannabisNews(settings, category);
      setNews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews(activeCategory);
  }, [activeCategory]);

  // Helper to try and get a source image via Google Favicon API
  const getSourceImage = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=128`;
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white dark:bg-gray-800 rounded-full text-canopy-600 dark:text-canopy-400 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <Newspaper size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Cannabis News</h1>
            <p className="text-gray-500 dark:text-gray-400">Industry updates & legislation in the USA</p>
          </div>
        </div>
        <button 
          onClick={() => loadNews(activeCategory)} 
          disabled={loading}
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 p-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          title="Refresh News"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            disabled={loading}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategory === cat 
                ? 'bg-canopy-600 text-white shadow-md' 
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {loading && news.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          <Loader2 size={48} className="animate-spin mb-4 text-canopy-500" />
          <p>Scouring the web for {activeCategory} headlines...</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {news.map((article, index) => {
           const sourceImg = article.url ? getSourceImage(article.url) : null;
           const isFeatured = index === 0; // First article is featured

           return (
            <a 
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer" 
              className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg dark:hover:border-gray-600 transition-all flex flex-col group animate-fade-in ${isFeatured ? 'md:col-span-2 lg:col-span-2 md:flex-row' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`p-6 flex-1 flex flex-col ${isFeatured ? 'justify-center' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                   {/* Source Badge */}
                   <div className="flex items-center gap-2">
                      {sourceImg && (
                        <img 
                          src={sourceImg} 
                          alt={article.source} 
                          className="w-6 h-6 rounded-full object-cover bg-gray-100"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{article.source}</span>
                   </div>
                   <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                      <Calendar size={12} /> {article.date}
                   </span>
                </div>
                
                <h3 className={`${isFeatured ? 'text-2xl md:text-3xl' : 'text-lg'} font-bold text-gray-800 dark:text-gray-100 mb-3 leading-tight group-hover:text-canopy-600 dark:group-hover:text-canopy-400 transition-colors`}>
                  {article.headline}
                </h3>
                
                <p className={`${isFeatured ? 'text-base' : 'text-sm'} text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-1`}>
                  {article.summary}
                </p>
                
                {isFeatured && (
                  <div className="flex gap-2 mb-4">
                    <span className="text-xs bg-canopy-100 dark:bg-canopy-900/30 text-canopy-700 dark:text-canopy-400 px-2 py-1 rounded font-medium">Top Story</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded font-medium flex items-center gap-1"><Hash size={10} /> {activeCategory}</span>
                  </div>
                )}

                <div className={`pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between ${isFeatured ? 'mt-4' : 'mt-auto'}`}>
                   <span className="text-xs text-canopy-600 dark:text-canopy-400 font-semibold group-hover:underline">Read Full Article</span>
                   <ExternalLink size={14} className="text-gray-400" />
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
