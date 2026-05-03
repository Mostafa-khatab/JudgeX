import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare,
  ChevronLeft, ChevronRight, History,
  Star, User, Calendar, Play, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';
import { Editor } from '@monaco-editor/react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

const ReviewMode = ({ interview, role }) => {
  const { t } = useTranslation('interview');
  const [activeSnapshotIdx, setActiveSnapshotIdx] = useState(0);
  const snapshots = interview?.snapshots || [];
  const currentSnapshot = snapshots[activeSnapshotIdx] || { code: interview?.state?.code, language: interview?.state?.language };

  // Extract code run evaluation entries from snapshots
  const evaluationRecords = useMemo(() => {
    return snapshots
      .map((snap, idx) => {
        if (!snap.note) return null;
        const match = snap.note.match(/^\[(success|error|compile_error)\]\s*(.*)/i);
        if (!match) return null;
        return {
          idx,
          status: match[1].toLowerCase(),
          detail: match[2] || '',
          timestamp: snap.timestamp,
          language: snap.language,
          code: snap.code,
        };
      })
      .filter(Boolean);
  }, [snapshots]);

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

  const formatTime = (date) => {
    if (!date) return '...';
    try {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return '...';
    }
  };

  const statusConfig = {
    success: { label: 'Success', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
    error: { label: 'Runtime Error', icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
    compile_error: { label: 'Compile Error', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  };

  return (
    <div className="h-screen text-neutral-900 dark:text-neutral-50 flex flex-col overflow-hidden bg-neutral-50 dark:bg-[#0a0a0b] jx-mesh-bg/5 relative">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 blur-[120px] -z-10 rounded-full" />

      {/* Header */}
      <header className="h-16 px-6 shrink-0 border-b border-neutral-200 dark:border-white/5 bg-white/80 dark:bg-[#0f0f11]/80 backdrop-blur-xl z-50">
        <div className="h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white rounded-xl">
                <History className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-tighter uppercase">Review</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-emerald-500/30 text-emerald-500 bg-emerald-500/5">COMPLETED</Badge>
                </div>
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest opacity-80">
                  {interview?.title}
                </div>
              </div>
            </div>
            
            <div className="h-8 w-[1px] bg-neutral-200 dark:bg-white/10 hidden sm:block" />

            <div className="hidden md:flex items-center gap-3 text-neutral-500 text-xs font-bold uppercase tracking-widest">
              <Calendar className="h-4 w-4 text-blue-500" />
              {formatDate(interview?.endedAt)}
            </div>
          </div>

          <Button 
            variant="ghost" 
            className="rounded-xl h-10 px-5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white hover:bg-white/5"
            onClick={() => window.close()}
          >
            {t('buttons.closeSession')}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-4 lg:p-6 gap-6 relative">
        {/* Left: Timeline & Code (70%) */}
        <div className="flex-[3] flex flex-col gap-6 min-w-0">
          <div className="jx-glass-strong flex-1 overflow-hidden flex flex-col shadow-2xl relative group">
            <div className="jx-glass-header px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-sm font-black tracking-tight">{t('sections.codeTimeline')}</div>
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Playback session snapshot</div>
                </div>
                <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/5 text-[10px] font-black tracking-widest uppercase">{currentSnapshot.language}</Badge>
              </div>
              
              <div className="flex items-center gap-4 bg-neutral-100 dark:bg-white/5 p-1 rounded-xl">
                <Button 
                  size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-white/10"
                  disabled={activeSnapshotIdx === 0}
                  onClick={() => setActiveSnapshotIdx(v => v - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-[10px] font-black font-mono tracking-widest text-neutral-500 tabular-nums">
                  {activeSnapshotIdx + 1} / {snapshots.length || 1}
                </span>
                <Button 
                  size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-white/10"
                  disabled={activeSnapshotIdx === snapshots.length - 1}
                  onClick={() => setActiveSnapshotIdx(v => v + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={currentSnapshot.language === 'cpp' ? 'cpp' : currentSnapshot.language}
                value={currentSnapshot.code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 20 },
                  fontFamily: "'Fira Code', monospace",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="jx-glass p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest min-w-fit">{t('labels.playback')}</span>
              <div className="flex-1 relative flex items-center h-4 group/slider">
                <input 
                  type="range" 
                  min="0" 
                  max={snapshots.length - 1} 
                  value={activeSnapshotIdx}
                  onChange={(e) => setActiveSnapshotIdx(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 transition-all group-hover/slider:h-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info, Evaluation & Chat (30%) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden jx-glass shadow-2xl">
            <div className="jx-glass-header px-3 py-3">
              <TabsList className="w-full bg-neutral-100 dark:bg-white/5 rounded-xl p-1">
                <TabsTrigger value="info" className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">{t('sections.overview')}</TabsTrigger>
                <TabsTrigger value="evaluation" className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
                  Evaluation
                  {evaluationRecords.length > 0 && (
                    <Badge className="ml-1.5 h-4 px-1 text-[8px] bg-blue-500 border-none">{evaluationRecords.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">{t('sections.chatLogs')}</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {/* Overview Tab */}
              <TabsContent value="info" className="h-full m-0 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <div className="flex items-center gap-5 p-5 bg-neutral-50 dark:bg-white/5 rounded-2xl border border-neutral-200 dark:border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full -z-10" />
                    <div className="p-4 bg-blue-600/20 text-blue-400 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg tracking-tight text-neutral-900 dark:text-neutral-100">{interview?.candidate?.name || t('roles.candidate')}</h3>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{interview?.candidate?.email || t('labels.noEmail')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">{t('labels.totalDuration')}</span>
                      <span className="text-xl font-black tabular-nums">{interview?.duration}<span className="text-xs ml-1 text-neutral-500 uppercase">{t('labels.durationUnit')}</span></span>
                    </div>
                    <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">Code Runs</span>
                      <span className="text-xl font-black tabular-nums">{evaluationRecords.length}</span>
                    </div>
                  </div>

                  {role === 'interviewer' && interview?.feedback && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t('sections.evaluation')}</h4>
                      </div>
                      <div className="space-y-5">
                        {['problemSolving', 'communication', 'codingStyle'].map(key => (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500">
                              <span>{t(`categories.${key}`)}</span>
                              <span className="text-neutral-900 dark:text-neutral-100">{interview.feedback?.[key]?.score || 0}{t('labels.scoreScale')}</span>
                            </div>
                            <div className="h-1.5 bg-neutral-200 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000" 
                                style={{ width: `${(interview.feedback[key]?.score || 0) * 20}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Evaluation Record Tab */}
              <TabsContent value="evaluation" className="h-full m-0 overflow-hidden flex flex-col relative">
                <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                  {evaluationRecords.length > 0 ? (
                    evaluationRecords.map((record, i) => {
                      const cfg = statusConfig[record.status] || statusConfig.error;
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => setActiveSnapshotIdx(record.idx)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all hover:scale-[1.01] hover:shadow-lg ${cfg.bg} ${
                            activeSnapshotIdx === record.idx ? 'ring-2 ring-blue-500/40 shadow-md' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${cfg.color}`} />
                              <span className={`text-xs font-black uppercase tracking-widest ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-neutral-400 tabular-nums">
                              {formatTime(record.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-white/10 text-neutral-400">
                              {record.language}
                            </Badge>
                            <Play className="h-3 w-3 text-neutral-500" />
                            <span className="text-[10px] font-bold text-neutral-500">Run #{i + 1}</span>
                          </div>
                          {record.detail && (
                            <p className="text-[11px] text-neutral-400 font-mono truncate leading-relaxed mt-1">
                              {record.detail.substring(0, 120)}
                            </p>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-3">
                      <Play className="h-8 w-8" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">No code runs recorded</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Chat Logs Tab */}
              <TabsContent value="chat" className="h-full m-0 overflow-hidden flex flex-col relative">
                <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-neutral-50/50 dark:bg-black/20">
                  {interview?.messages?.map((msg, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${msg.role === 'interviewer' ? 'text-blue-500' : 'text-neutral-500'}`}>
                          {msg.role}
                        </span>
                        <div className="h-[1px] flex-1 bg-neutral-200 dark:bg-white/5" />
                        <span className="text-[10px] font-bold text-neutral-400 tabular-nums">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </span>
                      </div>
                      <div className="text-sm font-medium leading-relaxed bg-white dark:bg-white/5 p-4 rounded-2xl border border-neutral-200 dark:border-white/5 shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {(!interview?.messages || interview.messages.length === 0) && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-3">
                      <MessageSquare className="h-8 w-8" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('messages.noMessages')}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ReviewMode;
