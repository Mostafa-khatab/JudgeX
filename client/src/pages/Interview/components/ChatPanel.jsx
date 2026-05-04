import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

const ChatPanel = ({ messages, onSendMessage, role, onViewCode }) => {
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
    <div className="h-full flex flex-col min-h-0 bg-transparent text-white">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => {
          const isMe = msg.role === role;
          const isSystem = msg.role === 'system';

          if (isSystem) {
            return (
              <div key={i} className="flex flex-col items-center my-4 space-y-2">
                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full animate-pulse ${msg.content.includes('✅') ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {msg.content}
                </div>
                {msg.code && (
                  <button 
                    onClick={() => onViewCode?.(msg.code, msg.language)}
                    className="text-[9px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 transition-colors"
                  >
                    View Snapshot
                  </button>
                )}
              </div>
            );
          }

          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm font-medium border transition-all ${
                isMe
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 rounded-tr-none'
                  : 'bg-white/10 text-white/90 border-white/10 rounded-tl-none backdrop-blur-md'
              }`}>
                {msg.content}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest text-white/30 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                {isMe ? 'You' : msg.role} {msg.timestamp ? `• ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
              </span>
            </div>
          );
        })}
        
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-20 py-20">
             <MessageSquare className="h-10 w-10 text-white" />
             <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white text-center">No messages yet</div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-xl">
        <div className="flex gap-2 relative">
          <Input
            placeholder="Type message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 h-10 rounded-xl bg-white/10 border-white/5 text-white placeholder:text-white/20 text-xs font-medium focus:ring-1 ring-blue-500/40"
          />
          <Button 
            size="icon" 
            onClick={handleSend} 
            className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 shrink-0 transition-transform active:scale-95"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
