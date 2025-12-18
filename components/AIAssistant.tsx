
import React, { useState, useRef, useEffect } from 'react';
import { Nutrient, Strain, UserSettings, Attachment, AiModelId, BreedingProject, ChatMessage, ChatSession } from '../types';
import { fileToGenerativePart } from '../services/geminiService';
import { Send, Bot, User, Sparkles, Trash2, Zap, Droplet, Sprout, Activity, ThermometerSun, Mic, Paperclip, X, Brain, Volume2, Headphones, MicOff, PhoneOff, MessageSquare, Plus, PanelLeftClose, PanelLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string, attachments: Attachment[], modelId: AiModelId) => void;
  nutrients: Nutrient[];
  strains: Strain[];
  breedingProjects?: BreedingProject[];
  settings: UserSettings;
  
  // Session Props
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onLoadSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClearChat?: () => void; // Optional legacy clear
}

const QUICK_PROMPTS = [
  { label: "Create Feeding Schedule", icon: Droplet, prompt: "Based on my nutrient inventory, create a week-by-week feeding schedule for the flowering stage." },
  { label: "Diagnose Deficiency", icon: Activity, prompt: "My lower fan leaves are turning yellow and falling off during week 4 of flower. What could be the issue?" },
  { label: "Suggest Breeding Pair", icon: Sprout, prompt: "Look at my strain library. Which two strains would you cross for high yield and flavor, and why?" },
  { label: "VPD Explanation", icon: ThermometerSun, prompt: "Explain VPD (Vapor Pressure Deficit) and what targets I should aim for in late veg." },
  { label: "Crop Steering", icon: Zap, prompt: "How can I use crop steering techniques to bulk up my flowers using my current nutrients?" },
];

