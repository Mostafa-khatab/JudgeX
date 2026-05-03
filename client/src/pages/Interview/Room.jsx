import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { 
  Share2, Code2, MessageSquare, Video as VideoIcon, 
  Clock, LogOut, FileText, ChevronRight,
  Monitor, Info, AlertCircle, Timer as TimerIcon, Users,
  Play, Pause, RotateCcw
} from 'lucide-react';
import httpRequest from '~/utils/httpRequest';
import {
  Popover, PopoverContent, PopoverTrigger
} from '~/components/ui/popover';

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
import DrawingBoard from './components/DrawingBoard';

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
  addQuestion: async (id, data, candidateToken) => {
    const config = candidateToken ? { headers: { 'x-candidate-token': candidateToken } } : {};
    const res = await httpRequest.post(`/interview/${id}/questions`, data, config);
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
  startTimer: async (id) => {
    const res = await httpRequest.post(`/interview/${id}/start`);
    return res.data;
  },
  pauseTimer: async (id, remainingTime) => {
    const res = await httpRequest.post(`/interview/${id}/pause`, { remainingTime });
    return res.data;
  },
  resumeTimer: async (id) => {
    const res = await httpRequest.post(`/interview/${id}/resume`);
    return res.data;
  },
  takeSnapshot: async (id, note) => {
    const res = await httpRequest.post(`/interview/${id}/snapshot`, { note });
    return res.data;
  },
  searchProblems: async (q) => {
    const res = await httpRequest.get(`/problem/search-for-interview`, { params: { q } });
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
  const [remoteCursors, setRemoteCursors] = useState([]);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const timerIntervalRef = useRef(null);
  const [codeRunEvents, setCodeRunEvents] = useState([]);

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
      let runStatus = 'success';
      let runOutput = '';
      if (res.success) {
        runOutput = res.output || t('messages.codeExecutedSuccessfully');
        setOutput(runOutput);
        // Detect compile errors in output
        if (runOutput.toLowerCase().includes('compile error') || runOutput.toLowerCase().includes('compilation')) {
          runStatus = 'compile_error';
        }
      } else {
        runStatus = 'error';
        runOutput = res.message || 'Error';
        setOutput(t('errors.errorPrefix') + res.message);
      }
      // Emit code run event for notification + snapshot
      const problemName = activeProblem?.name || activeProblem?.title || 'Unknown';
      emit('interview-code-run', {
        interviewId: interview?._id,
        language,
        status: runStatus,
        output: runOutput?.substring(0, 300),
        problemName
      });
    } catch (err) {
      setOutput(t('errors.failedRunCodeFinal'));
      emit('interview-code-run', {
        interviewId: interview?._id,
        language,
        status: 'error',
        output: 'Execution failed',
        problemName: activeProblem?.name || 'Unknown'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCursorChange = useCallback((position) => {
    if (!interview?._id) return;
    if (!position?.lineNumber || !position?.column) return;
    emit('interview-cursor-update', { interviewId: interview._id, role, position });
  }, [emit, interview?._id, role]);

  useEffect(() => {
    if (!on) return;
    const cleanup = on('cursor-updated', (data) => {
      const r = data?.role;
      const p = data?.position;
      if (!r || !p) return;

      setRemoteCursors((prev) => {
        const next = prev.filter(x => x?.role !== r);
        next.push({ role: r, position: p, timestamp: data?.timestamp || Date.now() });
        return next;
      });
    });
    return () => cleanup?.();
  }, [on]);

  const handleSendMessage = async (content) => {
    try {
      const res = await api.addMessage(interview._id, content, role, candidateToken);
      if (res.success) {
        if (res.data) {
          setMessages(prev => [...prev, res.data]);
        }
        emit('interview-chat-message', { interviewId: interview._id, role, content });
      } else {
        toast.error(res?.msg || res?.message || t('errors.failedSendMessage'));
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || err?.response?.data?.message || t('errors.failedSendMessage'));
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

  const refreshInterview = useCallback(async () => {
    try {
      if (!interview?._id) return;
      const res = await api.getInterview(interview._id, candidateToken);
      if (res?.success) setInterview(res.data || null);
    } catch {
      // best-effort
    }
  }, [interview?._id, candidateToken]);

  const handleAddQuestion = useCallback(async (problemId) => {
    try {
      if (!interview?._id) return;
      const res = await api.addQuestion(interview._id, { problemId }, candidateToken);
      if (res?.success) {
        toast.success('Question added');
        await refreshInterview();
      } else {
        toast.error(res?.msg || res?.message || 'Failed to add question');
      }
    } catch (err) {
      toast.error(err?.response?.data?.msg || err?.response?.data?.message || err.message || 'Failed to add question');
    }
  }, [interview?._id, refreshInterview, candidateToken]);

  const handleAddWhiteboard = useCallback(async () => {
    try {
      if (!interview?._id) return;
      const idx = (interview?.questions?.filter(q => q.isCustom).length || 0) + 1;
      const res = await api.addQuestion(interview._id, { 
        customContent: { 
          title: `WhiteBoard ${idx}`,
          description: 'Collaborative space for free-form coding and discussion.'
        } 
      }, candidateToken);
      if (res?.success) {
        toast.success('Whiteboard added');
        await refreshInterview();
      }
    } catch (err) {
      toast.error('Failed to add whiteboard');
    }
  }, [interview?._id, interview?.questions, refreshInterview, candidateToken]);

  const handleSwitchProblem = useCallback(async (problemId) => {
    if (!interview?._id || !problemId) return;
    try {
      const res = await api.updateState(interview._id, { activeProblemId: problemId }, candidateToken);
      if (res?.success) {
        emit('interview-problem-switch', { interviewId: interview._id, problemId, language });
        await refreshInterview();
      }
    } catch (err) {
      toast.error('Failed to switch problem');
    }
  }, [interview?._id, language, emit, refreshInterview, candidateToken]);

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
      setTimerRunning(false);
      toast.info('The interview has ended.');
    });
    // Timer sync from peer
    const u6 = on('status-updated', ({ status, remainingTime }) => {
      if (status === 'active') {
        setTimerRunning(true);
        if (remainingTime !== undefined) setRemainingSeconds(remainingTime);
      } else if (status === 'paused') {
        setTimerRunning(false);
        if (remainingTime !== undefined) setRemainingSeconds(remainingTime);
      }
    });
    // Code run notification
    const u7 = on('code-run-result', (data) => {
      setCodeRunEvents(prev => [...prev, data]);
      if (data.role !== role) {
        const statusColors = { success: '✅', error: '❌', compile_error: '⚠️' };
        const icon = statusColors[data.status] || '🔵';
        toast.info(`${icon} ${data.role === 'candidate' ? 'Candidate' : 'Interviewer'} ran code on ${data.problemName} — ${data.status.replace('_', ' ')}`, {
          autoClose: 5000
        });
      }
    });

    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); };
  }, [on, t, role]);

  // Initialize timer from interview state
  useEffect(() => {
    if (!interview) return;
    const status = interview.status;
    const rem = interview.state?.remainingTime;
    const duration = (interview.duration || 60) * 60;

    if (status === 'active' && interview.startedAt) {
      if (rem !== null && rem !== undefined && rem > 0) {
        setRemainingSeconds(rem);
      } else {
        setRemainingSeconds(duration);
      }
      setTimerRunning(true);
    } else if (status === 'paused' && rem !== null && rem !== undefined) {
      setRemainingSeconds(rem);
      setTimerRunning(false);
    } else {
      setRemainingSeconds(duration);
      setTimerRunning(false);
    }
  }, [interview?._id, interview?.status, interview?.state?.remainingTime, interview?.duration]);

  // Timer tick
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (timerRunning && remainingSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            setTimerRunning(false);
            toast.warning('⏰ Time is up!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, remainingSeconds > 0]);

  // Timer controls (interviewer only)
  const handleStartTimer = useCallback(async () => {
    if (!interview?._id) return;
    try {
      if (interview.status === 'paused') {
        const res = await api.resumeTimer(interview._id);
        if (res?.success) {
          setTimerRunning(true);
          setInterview(prev => ({ ...prev, status: 'active' }));
          emit('interview-status-update', { interviewId: interview._id, status: 'active', remainingTime: remainingSeconds });
        }
      } else {
        const res = await api.startTimer(interview._id);
        if (res?.success) {
          setTimerRunning(true);
          setInterview(prev => ({ ...prev, status: 'active', startedAt: new Date().toISOString() }));
          emit('interview-status-update', { interviewId: interview._id, status: 'active', remainingTime: remainingSeconds });
        }
      }
    } catch (err) {
      toast.error('Failed to start timer');
    }
  }, [interview?._id, interview?.status, emit, remainingSeconds]);

  const handlePauseTimer = useCallback(async () => {
    if (!interview?._id) return;
    try {
      const res = await api.pauseTimer(interview._id, remainingSeconds);
      if (res?.success) {
        setTimerRunning(false);
        setInterview(prev => ({ ...prev, status: 'paused' }));
        emit('interview-status-update', { interviewId: interview._id, status: 'paused', remainingTime: remainingSeconds });
      }
    } catch (err) {
      toast.error('Failed to pause timer');
    }
  }, [interview?._id, remainingSeconds, emit]);

  const handleResetTimer = useCallback(async () => {
    if (!interview?._id) return;
    const fullDuration = (interview.duration || 60) * 60;
    try {
      const res = await api.pauseTimer(interview._id, fullDuration);
      if (res?.success) {
        setRemainingSeconds(fullDuration);
        setTimerRunning(false);
        setInterview(prev => ({ ...prev, status: 'paused' }));
        emit('interview-status-update', { interviewId: interview._id, status: 'paused', remainingTime: fullDuration });
        toast.success('Timer reset');
      }
    } catch (err) {
      toast.error('Failed to reset timer');
    }
  }, [interview?._id, interview?.duration, emit]);

  // Format seconds to HH:MM:SS
  const formatTimer = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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
          className="h-screen flex flex-col bg-[#0b0b0f] text-white"
        >
          {/* Header */}
          <header className="h-14 px-4 shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between z-50">
             <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[50%] py-1">
               <AnimatePresence mode="popover">
                 {interview?.questions?.map((q, idx) => {
                    const probId = q.problemId?._id || q.problemId || q._id;
                    const isSelected = (localViewProblemId || activeProblem?._id) === probId;
                    const isActive = activeProblem?._id === probId;
                    const displayName = q.isCustom ? q.customContent?.title : (q.problemName || `Problem ${idx + 1}`);

                    return (
                      <motion.div
                        key={q._id || idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => {
                          if (role === 'interviewer') {
                            setLocalViewProblemId(probId === activeProblem?._id ? null : probId);
                          }
                        }}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border transition-all whitespace-nowrap group ${role === 'interviewer' ? 'cursor-pointer hover:bg-white/10' : ''} ${
                          isSelected 
                            ? 'bg-white/15 border-white/20 text-white shadow-lg' 
                            : 'bg-white/5 border-white/5 text-white/40'
                        }`}
                      >
                        {q.isCustom ? <Monitor className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                        <span className="text-xs font-bold tracking-tight">{displayName}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] ml-1" title="Live for Candidate" />}
                      </motion.div>
                    );
                  })}
               </AnimatePresence>
               
               {role === 'interviewer' && (
                 <AddProblemDialog onAdd={handleAddQuestion} onAddWhiteboard={handleAddWhiteboard} api={api} />
               )}
             </div>

             <div className="flex items-center gap-8">
                <div className={`flex items-center gap-2 font-mono text-sm tabular-nums ${
                  timerRunning 
                    ? remainingSeconds <= 300 
                      ? 'text-rose-400' 
                      : 'text-emerald-400' 
                    : 'text-amber-400'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${
                    timerRunning 
                      ? remainingSeconds <= 300 
                        ? 'bg-rose-400 animate-pulse' 
                        : 'bg-emerald-400' 
                      : 'bg-amber-400'
                  }`} />
                  <span className="font-black">{formatTimer(remainingSeconds)}</span>
                </div>

                {role === 'interviewer' ? (
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                      onClick={() => setShowTimerMenu(!showTimerMenu)}
                    >
                      <TimerIcon className="h-4 w-4" />
                    </Button>
                    {showTimerMenu && (
                      <div className="absolute top-[120%] right-0 w-56 bg-[#121214] border border-white/10 text-white rounded-2xl p-4 space-y-3 z-[9999] shadow-2xl">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/50">Timer Controls</div>
                        <div className={`text-2xl font-black font-mono text-center tabular-nums ${
                          timerRunning ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {formatTimer(remainingSeconds)}
                        </div>
                        <div className="flex gap-2">
                        {timerRunning ? (
                          <Button
                            onClick={handlePauseTimer}
                            className="flex-1 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-widest"
                          >
                            <Pause className="h-3.5 w-3.5 mr-1.5" />
                            Pause
                          </Button>
                        ) : (
                          <Button
                            onClick={handleStartTimer}
                            className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest"
                          >
                            <Play className="h-3.5 w-3.5 mr-1.5" />
                            {interview?.status === 'paused' ? 'Resume' : 'Start'}
                          </Button>
                        )}
                        <Button
                          onClick={() => { handleResetTimer(); setShowTimerMenu(false); }}
                          variant="outline"
                          className="h-10 w-10 rounded-xl border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="text-[9px] text-white/30 text-center font-bold uppercase tracking-widest">
                        {timerRunning ? '● Running' : interview?.status === 'paused' ? '⏸ Paused' : '○ Not Started'}
                      </div>
                    </div>
                  )}
                </div>
                ) : (
                  <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
                    {timerRunning ? '● Live' : '⏸ Paused'}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"><Share2 className="h-4 w-4" /></Button>
                  <div className="size-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-500/25">B</div>
                  
                  {role === 'interviewer' && (
                    <Button 
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to end this interview?')) return;
                        try {
                          await api.endInterview(interview._id);
                          toast.success('Interview ended');
                          setInterview(prev => ({ ...prev, status: 'finished' }));
                        } catch(err) {
                          toast.error('Failed to end interview');
                        }
                      }}
                      className="h-9 px-4 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/20 rounded-2xl text-sm font-bold flex items-center gap-2 backdrop-blur-md"
                    >
                      <LogOut className="h-4 w-4" />
                      End
                    </Button>
                  )}

                  <Button 
                    onClick={() => {
                       const url = `${window.location.origin}/interview/join/${inviteToken || interview?.inviteToken}`;
                       navigator.clipboard.writeText(url);
                       toast.success('Invite link copied!');
                    }}
                    className="h-9 px-4 bg-white/10 text-white hover:bg-white/15 border border-white/10 rounded-2xl text-sm font-bold flex items-center gap-2 backdrop-blur-md"
                  >
                    <Users className="h-4 w-4" />
                    Invite
                  </Button>
                </div>
             </div>
          </header>

          {/* Workspace Layout */}
          <main className="flex-1 overflow-hidden grid grid-cols-12 gap-4 p-4">
            {/* Problem Description (Glassy Light) */}
            <div className="col-span-12 lg:col-span-3 min-h-0 flex flex-col gap-4">
              {localViewProblemId && localViewProblemId !== activeProblem?._id && role === 'interviewer' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex flex-col gap-2 shadow-lg">
                  <div className="flex items-center gap-2 text-amber-400">
                    <EyeOff className="h-4 w-4" />
                    <span className="text-sm font-bold">Private View Mode</span>
                  </div>
                  <div className="text-xs text-amber-400/80">The candidate cannot see this. They are viewing the live problem.</div>
                  <div className="flex flex-col gap-2 mt-1">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        handleSwitchProblem(localViewProblemId);
                        setLocalViewProblemId(null);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-8"
                    >
                      Switch Candidate Here
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setLocalViewProblemId(null)}
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 h-8"
                    >
                      Back to Live
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex-1 min-h-0 jx-glass-strong bg-white/10 border-white/10 overflow-hidden rounded-3xl flex flex-col">
                <div className="shrink-0 px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Problem</div>
                    {activeProblem?.difficulty && (
                      <Badge className="bg-purple-500/15 border border-purple-500/20 text-purple-200 text-[10px]">
                        {activeProblem.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ProblemPanel
                    problem={displayProblem}
                    onEdit={() => {}}
                    role={role}
                    interviewId={interview?._id}
                    candidateToken={candidateToken}
                  />
                </div>
              </div>
            </div>

            {/* Code Editor or Whiteboard (Deep Focus Dark) */}
            <div className="col-span-12 lg:col-span-6 min-h-0 rounded-3xl overflow-hidden border border-white/10 bg-[#0f0f14] shadow-[0_30px_120px_rgba(0,0,0,0.6)] relative">
              <div className="h-full min-h-0">
                {displayProblem?.isCustom ? (
                  <DrawingBoard
                    problemId={displayProblem._id}
                    drawingData={displayProblem.drawingData}
                    role={role}
                    on={on}
                    emit={emit}
                    interviewId={interview?._id}
                  />
                ) : (
                  <CodeEditor
                    code={code}
                    language={language}
                    onCodeChange={setCode}
                    onLanguageChange={setLanguage}
                    onRun={() => {
                      setShowOutput(true);
                      handleRunCode();
                    }}
                    isRunning={isRunning}
                    allowedLanguages={interview?.allowedLanguages}
                    output={output}
                    showOutput={showOutput}
                    onCloseOutput={() => setShowOutput(false)}
                    theme="vs-dark"
                    onCursorChange={handleCursorChange}
                    remoteCursors={remoteCursors}
                  />
                )}
              </div>
            </div>

            {/* Video & Chat (Glassy Light) */}
            <div className="col-span-12 lg:col-span-3 min-h-0 flex flex-col gap-4">
              <div className="jx-glass-strong bg-white/10 border-white/10 rounded-3xl p-4">
                <VideoPanel
                  {...webrtc}
                  isSocketConnected={isSocketConnected}
                  peerInfo={peerInfo || { name: role === 'interviewer' ? 'Candidate' : 'Interviewer' }}
                  onLeave={() => {
                    emit('leave-interview', { interviewId: interview?._id });
                    navigate('/interview');
                  }}
                  compact
                />
              </div>
              <div className="jx-glass-strong bg-white/10 border-white/10 rounded-3xl overflow-hidden flex-1 min-h-0">
                <ChatPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  role={role}
                  theme="light"
                />
              </div>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============ Subcomponents ============

const SwitchQuestionDialog = ({ questions, activeProblemId, onSwitch }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(activeProblemId || '');

  useEffect(() => {
    setSelected(activeProblemId || '');
  }, [activeProblemId, open]);

  const opts = (questions || [])
    .map(q => ({
      id: q?.problemId?._id || q?.problemId,
      name: q?.problemId?.name || q?.problemName || 'Untitled',
      difficulty: q?.problemId?.difficulty || q?.problemDifficulty,
      visible: q?.isVisible,
    }))
    .filter(x => x.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 rounded-2xl bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10">
          <FileText className="h-4 w-4 mr-2" />
          Switch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] jx-glass-strong border-white/10 text-white rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-black tracking-tight">Switch Question</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="text-[11px] font-black uppercase tracking-widest text-white/60">Question</div>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="h-12 rounded-2xl bg-white/10 border-white/10 text-white">
              <SelectValue placeholder="Select a question" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f11] border-white/10 text-white rounded-2xl">
              {opts.map(o => (
                <SelectItem key={o.id} value={o.id} className="text-sm">
                  <div className="flex items-center justify-between w-full gap-3">
                    <span className="truncate max-w-[360px] font-bold">{o.name}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                      {o.difficulty || 'n/a'}{o.visible ? ' • visible' : ''}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              className="h-11 rounded-2xl bg-white/10 border border-white/10 text-white hover:bg-white/15"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 font-black"
              disabled={!selected}
              onClick={() => {
                onSwitch?.(selected);
                setOpen(false);
              }}
            >
              Switch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AddProblemDialog = ({ onAdd, onAddWhiteboard, api }) => {
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
      <div className="flex items-center gap-2">
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/5 transition-all">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onAddWhiteboard}
                className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/5 transition-all"
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-neutral-900 border-white/10 text-white text-[10px] font-bold uppercase tracking-widest">Add Whiteboard</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <DialogContent className="sm:max-w-[560px] jx-glass-strong border-white/10 text-white rounded-3xl p-0 overflow-hidden">
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
