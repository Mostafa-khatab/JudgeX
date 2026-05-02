import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { 
  Share2, Code2, MessageSquare, Video as VideoIcon, 
  Clock, LogOut, FileText, ChevronRight,
  Monitor, Info, AlertCircle, Timer as TimerIcon
} from 'lucide-react';
import Countdown from 'react-countdown';
import httpRequest from '~/utils/httpRequest';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '~/components/ui/button';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '~/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from '~/components/ui/tooltip';
import Lobby from './components/Lobby';
import ProblemPanel from './components/ProblemPanel';
import CodeEditor from './components/CodeEditor';
import VideoPanel from './components/VideoPanel';
import ChatPanel from './components/ChatPanel';
import ReviewMode from './components/ReviewMode';

// Hooks
import useSocket from './hooks/useSocket';
import useWebRTC from './hooks/useWebRTC';
import useInterviewState from './hooks/useInterviewState';

// ============ API Handlers ============
const api = {
  getInterview: async (id, candidateToken) => {
    const config = candidateToken ? { headers: { 'x-candidate-token': candidateToken } } : {};
    const res = await httpRequest.get(`/interview/${id}`, config);
    return res.data;
  },
  getInterviewByToken: async (token, candidateToken) => {
    const config = candidateToken ? { headers: { 'x-candidate-token': candidateToken } } : {};
    const res = await httpRequest.get(`/interview/join/${token}`, config);
    return res.data;
  },
  joinInterview: async (token, name, email) => {
    const res = await httpRequest.post(`/interview/join/${token}`, { name, email });
    return res.data;
  },
  updateState: async (id, state, candidateToken) => {
    const config = candidateToken ? { headers: { 'x-candidate-token': candidateToken } } : {};
    const res = await httpRequest.post(`/interview/${id}/state`, state, config);
    return res.data;
  },
  runCode: async (code, language, input, candidateToken) => {
    const config = candidateToken ? { headers: { 'x-candidate-token': candidateToken } } : {};
    const res = await httpRequest.post(`/code/interview-run`, { code, language, input }, config);
    return res.data;
  },
  addMessage: async (id, content, role, candidateToken) => {
    const config = candidateToken ? { headers: { 'x-candidate-token': candidateToken } } : {};
    const res = await httpRequest.post(`/interview/${id}/messages`, { content, role }, config);
    return res.data;
  },
  endInterview: async (id) => {
    const res = await httpRequest.post(`/interview/${id}/end`);
    return res.data;
  }
};

