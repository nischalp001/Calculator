import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { streamGeminiResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: selectedImage || undefined,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Create a placeholder message for AI
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'model',
        text: '',
        timestamp: Date.now()
      }]);

      await streamGeminiResponse(
        messages, // Pass history *excluding* the new message (handled in service or updated here)
        // Actually, the service expects 'history' to be previous messages. 
        // We passed the current state 'messages' which doesn't have the userMsg yet in the *render* cycle but does in the *updater*.
        // Safe bet: pass the current 'messages' array (before update) and the new components separately.
        // Wait, 'setMessages' is async. We should pass the actual array we want to send.
        // Let's rely on the service to construct the full request including the new message.
        input,
        userMsg.image || null,
        (chunkText) => {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, text: chunkText } : msg
          ));
        }
      );

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-12 px-4 border-t border-slate-800">
      <div className="w-full max-w-4xl flex flex-col h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600/20 rounded-lg">
               <Bot className="text-blue-400" size={24} />
             </div>
             <div>
               <h2 className="text-white font-semibold">Gemini AI Assistant</h2>
               <p className="text-xs text-slate-400">Powered by Google Gemini 2.5 Flash</p>
             </div>
          </div>
          <button 
            onClick={() => setMessages([])}
            className="p-2 text-slate-400 hover:text-red-400 transition"
            title="Clear Chat"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
              <Bot size={48} className="mb-4" />
              <p>Ask me anything about math, science, or upload an image!</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>
              
              <div className={`flex flex-col max-w-[80%] gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.image && (
                  <img src={msg.image} alt="User upload" className="max-w-full sm:max-w-xs rounded-xl border border-slate-700" />
                )}
                {msg.text && (
                   <div className={`p-4 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                     msg.role === 'user' 
                       ? 'bg-indigo-600 text-white rounded-tr-sm' 
                       : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                   }`}>
                     {msg.text}
                   </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
             <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                   <Bot size={16} className="text-white" />
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-sm border border-slate-700 flex items-center gap-2">
                   <Loader2 className="animate-spin text-blue-400" size={16} />
                   <span className="text-slate-400 text-sm">Thinking...</span>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
           {selectedImage && (
             <div className="mb-4 relative inline-block">
               <img src={selectedImage} alt="Preview" className="h-20 rounded-lg border border-slate-700" />
               <button 
                 onClick={() => setSelectedImage(null)}
                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition"
               >
                 <Trash2 size={12} />
               </button>
             </div>
           )}
           
           <div className="flex items-end gap-2 bg-slate-800/50 p-2 rounded-2xl border border-slate-700 focus-within:border-blue-500/50 transition">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageSelect}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition"
                title="Upload Image"
              >
                <ImageIcon size={20} />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Gemini..."
                className="flex-1 bg-transparent text-white placeholder-slate-500 p-3 max-h-32 focus:outline-none resize-none"
                rows={1}
                style={{ minHeight: '48px' }}
              />
              
              <button 
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className={`p-3 rounded-xl transition flex items-center justify-center ${
                  isLoading || (!input.trim() && !selectedImage)
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                }`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
           </div>
           <div className="mt-2 text-center">
             <span className="text-[10px] text-slate-600">Gemini may display inaccurate info, including about people, so double-check its responses.</span>
           </div>
        </div>

      </div>
    </div>
  );
};
