import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { 
  Share2, Code2, MessageSquare, Video as VideoIcon, 
  Clock, LogOut, FileText, ChevronRight,
  Monitor, Info, AlertCircle, Timer as TimerIcon, Users
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
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '~/components/ui/dialog';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Search, Loader2, Plus } from 'lucide-react';
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
  },
  searchProblems: async (q) => {
    const res = await httpRequest.get(`/problem/search-for-interview`, { params: { q } });
    return res.data;
  },
  addQuestion: async (id, problemId) => {
    const res = await httpRequest.post(`/interview/${id}/questions`, { problemId });
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
          className="h-screen flex flex-col bg-[#f0f0f0] text-neutral-900"
        >
          {/* Header */}
          <header className="h-14 px-4 shrink-0 bg-white border-b border-neutral-200 flex items-center justify-between z-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer">
                 <ChevronRight className="h-4 w-4 rotate-180" />
                 <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1 rounded-lg border border-neutral-200">
                    <Monitor className="h-4 w-4" />
                    <span className="text-sm font-medium">WhiteBoard 1</span>
                    <ChevronRight className="h-3 w-3 rotate-90 opacity-40" />
                 </div>
              </div>
              <Plus className="h-4 w-4 text-neutral-400 cursor-pointer" />
            </div>

            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2 text-neutral-500 font-mono text-sm tabular-nums">
                 <Clock className="h-4 w-4" />
                 <Countdown 
                    date={timerDeadline} 
                    renderer={({ hours, minutes, seconds }) => (
                      <span>{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                    )}
                  />
               </div>
               <div className="flex items-center gap-3">
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500"><Share2 className="h-4 w-4" /></Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500"><TimerIcon className="h-4 w-4" /></Button>
                 <div className="size-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">B</div>
                 <Button 
                   onClick={() => {
                      const url = `${window.location.origin}/interview/join/${inviteToken || interview?.inviteToken}`;
                      navigator.clipboard.writeText(url);
                      toast.success('Invite link copied!');
                   }}
                   className="h-9 px-4 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 rounded-lg text-sm font-medium flex items-center gap-2"
                 >
                   <Users className="h-4 w-4" />
                   Invite
                 </Button>
               </div>
            </div>
          </header>

          {/* Workspace Layout */}
          <main className="flex-1 overflow-hidden grid grid-cols-12 gap-[1px] bg-neutral-200">
            {/* Editor Column */}
            <div className="col-span-12 lg:col-span-5 bg-white flex flex-col min-h-0 relative">
               <div className="h-10 border-b border-neutral-100 flex items-center px-4 bg-neutral-50/50">
                  <div className="bg-white px-4 h-full flex items-center border-x border-neutral-100 text-xs font-bold text-blue-600">
                    C
                    <ChevronRight className="h-3 w-3 rotate-90 ml-2 opacity-50" />
                  </div>
                  <Plus className="h-3 w-3 ml-4 text-neutral-400" />
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
                    showOutput={false} // Hidden as output is in the center column
                  />
               </div>
            </div>

            {/* Output Column */}
            <div className="col-span-12 lg:col-span-4 bg-white flex flex-col min-h-0">
               <div className="h-10 border-b border-neutral-100 flex items-center justify-between px-4 bg-neutral-50/50">
                  <span className="text-xs font-bold text-neutral-400">Output:</span>
                  <Button variant="ghost" size="sm" onClick={() => setOutput('')} className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-blue-500">Clear</Button>
               </div>
               <div className="flex-1 min-h-0 p-6 overflow-auto font-mono text-sm text-neutral-600 bg-white">
                  {output || "Run code to see output..."}
               </div>
               <div className="p-4 border-t border-neutral-100 flex justify-end">
                  <Button 
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20"
                  >
                    {isRunning ? <Loader2 className="animate-spin" /> : "Run Code"}
                  </Button>
               </div>
            </div>

            {/* Interaction Column */}
            <div className="col-span-12 lg:col-span-3 bg-white flex flex-col min-h-0">
               <div className="h-14 flex items-center justify-center gap-6 border-b border-neutral-100 px-4">
                  <Button variant="ghost" className="h-full border-b-2 border-emerald-500 rounded-none text-neutral-900 font-bold flex items-center gap-2">
                     <div className="p-1 bg-emerald-50 text-emerald-600 rounded-md"><MessageSquare size={14} /></div>
                     Chat
                  </Button>
                  <Button variant="ghost" className="h-full border-b-2 border-transparent rounded-none text-neutral-400 font-bold flex items-center gap-2">
                     <div className="p-1 bg-blue-50 text-blue-600 rounded-md"><FileText size={14} /></div>
                     Evaluation
                  </Button>
               </div>
               
               <div className="flex-1 min-h-0 flex flex-col">
                  {/* Participant Preview Placeholder */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-50">
                     <span className="text-xs font-bold text-neutral-400">Participants <span className="ml-1 text-neutral-300">1</span></span>
                     <ChevronRight className="h-4 w-4 rotate-90 text-neutral-300" />
                  </div>
                  
                  {/* Video Panel */}
                  <div className="p-4">
                     <VideoPanel
                       {...webrtc}
                       isSocketConnected={isSocketConnected}
                       peerInfo={peerInfo || { name: role === 'interviewer' ? 'Candidate' : 'Interviewer' }}
                       theme="light"
                     />
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 min-h-0 mt-auto flex flex-col border-t border-neutral-100">
                    <ChatPanel
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      role={role}
                      theme="light"
                    />
                  </div>
               </div>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============ Subcomponents ============

const AddProblemDialog = ({ onAdd, api }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      if (search.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.searchProblems(search);
        if (res.success) setResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, open, api]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-white/5 border-none">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-[#0f0f11] border-white/10 text-white rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-black tracking-tight">Add Problem</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input 
              placeholder="Search by name or ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-12 bg-white/5 border-none rounded-xl text-sm focus:ring-blue-500/40"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 opacity-50">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <p className="text-[10px] font-black uppercase tracking-widest">Searching bank...</p>
              </div>
            ) : results.length > 0 ? (
              results.map(prob => (
                <div 
                  key={prob._id} 
                  className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-transparent hover:border-white/5 transition-all group"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold truncate max-w-[250px]">{prob.name}</h4>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`text-[9px] h-4 px-1.5 border-none ${
                        prob.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-400/10' :
                        prob.difficulty === 'medium' ? 'text-amber-400 bg-amber-400/10' : 'text-rose-400 bg-rose-400/10'
                      }`}>
                        {prob.difficulty.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{prob.id}</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      onAdd(prob._id);
                      setOpen(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  >
                    Add
                  </Button>
                </div>
              ))
            ) : search.length >= 2 ? (
              <div className="py-12 text-center text-neutral-500 text-[10px] font-black uppercase tracking-widest">No problems found</div>
            ) : (
              <div className="py-12 text-center text-neutral-500 text-[10px] font-black uppercase tracking-widest">Type to search the bank</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewRoom;
