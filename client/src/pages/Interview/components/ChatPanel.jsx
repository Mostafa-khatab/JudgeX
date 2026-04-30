import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { ScrollArea } from '~/components/ui/scroll-area';

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
    <div className="h-full flex flex-col bg-neutral-900/50 rounded-xl overflow-hidden border border-neutral-800">
      <div className="p-4 border-b border-neutral-800 bg-neutral-900 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-blue-400" />
        <h3 className="font-bold text-sm">Interview Chat</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === role ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === role 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-neutral-800 text-neutral-200 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider">
              {msg.role} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 bg-neutral-900 border-t border-neutral-800">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="bg-neutral-950 border-neutral-800 h-10"
          />
          <Button size="icon" onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 h-10 w-10 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
