import React, { useState, useRef, useEffect } from 'react';
import { Nutrient, Strain, UserSettings, Attachment, AiModelId } from '../types';
import { askGrowAssistant, fileToGenerativePart } from '../services/geminiService';
import { Send, Bot, User, X, Minimize2, Maximize2, Paperclip, Mic, Brain, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface GlobalAssistantProps {
  nutrients: Nutrient[];
  strains: Strain[];
  settings: UserSettings;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentView: string;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onAgentAction?: (action: any) => void;
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
  onClearInitialPrompt,
  onAgentAction
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hi ${settings.userName}! Ask me anything about your inventory or tell me to navigate the app.` }
  ]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AiModelId>(settings.preferredModel || 'gemini-2.5-flash');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      setQuery(prev => prev + (prev ? ' ' : '') + event.results[0][0].transcript);
    };
    recognition.start();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToGenerativePart(file);
        setAttachments(prev => [...prev, { file, base64, mimeType: file.type }]);
      } catch (err) { alert("Error"); }
    }
  };

  const handleSubmit = async (e?: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const textToSend = manualQuery || query;
    if ((!textToSend.trim() && attachments.length === 0) || isLoading) return;

    setQuery('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    // Context Context
    let contextPrefix = "";
    if (currentView === 'nutrients') contextPrefix = "[Context: Nutrient View]. ";
    if (currentView === 'strains') contextPrefix = "[Context: Strain Library]. ";
    if (currentView === 'breeding') contextPrefix = "[Context: Breeding Lab]. ";
    
    // Create temp history with context injected for AI
    const apiMessages = [...messages, { role: 'user' as const, text: contextPrefix + textToSend }];

    try {
      await askGrowAssistant(
        apiMessages, 
        { nutrients, strains, currentView }, 
        settings,
        currentAttachments,
        selectedModel,
        (streamedText) => {
          setMessages(prev => {
             const updated = [...prev];
             updated[updated.length - 1] = { role: 'model', text: streamedText };
             return updated;
          });
        },
        onAgentAction
      );
    } catch (error) {
      setMessages(prev => {
         const updated = [...prev];
         updated[updated.length - 1] = { role: 'model', text: "Connection error." };
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
           {isLoading && <div className="w-2 h-2 bg-white rounded-full animate-bounce" />}
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

      {/* Model Selector Bar */}
      {!isMinimized && (
          <div className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-3 py-2 flex items-center justify-between">
              <select 
               value={selectedModel}
               onChange={(e) => setSelectedModel(e.target.value as AiModelId)}
               className="text-[10px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 py-1 text-gray-700 dark:text-gray-300 outline-none"
             >
                <option value="gemini-2.5-flash">⚡ Flash</option>
                <option value="gemini-2.0-flash-thinking-exp-01-21">🧠 Thinking</option>
             </select>
             {selectedModel.includes('thinking') && <Brain size={12} className="text-purple-500" />}
          </div>
      )}

      {/* Chat Body */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-canopy-600 text-white rounded-tr-none' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none'
                }`}>
                   <ReactMarkdown className="prose prose-sm prose-invert max-w-none">
                      {msg.text}
                   </ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
             <div className="px-3 pb-2 flex gap-2">
                 {attachments.map((_, i) => (
                     <div key={i} className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center relative">
                         <Paperclip size={12} />
                         <button onClick={() => setAttachments([])} className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3 flex items-center justify-center text-[8px] text-white">x</button>
                     </div>
                 ))}
             </div>
          )}

          {/* Input */}
          <form onSubmit={(e) => handleSubmit(e)} className="p-3 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 flex gap-2 items-center">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <Paperclip size={18} />
            </button>
            <button type="button" onClick={toggleListening} className={`${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600'}`}>
                <Mic size={18} />
            </button>

            <input 
              ref={inputRef}
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask..."
              className="flex-1 text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-canopy-500 bg-white dark:bg-gray-800 dark:text-white"
            />
            <button 
              type="submit" 
              disabled={!query.trim() || isLoading}
              className="bg-canopy-600 hover:bg-canopy-700 text-white p-2 rounded-lg disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
};