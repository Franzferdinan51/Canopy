import React, { useState, useRef, useEffect } from 'react';
import { Nutrient, Strain, UserSettings, Attachment, AiModelId } from '../types';
import { askGrowAssistant, fileToGenerativePart } from '../services/geminiService';
import { Send, Bot, User, Sparkles, Trash2, Zap, Droplet, Sprout, Activity, ThermometerSun, Mic, Paperclip, X, Image as ImageIcon, Brain, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  nutrients: Nutrient[];
  strains: Strain[];
  settings: UserSettings;
  onAgentAction?: (action: any) => void;
  currentView?: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

const QUICK_PROMPTS = [
  { label: "Create Feeding Schedule", icon: Droplet, prompt: "Based on my nutrient inventory, create a week-by-week feeding schedule for the flowering stage." },
  { label: "Diagnose Deficiency", icon: Activity, prompt: "My lower fan leaves are turning yellow and falling off during week 4 of flower. What could be the issue?" },
  { label: "Suggest Breeding Pair", icon: Sprout, prompt: "Look at my strain library. Which two strains would you cross for high yield and flavor, and why?" },
  { label: "VPD Explanation", icon: ThermometerSun, prompt: "Explain VPD (Vapor Pressure Deficit) and what targets I should aim for in late veg." },
  { label: "Crop Steering", icon: Zap, prompt: "How can I use crop steering techniques to bulk up my flowers using my current nutrients?" },
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ nutrients, strains, settings, onAgentAction, currentView }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: `Hello ${settings.userName}! I'm Canopy, your Agentic Grow Consultant. I have control over your **${nutrients.length} nutrients** and **${strains.length} strains**. Ask me to analyze images, navigate the app, or plan your grow!` 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AiModelId>(settings.preferredModel || 'gemini-2.5-flash');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Voice Input Logic ---
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      // Logic handled by onend event of recognition
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  // --- Voice Output Logic ---
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Remove markdown symbols for cleaner speech
    utterance.text = text.replace(/[*#`_]/g, ''); 
    window.speechSynthesis.speak(utterance);
  };

  // --- File Handling ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToGenerativePart(file);
        setAttachments(prev => [...prev, { file, base64, mimeType: file.type }]);
      } catch (err) {
        alert("Error uploading file");
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // --- Submission ---
  const handleSubmit = async (e?: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const textToSend = manualQuery || query;
    if ((!textToSend.trim() && attachments.length === 0) || isLoading) return;

    setQuery('');
    const currentAttachments = [...attachments];
    setAttachments([]); // Clear immediately
    
    // Optimistic Update
    const newHistory: Message[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(newHistory);
    setIsLoading(true);

    // Placeholder for response
    setMessages(prev => [...prev, { role: 'model', text: '', isThinking: selectedModel.includes('thinking') }]);

    try {
      await askGrowAssistant(
        newHistory, 
        { nutrients, strains, currentView: currentView || 'assistant' }, 
        settings,
        currentAttachments,
        selectedModel,
        (streamedText, isThinking) => {
          setMessages(prev => {
             const updated = [...prev];
             updated[updated.length - 1] = { role: 'model', text: streamedText, isThinking };
             return updated;
          });
        },
        onAgentAction // Pass navigation handler
      );
      
      // Auto-speak if it was a voice interaction (simple heuristic: if we just used mic, likely want voice back)
      // For now, manual trigger only to be safe.

    } catch (error) {
      setMessages(prev => {
         const updated = [...prev];
         updated[updated.length - 1] = { role: 'model', text: "Connection Error." };
         return updated;
      });
    } finally {
      setIsLoading(false);
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
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 shadow-sm flex flex-col gap-2 sticky top-0">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            <Sparkles className="text-canopy-500" size={20} />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Grow Assistant</h2>
            </div>
            <div className="flex items-center gap-2">
            <button 
                onClick={handleClearChat}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Clear Chat"
            >
                <Trash2 size={18} />
            </button>
            </div>
        </div>

        {/* Model & Agent Controls */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
             <select 
               value={selectedModel}
               onChange={(e) => setSelectedModel(e.target.value as AiModelId)}
               className="text-xs bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
             >
                <option value="gemini-2.5-flash">⚡ Flash 2.5 (Fast)</option>
                <option value="gemini-2.0-flash-thinking-exp-01-21">🧠 Thinking 2.0 (Deep Reason)</option>
                <option value="gemini-1.5-pro">💎 Pro 1.5 (Complex)</option>
             </select>

             <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold ${selectedModel.includes('thinking') ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-50 text-gray-400 dark:bg-gray-800/50'}`}>
                <Brain size={14} />
                <span>Thinking {selectedModel.includes('thinking') ? 'ON' : 'OFF'}</span>
             </div>
             
             <div className="text-xs text-canopy-600 dark:text-canopy-400 font-medium flex items-center gap-1 bg-canopy-50 dark:bg-canopy-900/20 px-2 py-1.5 rounded-lg">
                <Zap size={12} className="fill-current" /> Agentic Control
             </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex max-w-[90%] md:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1 ${
                msg.role === 'user' 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' 
                  : 'bg-gradient-to-br from-canopy-400 to-canopy-600 text-white'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble */}
              <div className={`relative p-4 rounded-2xl text-sm leading-relaxed shadow-sm group ${
                msg.role === 'user' 
                  ? 'bg-gray-800 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
              }`}>
                 
                 {/* Thinking Indicator */}
                 {msg.role === 'model' && msg.isThinking && !msg.text && (
                    <div className="flex items-center gap-2 text-purple-500 mb-2 animate-pulse">
                        <Brain size={14} />
                        <span className="text-xs font-bold">Reasoning...</span>
                    </div>
                 )}

                 {msg.text ? (
                   <>
                     <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert break-words">
                        {msg.text}
                     </ReactMarkdown>
                     {/* Read Aloud Button */}
                     {msg.role === 'model' && (
                        <button 
                            onClick={() => speakText(msg.text)}
                            className="absolute -bottom-6 left-0 p-1 text-gray-400 hover:text-canopy-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Read Aloud"
                        >
                            <Volume2 size={14} />
                        </button>
                     )}
                   </>
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
        
        {/* Attachments Preview */}
        {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
                {attachments.map((att, i) => (
                    <div key={i} className="relative group">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                            {att.mimeType.startsWith('image/') ? (
                                <img src={`data:${att.mimeType};base64,${att.base64}`} className="w-full h-full object-cover" />
                            ) : (
                                <Paperclip size={20} className="text-gray-400" />
                            )}
                        </div>
                        <button 
                            onClick={() => removeAttachment(i)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Quick Prompts */}
        {!isLoading && messages.length < 3 && (
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

        <form onSubmit={(e) => handleSubmit(e)} className="flex items-end gap-2 relative">
          
          {/* File Input */}
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" />
          <button 
             type="button" 
             onClick={() => fileInputRef.current?.click()}
             className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-500 transition-colors"
          >
            <Paperclip size={20} />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input 
                ref={inputRef}
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isLoading ? "Canopy is thinking..." : "Ask Canopy..."}
                className="w-full p-3.5 pr-12 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-canopy-500 bg-gray-50 dark:bg-gray-800 dark:text-white transition-all disabled:opacity-70"
                disabled={isLoading}
            />
          </div>

          {/* Voice Button */}
          <button 
             type="button"
             onClick={toggleListening}
             className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
             <Mic size={20} />
          </button>

          {/* Send Button */}
          <button 
            type="submit" 
            disabled={isLoading || (!query.trim() && attachments.length === 0)}
            className="bg-canopy-600 hover:bg-canopy-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};