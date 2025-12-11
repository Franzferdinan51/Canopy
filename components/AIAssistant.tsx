
import React, { useState, useRef, useEffect } from 'react';
import { Nutrient, Strain, UserSettings } from '../types';
import { askGrowAssistant } from '../services/geminiService';
import { Send, Bot, User, Sparkles, Trash2, Zap, Droplet, Sprout, Activity, ThermometerSun } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  nutrients: Nutrient[];
  strains: Strain[];
  settings: UserSettings;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const QUICK_PROMPTS = [
  { label: "Create Feeding Schedule", icon: Droplet, prompt: "Based on my nutrient inventory, create a week-by-week feeding schedule for the flowering stage." },
  { label: "Diagnose Deficiency", icon: Activity, prompt: "My lower fan leaves are turning yellow and falling off during week 4 of flower. What could be the issue?" },
  { label: "Suggest Breeding Pair", icon: Sprout, prompt: "Look at my strain library. Which two strains would you cross for high yield and flavor, and why?" },
  { label: "VPD Explanation", icon: ThermometerSun, prompt: "Explain VPD (Vapor Pressure Deficit) and what targets I should aim for in late veg." },
  { label: "Crop Steering", icon: Zap, prompt: "How can I use crop steering techniques to bulk up my flowers using my current nutrients?" },
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ nutrients, strains, settings }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: `Hello ${settings.userName}! I'm Canopy, your ${settings.aiProvider === 'lm-studio' ? 'local' : 'cloud'} AI Grow Agent. I have analyzed your inventory of **${nutrients.length} nutrients** and **${strains.length} strains**. How can I help you grow today?` 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const textToSend = manualQuery || query;
    if (!textToSend.trim() || isLoading) return;

    setQuery('');
    
    // Optimistic Update
    const newHistory: Message[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(newHistory);
    setIsLoading(true);

    // Placeholder for streaming response
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    try {
      await askGrowAssistant(
        newHistory, 
        { nutrients, strains }, 
        settings,
        (streamedText) => {
          setMessages(prev => {
             const updated = [...prev];
             // Update the last message (the model's placeholder)
             updated[updated.length - 1] = { role: 'model', text: streamedText };
             return updated;
          });
        }
      );
    } catch (error) {
      setMessages(prev => {
         const updated = [...prev];
         updated[updated.length - 1] = { role: 'model', text: "I'm having trouble connecting to the network right now. Check your settings." };
         return updated;
      });
    } finally {
      setIsLoading(false);
      // Focus back on input for rapid fire
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClearChat = () => {
    if(confirm("Clear conversation history?")) {
      setMessages([{ 
        role: 'model', 
        text: `Chat cleared. Ready for a fresh start, ${settings.userName}.` 
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 relative transition-colors">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 shadow-sm flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-2">
          <Sparkles className="text-canopy-500" size={20} />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Grow Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
           <div className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            {settings.aiProvider === 'lm-studio' ? 'LM Studio' : 'Gemini'}
          </div>
          <button 
            onClick={handleClearChat}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1 ${
                msg.role === 'user' 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' 
                  : 'bg-gradient-to-br from-canopy-400 to-canopy-600 text-white'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gray-800 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
              }`}>
                 {msg.text ? (
                   <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert break-words">
                      {msg.text}
                   </ReactMarkdown>
                 ) : (
                   <div className="flex gap-1 h-5 items-center">
                     <div className="w-2 h-2 bg-canopy-400 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-canopy-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                     <div className="w-2 h-2 bg-canopy-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                   </div>
                 )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 space-y-3">
        
        {/* Quick Prompts (Horizontal Scroll) */}
        {!isLoading && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(undefined, qp.prompt)}
                className="flex items-center gap-2 whitespace-nowrap bg-gray-50 dark:bg-gray-800 hover:bg-canopy-50 dark:hover:bg-canopy-900/30 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 px-3 py-2 rounded-full transition-colors"
              >
                <qp.icon size={14} className="text-canopy-500" />
                {qp.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e)} className="flex gap-2 relative">
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isLoading ? "Canopy is thinking..." : `Ask ${settings.aiProvider === 'lm-studio' ? 'Local AI' : 'Canopy'}...`}
            className="flex-1 p-3.5 pr-12 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-canopy-500 bg-gray-50 dark:bg-gray-800 dark:text-white transition-all disabled:opacity-70"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-canopy-600 hover:bg-canopy-700 text-white p-2 rounded-lg transition-all disabled:opacity-0 disabled:transform disabled:scale-90"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
