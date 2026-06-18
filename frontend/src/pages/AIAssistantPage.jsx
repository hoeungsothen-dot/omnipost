import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiAPI } from '../services/api';
import { Sparkles, Send, Loader2, User, Bot, Lightbulb } from 'lucide-react';

const SUGGESTIONS = [
  'Generate captions for a product launch on Instagram and TikTok',
  'What hashtags should I use for a fitness brand on Instagram?',
  'What are the best posting times for a Cambodian audience on Facebook?',
  'Give me 5 content ideas for a restaurant this week',
  'How do I increase engagement on LinkedIn posts?',
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your OmniPost AI assistant. I can help with captions, hashtags, content ideas, posting strategy, and analytics insights. What would you like help with?' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  const chatMutation = useMutation({
    mutationFn: (msgs) => aiAPI.chat({ messages: msgs.filter(m => m.role !== 'system') }),
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    },
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    chatMutation.mutate(newMessages);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b border-gray-100 bg-white">
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Sparkles size={18} className="text-indigo-500" /> AI Assistant</h1>
        <p className="text-xs text-gray-500">Powered by Claude — your digital marketing co-pilot</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 1 && (
          <div className="grid grid-cols-1 gap-2 mt-2">
            <p className="text-xs font-medium text-gray-500 mb-1">Try asking:</p>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => send(s)} className="text-left text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 py-2 transition">
                <Lightbulb size={12} className="inline mr-1.5" />{s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-indigo-600' : 'bg-gray-100'}`}>
              {m.role === 'user' ? <User size={13} className="text-white" /> : <Bot size={13} className="text-gray-600" />}
            </div>
            <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
              {m.content}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
              <Bot size={13} className="text-gray-600" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 size={14} className="animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Ask anything about content strategy, captions, hashtags..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          />
          <button onClick={() => send()} className="btn-primary px-3" disabled={chatMutation.isPending || !input.trim()}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
