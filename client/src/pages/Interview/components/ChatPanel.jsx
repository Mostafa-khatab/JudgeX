import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import ClayIcon from './ClayIcon';

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
    <div className="h-full flex flex-col min-h-0">
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClayIcon size={34} tint="amber" className="rounded-2xl">
            <MessageSquare className="h-4 w-4" />
          </ClayIcon>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-neutral-400">Chat</div>
            <div className="text-xs text-neutral-500">Fast notes, low friction</div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === role ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-3xl px-4 py-2.5 text-sm border ${
              msg.role === role
                ? 'bg-gradient-to-br from-blue-500/30 to-violet-500/20 text-white border-white/10 rounded-tr-xl'
                : 'bg-white/[0.06] text-neutral-100 border-white/10 rounded-tl-xl'
            }`}>
              {msg.content}
            </div>
            <span className="text-[10px] font-black text-neutral-500 mt-1 uppercase tracking-[0.20em]">
              {msg.role} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
            </span>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="bg-black/30 border-white/10 h-11 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/30"
          />
          <Button size="icon" onClick={handleSend} className="h-11 w-11 rounded-2xl shrink-0 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white shadow-xl shadow-blue-500/20">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
