import { useState } from 'react';
import { 
  Code2, MessageSquare, Clock, 
  ChevronLeft, ChevronRight, History,
  FileText, Star, User, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Editor } from '@monaco-editor/react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

const ReviewMode = ({ interview, role }) => {
  const [activeSnapshotIdx, setActiveSnapshotIdx] = useState(0);
  const snapshots = interview?.snapshots || [];
  const currentSnapshot = snapshots[activeSnapshotIdx] || { code: interview?.state?.code, language: interview?.state?.language };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="dark h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-neutral-800 bg-black/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <Badge className="bg-neutral-800 text-neutral-400 border-neutral-700">Finished</Badge>
          <div className="h-4 w-px bg-neutral-800" />
          <h1 className="text-xl font-bold">{interview?.title}</h1>
        </div>
        
        <div className="flex items-center gap-4 text-neutral-500 text-sm">
          <Calendar className="h-4 w-4" />
          {formatDate(interview?.endedAt)}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left: Timeline & Code (70%) */}
        <div className="flex-[3] flex flex-col gap-4">
          <Card className="flex-1 bg-neutral-900/50 border-neutral-800 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="h-4 w-4 text-blue-400" />
                <span className="font-bold text-sm">Code Timeline</span>
                <Badge variant="outline" className="text-[10px]">{currentSnapshot.language}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  size="icon" variant="ghost" className="h-8 w-8"
                  disabled={activeSnapshotIdx === 0}
                  onClick={() => setActiveSnapshotIdx(v => v - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-mono text-neutral-500">
                  {activeSnapshotIdx + 1} / {snapshots.length || 1}
                </span>
                <Button 
                  size="icon" variant="ghost" className="h-8 w-8"
                  disabled={activeSnapshotIdx === snapshots.length - 1}
                  onClick={() => setActiveSnapshotIdx(v => v + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1">
              <Editor
                height="100%"
                language={currentSnapshot.language}
                value={currentSnapshot.code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 20 },
                  fontFamily: "'Fira Code', monospace",
                }}
              />
            </div>
          </Card>

          {/* Timeline Slider / Markers */}
          <Card className="p-4 bg-neutral-900/50 border-neutral-800">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-neutral-500 uppercase">Playback</span>
              <input 
                type="range" 
                min="0" 
                max={snapshots.length - 1} 
                value={activeSnapshotIdx}
                onChange={(e) => setActiveSnapshotIdx(parseInt(e.target.value))}
                className="flex-1 accent-blue-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </Card>
        </div>

        {/* Right: Info & Chat (30%) */}
        <div className="flex-1 flex flex-col gap-6">
          <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-neutral-900 border-neutral-800 w-full">
              <TabsTrigger value="info" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="chat" className="flex-1">Chat Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="flex-1 mt-4 space-y-4 overflow-y-auto pr-2">
              <Card className="bg-neutral-900/50 border-neutral-800 p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center">
                    <User className="h-6 w-6 text-neutral-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{interview?.candidate?.name || 'Candidate'}</h3>
                    <p className="text-xs text-neutral-500">{interview?.candidate?.email}</p>
                  </div>
                </div>

                <Separator className="bg-neutral-800" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-neutral-500">
                    <span>Total Duration</span>
                    <span className="text-white font-medium">{interview?.duration}m</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Final Recommendation</span>
                    <Badge variant="secondary" className="bg-blue-600/10 text-blue-400">
                      {role === 'interviewer' ? (interview?.feedback?.recommendation || 'No Data') : 'Restricted'}
                    </Badge>
                  </div>
                </div>
              </Card>

              {role === 'interviewer' && interview?.feedback && (
                <Card className="bg-neutral-900/50 border-neutral-800 p-6 space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Evaluation
                  </h4>
                  <div className="space-y-4">
                    {['problemSolving', 'communication', 'codingStyle'].map(key => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-black text-neutral-500 tracking-widest">
                          <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span>{interview.feedback[key]?.score || 0}/5</span>
                        </div>
                        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-1000" 
                            style={{ width: `${(interview.feedback[key]?.score || 0) * 20}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="chat" className="flex-1 mt-4 overflow-hidden flex flex-col">
              <Card className="flex-1 bg-neutral-900/50 border-neutral-800 p-4 overflow-y-auto space-y-4">
                {interview?.messages?.map((msg, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${msg.role === 'interviewer' ? 'text-blue-400' : 'text-neutral-500'}`}>
                        {msg.role}
                      </span>
                      <span className="text-[10px] text-neutral-700">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed bg-neutral-800/40 p-3 rounded-xl border border-white/5">
                      {msg.content}
                    </p>
                  </div>
                ))}
                {(!interview?.messages || interview.messages.length === 0) && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <MessageSquare className="h-12 w-12" />
                    <p className="text-xs mt-2">No messages</p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          <Button 
            variant="ghost" 
            className="w-full h-12 border border-neutral-800 hover:bg-neutral-800 text-neutral-500 hover:text-white"
            onClick={() => window.close()}
          >
            Close Session
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ReviewMode;
const Separator = ({ className }) => <div className={`h-px w-full ${className}`} />;
