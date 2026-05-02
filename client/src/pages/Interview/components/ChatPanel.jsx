import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

const ChatPanel = ({ messages, onSendMessage, role }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-white">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === role ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm border ${
              msg.role === role
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/10 rounded-tr-none'
                : 'bg-neutral-100 text-neutral-900 border-neutral-200 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-2 ml-1 mr-1 opacity-60">
              {msg.role} {msg.timestamp ? `• ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-3">
             <MessageSquare className="h-8 w-8 text-neutral-300" />
             <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Silent Channel</div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-neutral-100">
        <div className="flex gap-2">
          <Input
            placeholder="Type message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 h-11 rounded-xl bg-neutral-50 border-neutral-100 shadow-inner text-sm font-medium focus:ring-2 ring-blue-500/20"
          />
          <Button size="icon" onClick={handleSend} className="h-11 w-11 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
