import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare,
  ChevronLeft, ChevronRight, History,
  Star, User, Calendar
} from 'lucide-react';
import { Editor } from '@monaco-editor/react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

import ClayIcon from './ClayIcon';

const ReviewMode = ({ interview, role }) => {
  const { t } = useTranslation('interview');
  const [activeSnapshotIdx, setActiveSnapshotIdx] = useState(0);
  const snapshots = interview?.snapshots || [];
  const currentSnapshot = snapshots[activeSnapshotIdx] || { code: interview?.state?.code, language: interview?.state?.language };

  const formatDate = (date) => {
    if (!date) return '...';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return '...';
    }
  };

  return (
    <div className="dark h-screen text-white flex flex-col overflow-hidden bg-[radial-gradient(1200px_700px_at_15%_-10%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(900px_600px_at_92%_12%,rgba(168,85,247,0.16),transparent_55%),linear-gradient(to_br,rgba(10,10,10,1),rgba(4,4,6,1))]">
      {/* Header */}
      <header className="h-16 px-5 sm:px-7 shrink-0">
        <div className="jx-glass-header h-full rounded-b-3xl border border-white/10 border-t-0 flex items-center justify-between px-5 sm:px-7">
        <div className="flex items-center gap-6">
          <Badge className="bg-neutral-800 text-neutral-400 border-neutral-700">{t('status.finished')}</Badge>
          <div className="h-4 w-px bg-neutral-800" />
          <h1 className="text-xl font-bold">{interview?.title}</h1>
        </div>
        
        <div className="flex items-center gap-4 text-neutral-500 text-sm">
          <ClayIcon size={22} tint="neutral" className="rounded-xl shadow-none">
            <Calendar className="h-4 w-4" />
          </ClayIcon>
          {formatDate(interview?.endedAt)}
        </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-4 sm:p-6 gap-6">
        {/* Left: Timeline & Code (70%) */}
        <div className="flex-[3] flex flex-col gap-4">
          <Card className="jx-glass-strong flex-1 overflow-hidden flex flex-col">
            <div className="jx-glass-header px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClayIcon size={34} tint="violet" className="rounded-2xl shadow-none ring-white/10">
                  <History className="h-4 w-4" />
                </ClayIcon>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-neutral-400">{t('sections.codeTimeline')}</div>
                  <div className="text-xs text-neutral-500">Snapshot playback</div>
                </div>
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
          <Card className="jx-glass p-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-neutral-500 uppercase">{t('labels.playback')}</span>
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
            <TabsList className="jx-glass border border-white/10 w-full">
              <TabsTrigger value="info" className="flex-1">{t('sections.overview')}</TabsTrigger>
              <TabsTrigger value="chat" className="flex-1">{t('sections.chatLogs')}</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="flex-1 mt-4 space-y-4 overflow-y-auto pr-2">
              <Card className="jx-glass p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <ClayIcon size={48} tint="blue" className="rounded-[22px] shadow-none ring-white/10">
                    <User className="h-6 w-6" />
                  </ClayIcon>
                  <div>
                    <h3 className="font-bold text-lg">{interview?.candidate?.name || t('roles.candidate')}</h3>
                    <p className="text-xs text-neutral-500">{interview?.candidate?.email || t('labels.noEmail')}</p>
                  </div>
                </div>

                <Separator className="bg-neutral-800" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-neutral-500">
                    <span>{t('labels.totalDuration')}</span>
                    <span className="text-white font-medium">{interview?.duration}{t('labels.durationUnit')}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>{t('labels.finalRecommendation')}</span>
                    <Badge variant="secondary" className="bg-blue-600/10 text-blue-400">
                      {role === 'interviewer' ? (interview?.feedback?.recommendation || t('labels.noData')) : t('labels.restricted')}
                    </Badge>
                  </div>
                </div>
              </Card>

              {role === 'interviewer' && interview?.feedback && (
                <Card className="jx-glass p-6 space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <ClayIcon size={26} tint="amber" className="rounded-2xl shadow-none ring-white/10">
                      <Star className="h-4 w-4" />
                    </ClayIcon>
                    {t('sections.evaluation')}
                  </h4>
                  <div className="space-y-4">
                    {['problemSolving', 'communication', 'codingStyle'].map(key => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-black text-neutral-500 tracking-widest">
                          <span>{t(`categories.${key}`)}</span>
                          <span>{interview.feedback?.[key]?.score || 0}{t('labels.scoreScale')}</span>
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
              <Card className="jx-glass flex-1 p-4 overflow-y-auto space-y-4">
                {interview?.messages?.map((msg, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${msg.role === 'interviewer' ? 'text-blue-400' : 'text-neutral-500'}`}>
                        {msg.role}
                      </span>
                      <span className="text-[10px] text-neutral-700">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-200 leading-relaxed bg-white/[0.06] p-3 rounded-2xl border border-white/10">
                      {msg.content}
                    </p>
                  </div>
                ))}
                {(!interview?.messages || interview.messages.length === 0) && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <MessageSquare className="h-12 w-12" />
                    <p className="text-xs mt-2">{t('messages.noMessages')}</p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          <Button 
            variant="ghost" 
            className="w-full h-12 rounded-2xl border border-white/10 hover:bg-white/[0.06] text-neutral-400 hover:text-white"
            onClick={() => window.close()}
          >
            {t('buttons.closeSession')}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ReviewMode;
const Separator = ({ className }) => <div className={`h-px w-full ${className}`} />;