const InterviewRoom = () => {
  const { t } = useTranslation('interview');
  const { id, token: inviteToken } = useParams();
  const navigate = useNavigate();
  
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLobby, setShowLobby] = useState(true);
  const [role, setRole] = useState('candidate');
  const [candidateToken, setCandidateToken] = useState(localStorage.getItem('candidateToken'));
  
  const [messages, setMessages] = useState([]);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [peerInfo, setPeerInfo] = useState(null);
  const [privateNotes, setPrivateNotes] = useState(() => localStorage.getItem(`notes_${id}`) || '');

  // 1. Socket Hook
  const { emit, on, isConnected: isSocketConnected } = useSocket(interview?._id, role, {
    name: role === 'interviewer' 
      ? interview?.instructor?.username || 'Interviewer' 
      : interview?.candidate?.name || 'Candidate',
    avatar: interview?.instructor?.avatar || null,
    inviteToken: candidateToken || inviteToken,
  });

  // 2. State Hook
  const { code, setCode, language, setLanguage, activeProblem, setActiveProblem } = useInterviewState(
    interview,
    { emit, on },
    { updateState: (id, state) => api.updateState(id, state, candidateToken) }
  );

  // 3. WebRTC Hook
  const webrtc = useWebRTC({ emit, on }, interview?._id, role);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        let res;
        if (inviteToken) {
          res = await api.getInterviewByToken(inviteToken, candidateToken);
        } else if (id) {
          res = await api.getInterview(id, candidateToken);
        }

        if (res?.success) {
          const payload = res.data || {};
          setInterview(payload);
          setRole(payload.role || 'candidate');
          setMessages(payload.messages || []);
          if (payload.candidateToken && payload.candidateToken !== candidateToken) {
            setCandidateToken(payload.candidateToken);
            localStorage.setItem('candidateToken', payload.candidateToken);
          }
        }
      } catch (err) {
        toast.error(t(err?.message?.includes?.('interview:') ? err.message : 'errors.failedFetchInterview'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, inviteToken, candidateToken, t]);

  const handleJoinFromLobby = async (data) => {
    setLoading(true);
    try {
      if (inviteToken && role === 'candidate') {
        const res = await api.joinInterview(inviteToken, data.name, data.email);
        if (res.success) {
          const payload = res.data || {};
          setInterview(payload);
          setRole(payload.role || 'candidate');
          setCandidateToken(payload.candidateToken || inviteToken);
          localStorage.setItem('candidateToken', payload.candidateToken || inviteToken);
          localStorage.setItem('candidateName', data.name || '');
          localStorage.setItem('candidateEmail', data.email || '');
          emit('join-interview', { interviewId: payload._id, role: 'candidate', name: data.name });
        }
      }
      await webrtc.startMedia({ video: data.isVideoOn, audio: data.isMicOn }, data.existingStream);
      setShowLobby(false);
    } catch (err) {
      console.error('[Room] Join failed:', err);
      toast.error(t('errors.failedJoinPrefix') + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setShowOutput(true);
    setOutput('');
    try {
      const res = await api.runCode(code, language, '', candidateToken);
      if (res.success) {
        setOutput(res.output || t('messages.codeExecutedSuccessfully'));
      } else {
        setOutput(t('errors.errorPrefix') + res.message);
      }
    } catch (err) {
      setOutput(t('errors.failedRunCodeFinal'));
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendMessage = async (content) => {
    try {
      const res = await api.addMessage(interview._id, content, role, candidateToken);
      if (res.success) {
        if (res.data) {
          setMessages(prev => [...prev, res.data]);
        }
        emit('interview-chat-message', { interviewId: interview._id, role, content });
      }
    } catch (err) {
      toast.error(t('errors.failedSendMessage'));
    }
  };

  const handleEndInterview = async () => {
    if (!window.confirm('WARNING: Ending this interview will PERMANENTLY DELETE all session data (code, chat, feedback). This action cannot be undone. Are you sure?')) return;
    try {
      const res = await api.endInterview(interview._id);
      if (res.success) {
        toast.success('Interview ended successfully');
        setInterview(prev => ({ ...prev, status: 'finished' }));
      }
    } catch (err) {
      toast.error('Failed to end interview');
    }
  };

  // Sync private notes
  useEffect(() => {
    if (id) localStorage.setItem(`notes_${id}`, privateNotes);
  }, [id, privateNotes]);

  // Listen for real-time events
  useEffect(() => {
    if (!on) return;
    const u1 = on('chat-message', (msg) => setMessages(prev => [...prev, msg]));
    const u2 = on('participant-joined', (data) => {
      setPeerInfo(data);
      toast.info(`${data.name} ${t('messages.joinedInterview') || 'joined the interview'}`);
    });
    const u3 = on('current-participants', ({ participants }) => {
      if (participants && participants.length > 0) setPeerInfo(participants[0]);
    });
    const u4 = on('participant-left', () => {
      setPeerInfo(null);
      toast.warn(t('messages.participantLeft') || 'Participant left the room');
    });
    const u5 = on('interview-finished', () => {
      setInterview(prev => ({ ...prev, status: 'finished' }));
      toast.info('The interview has ended.');
    });

    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [on, t]);

  const timerDeadline = useMemo(() => {
    if (!interview?.startedAt) return Date.now() + (interview?.duration || 60) * 60 * 1000;
    return new Date(interview.startedAt).getTime() + (interview.duration || 60) * 60 * 1000;
  }, [interview?.startedAt, interview?.duration]);

  if (loading) {
    return (
      <div className="h-screen jx-mesh-bg flex flex-col items-center justify-center space-y-6">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative h-24 w-24"
        >
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </motion.div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">{t('loading.preparingSession')}</h2>
          <p className="text-blue-200/50 text-sm font-medium">{t('loading.connectingServer')}</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {interview?.status === 'finished' ? (
        <motion.div
          key="review"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full"
        >
          <ReviewMode interview={interview} role={role} />
        </motion.div>
      ) : showLobby ? (
        <motion.div
          key="lobby"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="h-full"
        >
          <Lobby 
            interview={interview} 
            role={role} 
            onJoin={handleJoinFromLobby} 
            candidateToken={candidateToken} 
            isConnected={isSocketConnected}
          />
        </motion.div>
      ) : (
        <motion.div 
          key="room"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-screen text-neutral-900 dark:text-neutral-50 flex flex-col overflow-hidden bg-neutral-50 dark:bg-[#0a0a0b]"
        >
          {/* Header */}
          <header className="h-16 px-6 shrink-0 border-b border-neutral-200 dark:border-white/5 bg-white/80 dark:bg-[#0f0f11]/80 backdrop-blur-xl z-50">
            <div className="h-full flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] text-white rounded-xl">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black tracking-tighter uppercase">JudgeX</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-blue-500/30 text-blue-500 bg-blue-500/5">PRO</Badge>
                    </div>
                    <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest opacity-80">
                      {interview?.title}
                    </div>
                  </div>
                </div>

                <div className="h-8 w-[1px] bg-neutral-200 dark:bg-white/10 hidden sm:block" />

                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 shadow-inner">
                    <TimerIcon className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-black font-mono tracking-wider tabular-nums text-neutral-600 dark:text-neutral-300">
                      <Countdown 
                        date={timerDeadline} 
                        renderer={({ hours, minutes, seconds }) => (
                          <span>{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                        )}
                      />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${isSocketConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'} animate-pulse`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      {isSocketConnected ? 'Live Connection' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {role === 'interviewer' && (
                  <div className="flex items-center gap-2">
                    {interview?.questions?.length > 0 && (
                      <Select 
                        value={activeProblem?._id || interview?.questions?.find(q => q.isVisible)?.problemId?._id} 
                        onValueChange={async (problemId) => {
                          try {
                            await api.updateState(id, { activeProblemId: problemId }, candidateToken);
                            emit('interview-problem-switch', { interviewId: id, problemId, language });
                            const question = interview.questions.find(q => q.problemId._id === problemId);
                            if (question) setActiveProblem(question.problemId);
                            toast.success('Problem switched');
                          } catch (err) {
                            toast.error('Failed to switch problem');
                          }
                        }}
                      >
                        <SelectTrigger className="w-[200px] h-10 rounded-xl bg-neutral-100 dark:bg-white/5 border-none text-xs font-bold ring-offset-blue-500">
                          <SelectValue placeholder="Select Question" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-white/10 bg-[#0f0f11] text-white">
                          {interview?.questions?.map((q, i) => (
                            <SelectItem key={q.problemId._id} value={q.problemId._id} className="text-xs focus:bg-blue-600 focus:text-white">
                              {i + 1}. {q.problemId.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleEndInterview}
                            className="h-10 rounded-xl px-4 gap-2 font-bold text-xs uppercase tracking-tight shadow-lg shadow-rose-500/20"
                          >
                            <LogOut className="h-4 w-4" />
                            End
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Finalize and lock session</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                <div className="h-8 w-[1px] bg-neutral-200 dark:bg-white/10 hidden sm:block mx-1" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/interview/join/${inviteToken || interview?.inviteToken}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Invite link copied!');
                        }}
                        className="h-10 w-10 sm:w-auto sm:px-4 rounded-xl gap-2 font-bold text-xs uppercase tracking-tight"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="hidden lg:inline">Invite</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy candidate link</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </header>

          {/* Main Layout */}
          <main className="flex-1 overflow-hidden p-4 lg:p-6 jx-mesh-bg/5 relative">
            {/* Background vitality glow */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 blur-[120px] -z-10 rounded-full" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 blur-[120px] -z-10 rounded-full" />

            <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
              {/* Sidebar: Problem & Video */}
              <motion.section
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="col-span-1 lg:col-span-3 min-h-0 h-full flex flex-col gap-4 lg:gap-6"
              >
                <div className="jx-glass flex-1 overflow-hidden flex flex-col shadow-2xl">
                  <div className="jx-glass-header flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <div className="jx-tile-title">Problem</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black opacity-50 uppercase tracking-tighter">Markdown</Badge>
                  </div>
                  <div className="flex-1 min-h-0 bg-white dark:bg-transparent">
                    <ProblemPanel problem={activeProblem || interview?.questions?.find(q => q.isVisible)?.problemId} />
                  </div>
                </div>

                <div className="jx-glass h-[280px] overflow-hidden flex flex-col shadow-2xl">
                  <div className="jx-glass-header flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <VideoIcon className="h-4 w-4 text-rose-500" />
                      <div className="jx-tile-title">Participants</div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 p-4">
                    <VideoPanel
                      {...webrtc}
                      isSocketConnected={isSocketConnected}
                      peerInfo={peerInfo || {
                        name: role === 'interviewer' ? 'Candidate' : 'Interviewer'
                      }}
                    />
                  </div>
                </div>
              </motion.section>

              {/* Editor */}
              <motion.section
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="col-span-1 lg:col-span-6 min-h-0 h-full"
              >
                <div className="jx-glass-strong h-full overflow-hidden flex flex-col shadow-2xl relative group">
                  {/* Subtle top glow */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="jx-glass-header flex items-center px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-emerald-500" />
                      <div className="jx-tile-title">Workspace</div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <CodeEditor
                      code={code}
                      language={language}
                      onCodeChange={setCode}
                      onLanguageChange={setLanguage}
                      onRun={handleRunCode}
                      isRunning={isRunning}
                      allowedLanguages={interview?.allowedLanguages}
                      output={output}
                      showOutput={showOutput}
                      onCloseOutput={() => setShowOutput(false)}
                    />
                  </div>
                </div>
              </motion.section>

              {/* Interaction Panel (Chat/Notes) */}
              <motion.section
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="col-span-1 lg:col-span-3 min-h-0 h-full"
              >
                <div className="jx-glass h-full overflow-hidden flex flex-col shadow-2xl">
                  <Tabs defaultValue="chat" className="h-full flex flex-col">
                    <div className="jx-glass-header px-2 py-2">
                      <TabsList className="w-full bg-neutral-200/50 dark:bg-white/5 rounded-lg p-1">
                        <TabsTrigger value="chat" className="flex-1 rounded-md text-xs font-bold gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Chat
                        </TabsTrigger>
                        {role === 'interviewer' && (
                          <TabsTrigger value="notes" className="flex-1 rounded-md text-xs font-bold gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10">
                            <FileText className="h-3.5 w-3.5" />
                            Notes
                          </TabsTrigger>
                        )}
                      </TabsList>
                    </div>
                    
                    <div className="flex-1 min-h-0">
                      <TabsContent value="chat" className="h-full m-0">
                        <ChatPanel
                          messages={messages}
                          onSendMessage={handleSendMessage}
                          role={role}
                        />
                      </TabsContent>
                      {role === 'interviewer' && (
                        <TabsContent value="notes" className="h-full m-0 p-4">
                          <div className="h-full flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-neutral-500">
                              <Info className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Private Interviewer Notes</span>
                            </div>
                            <textarea
                              value={privateNotes}
                              onChange={(e) => setPrivateNotes(e.target.value)}
                              placeholder="Write your observation here... (candidate cannot see this)"
                              className="flex-1 w-full bg-neutral-50 dark:bg-white/5 rounded-xl p-4 text-sm font-medium resize-none focus:outline-none focus:ring-2 ring-blue-500/20 border border-neutral-200 dark:border-white/5 placeholder:opacity-50"
                            />
                            <div className="text-[10px] text-neutral-400 italic text-right">Auto-saved to local storage</div>
                          </div>
                        </TabsContent>
                      )}
                    </div>
                  </Tabs>
                </div>
              </motion.section>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InterviewRoom;
