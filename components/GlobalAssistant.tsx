
import React, { useState, useRef, useEffect } from 'react';
import { Nutrient, Strain, UserSettings } from '../types';
import { askGrowAssistant } from '../services/geminiService';
import { Send, Bot, User, X, MessageSquare, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface GlobalAssistantProps {
  nutrients: Nutrient[];
  strains: Strain[];
  settings: UserSettings;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentView: string;
  initialPrompt?: string; // Allow triggering with a pre-filled prompt
  onClearInitialPrompt?: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const GlobalAssistant: React.FC<GlobalAssistantProps> = ({ 
  nutrients, 
  strains, 
  settings, 
  isOpen, 
  setIsOpen,
  currentView,
  initialPrompt,
  onClearInitialPrompt
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hi ${settings.userName}! I'm here to help. Ask me anything about your ${nutrients.length} nutrients or ${strains.length} strains.` }
  ]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle incoming prompts from other components
  useEffect(() => {
    if (initialPrompt && isOpen) {
        handleSubmit(undefined, initialPrompt);
        if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  const handleSubmit = async (e?: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const textToSend = manualQuery || query;
    if (!textToSend.trim() || isLoading) return;

    setQuery('');
    
    // Add User Message
    const newHistory: Message[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(newHistory);
    setIsLoading(true);

    // Add Model Placeholder
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    // Context Injection based on current View
    let contextPrefix = "";
    if (currentView === 'nutrients') contextPrefix = "[User is looking at the Nutrient Inventory]. ";
    if (currentView === 'strains') contextPrefix = "[User is looking at the Strain Library]. ";
    
    // Temporarily modify the last message sent to API to include context, but don't show it in UI
    const apiHistory = [...newHistory];
    apiHistory[apiHistory.length - 1].text = contextPrefix + textToSend;

    try {
      await askGrowAssistant(
        apiHistory, 
        { nutrients, strains }, 
        settings,
        (streamedText) => {
          setMessages(prev => {
             const updated = [...prev];
             updated[updated.length - 1] = { role: 'model', text: streamedText };
             return updated;
          });
        }
      );
    } catch (error) {
      setMessages(prev => {
         const updated = [...prev];
         updated[updated.length - 1] = { role: 'model', text: "Connection error. Please try again." };
         return updated;
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed z-50 transition-all duration-300 shadow-2xl rounded-t-2xl md:rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden flex flex-col
      ${isMinimized 
        ? 'bottom-4 right-4 w-72 h-14' 
        : 'bottom-0 right-0 w-full h-[60vh] md:bottom-6 md:right-6 md:w-96 md:h-[600px]'
      }
    `}>
      {/* Header */}
      <div 
        className="bg-canopy-600 p-3 flex justify-between items-center cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2 text-white">
           <Bot size={20} />
           <span className="font-bold text-sm">Canopy Assistant</span>
           {isLoading && <LoaderBubble />}
        </div>
        <div className="flex items-center gap-1 text-white/80">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1 hover:text-white">
             {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-1 hover:text-white">
             <X size={16} />
          </button>
        </div>
      </div>

      {/* Chat Body */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-canopy-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                }`}>
                   <ReactMarkdown className="prose prose-sm prose-invert max-w-none">
                      {msg.text}
                   </ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={(e) => handleSubmit(e)} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
            <input 
              ref={inputRef}
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Canopy..."
              className="flex-1 text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-canopy-500 bg-gray-50 dark:bg-gray-800 dark:text-white"
            />
            <button 
              type="submit" 
              disabled={!query.trim() || isLoading}
              className="bg-canopy-600 hover:bg-canopy-700 text-white p-2 rounded-lg disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

const LoaderBubble = () => (
  <div className="flex gap-1">
    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
  </div>
);