// --- Live Voice Overlay Component ---
const LiveSessionOverlay = ({ 
  isOpen, 
  onClose, 
  onSend, 
  lastModelMessage,
  isProcessing 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSend: (text: string) => void; 
  lastModelMessage: string;
  isProcessing: boolean;
}) => {
  const [state, setState] = useState<'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING'>('IDLE');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) {
      stopAll();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setState('LISTENING');
      
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        
        // Auto-submit logic: If final result
        if (event.results[current].isFinal) {
           handleUserFinishedSpeaking(text);
        }
      };

      recognition.onend = () => {
        // If simply stopped but not processing, restart (keep alive)
        if (state === 'LISTENING' && !isProcessing) {
           // Small delay to prevent tight loops
           setTimeout(() => {
             if (isOpen && state === 'LISTENING') tryStartListening(); 
           }, 500);
        }
      };

      recognitionRef.current = recognition;
      // Start listening immediately on open
      tryStartListening();
    }

    return () => stopAll();
  }, [isOpen]);

  // Handle AI Response -> TTS
  useEffect(() => {
    if (!isOpen) return;

    if (isProcessing) {
      setState('PROCESSING');
      stopListening();
      stopSpeaking();
    } else if (lastModelMessage && state === 'PROCESSING') {
      // AI just finished
      setState('SPEAKING');
      speak(lastModelMessage);
    }
  }, [isProcessing, lastModelMessage, isOpen]);

  const tryStartListening = () => {
    try {
      if (recognitionRef.current) recognitionRef.current.start();
    } catch (e) {
      // Often throws if already started, safe to ignore
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) synthesisRef.current.cancel();
  };

  const stopAll = () => {
    stopListening();
    stopSpeaking();
    setState('IDLE');
  };

  const handleUserFinishedSpeaking = (text: string) => {
    if (!text.trim()) return;
    stopListening();
    setState('PROCESSING');
    onSend(text);
    setTranscript('');
  };

  const speak = (text: string) => {
    stopSpeaking();
    // Clean markdown for speech
    const cleanText = text.replace(/[*#`_]/g, '').replace(/\[.*?\]/g, ''); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Select a better voice if available
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      setState('LISTENING');
      tryStartListening();
    };
    
    synthesisRef.current.speak(utterance);
  };

  const handleClose = () => {
    stopAll();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-8 animate-fade-in text-white">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center gap-2 text-white/70">
           <Brain size={18} />
           <span className="font-bold tracking-wider text-sm">GEMINI LIVE</span>
        </div>
        <button onClick={handleClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Visualizer Orb */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full">
         <div className="relative">
            {/* Core */}
            <div className={`w-32 h-32 rounded-full bg-gradient-to-tr from-canopy-400 to-blue-500 blur-md transition-all duration-500 z-10
                ${state === 'LISTENING' ? 'scale-100 opacity-80' : ''}
                ${state === 'PROCESSING' ? 'scale-75 opacity-90 animate-pulse' : ''}
                ${state === 'SPEAKING' ? 'scale-110 opacity-100' : ''}
            `}></div>
            
            {/* Outer Glow / Ripple */}
            <div className={`absolute inset-0 bg-canopy-500 rounded-full blur-xl transition-all duration-1000
                ${state === 'LISTENING' ? 'animate-ping opacity-20' : 'opacity-0'}
            `}></div>
            
             <div className={`absolute inset-0 bg-blue-500 rounded-full blur-2xl transition-all duration-300
                ${state === 'SPEAKING' ? 'scale-150 opacity-40 animate-pulse' : 'opacity-0'}
            `}></div>

            {/* Spinner for processing */}
            {state === 'PROCESSING' && (
               <div className="absolute inset-[-20px] border-4 border-t-white border-white/20 rounded-full animate-spin"></div>
            )}
         </div>

         {/* Status Text */}
         <div className="mt-12 text-center h-24">
            <h3 className="text-2xl font-bold mb-2 transition-all">
              {state === 'LISTENING' && (transcript || "Listening...")}
              {state === 'PROCESSING' && "Thinking..."}
              {state === 'SPEAKING' && "Canopy Speaking"}
            </h3>
            <p className="text-white/50 text-sm">{state === 'LISTENING' ? "Speak naturally" : ""}</p>
         </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
         <button 
           onClick={() => {
              if (state === 'LISTENING') stopListening();
              else tryStartListening();
           }}
           className={`p-6 rounded-full transition-all ${state === 'LISTENING' ? 'bg-white text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
         >
           {state === 'LISTENING' ? <Mic size={32} /> : <MicOff size={32} />}
         </button>

         <button 
            onClick={handleClose}
            className="p-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-all"
         >
            <PhoneOff size={32} />
         </button>
      </div>
    </div>
  );
};

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  chatHistory, 
  isLoading, 
  onSendMessage, 
  nutrients, 
  strains, 
  breedingProjects, 
  settings,
  sessions,
  currentSessionId,
  onNewChat,
  onLoadSession,
  onDeleteSession
}) => {
  const [query, setQuery] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AiModelId>(settings.preferredModel || 'gemini-3-flash-preview');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // --- Voice Input Logic (Standard) ---
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
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
  const handleSubmit = (e?: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const textToSend = manualQuery || query;
    if ((!textToSend.trim() && attachments.length === 0) || isLoading) return;

    setQuery('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    
    onSendMessage(textToSend, currentAttachments, selectedModel);
    
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const lastModelMessage = chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'model' 
    ? chatHistory[chatHistory.length - 1].text 
    : '';

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      
      {/* Live Voice Overlay */}
      <LiveSessionOverlay 
        isOpen={isLiveMode} 
        onClose={() => setIsLiveMode(false)}
        onSend={(text) => handleSubmit(undefined, text)}
        lastModelMessage={lastModelMessage}
        isProcessing={isLoading}
      />

      {/* Sidebar: Chat History */}
      <div className={`flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <button 
            onClick={onNewChat}
            className="w-full bg-canopy-600 hover:bg-canopy-700 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors shadow-sm"
          >
            <Plus size={18} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(session => (
            <div 
              key={session.id} 
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:text-gray-400'}`}
              onClick={() => onLoadSession(session.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className="flex-shrink-0" />
                <div className="truncate text-sm font-medium">{session.title}</div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
             <div className="text-center p-4 text-xs text-gray-400">No history yet</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 shadow-sm flex flex-col gap-2 sticky top-0">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
                </button>
                <div className="flex items-center gap-2">
                    <Sparkles className="text-canopy-500" size={20} />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Grow Assistant</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
              
              {/* Live Mode Trigger */}
              <button
                 onClick={() => setIsLiveMode(true)}
                 className="p-2 bg-gradient-to-r from-canopy-500 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all animate-pulse-slow flex items-center gap-2"
                 title="Enter Live Voice Mode"
              >
                 <Headphones size={18} />
                 <span className="text-xs font-bold hidden md:inline">Live Mode</span>
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
                  <option value="gemini-3-flash-preview">⚡ Gemini 3 Flash (Fast)</option>
                  <option value="gemini-3-pro-preview">🧠 Gemini 3 Pro (Reasoning)</option>
               </select>

               <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold ${selectedModel.includes('pro') ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-50 text-gray-400 dark:bg-gray-800/50'}`}>
                  <Brain size={14} />
                  <span>Thinking {selectedModel.includes('pro') ? 'ON' : 'OFF'}</span>
               </div>
               
               <div className="text-xs text-canopy-600 dark:text-canopy-400 font-medium flex items-center gap-1 bg-canopy-50 dark:bg-canopy-900/20 px-2 py-1.5 rounded-lg">
                  <Zap size={12} className="fill-current" /> Agentic Control
               </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-4 bg-white dark:bg-gray-900">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`flex max-w-[90%] md:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1 ${
                  msg.role === 'user' 
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' 
                    : 'bg-gradient-to-br from-canopy-400 to-canopy-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div className={`relative p-4 rounded-2xl text-sm leading-relaxed shadow-sm group ${
                  msg.role === 'user' 
                    ? 'bg-gray-800 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                }`}>
                   
                   {msg.role === 'model' && msg.isThinking && !msg.text && (
                      <div className="flex items-center gap-2 text-purple-500 mb-2 animate-pulse">
                          <Brain size={14} />
                          <span className="text-xs font-bold">Reasoning...</span>
                      </div>
                   )}

                   {msg.text ? (
                     <>
                       <div className="prose prose-sm max-w-none dark:prose-invert break-words">
                          <ReactMarkdown>
                            {msg.text}
                          </ReactMarkdown>
                       </div>
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
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 space-y-3 z-10">
          
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
          {!isLoading && chatHistory.length < 3 && !currentSessionId && (
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
            
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" />
            <button 
               type="button" 
               onClick={() => fileInputRef.current?.click()}
               className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-500 transition-colors"
            >
              <Paperclip size={20} />
            </button>

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

            <button 
               type="button"
               onClick={toggleListening}
               className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
               <Mic size={20} />
            </button>

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
    </div>
  );
};
