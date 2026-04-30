import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { Loader2, Copy, Check, Share2 } from 'lucide-react';
import httpRequest from '~/utils/httpRequest';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '~/components/ui/select';
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

  // 1. Socket Hook
  const { emit, on, isConnected: isSocketConnected } = useSocket(interview?._id, role, {
    name: role === 'interviewer' 
      ? interview?.instructor?.username || 'Interviewer' 
      : interview?.candidate?.name || 'Candidate',
    avatar: interview?.instructor?.avatar || null,
    // Allow candidate to authenticate sockets directly from invite link.
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
          // Allow loading session details from invite link (supports refresh/rejoin)
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
        // Ensure candidate identity is recorded on server (required by backend schema)
        const res = await api.joinInterview(inviteToken, data.name, data.email);
        if (res.success) {
          const payload = res.data || {};
          setInterview(payload);
          setRole(payload.role || 'candidate');
          setCandidateToken(payload.candidateToken || inviteToken);
          localStorage.setItem('candidateToken', payload.candidateToken || inviteToken);
          localStorage.setItem('candidateName', data.name || '');
          localStorage.setItem('candidateEmail', data.email || '');

          // Re-announce with the real candidate name after joining.
          emit('join-interview', { interviewId: payload._id, role: 'candidate', name: data.name });
        }
      }

      // Both roles: Start media and enter room
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

  // Listen for real-time events
  useEffect(() => {
    if (!on) return;

    const u1 = on('chat-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    const u2 = on('participant-joined', (data) => {
      setPeerInfo(data);
      toast.info(`${data.name} ${t('messages.joinedInterview') || 'joined the interview'}`);
    });

    const u3 = on('current-participants', ({ participants }) => {
      if (participants && participants.length > 0) {
        setPeerInfo(participants[0]);
      }
    });

    const u4 = on('participant-left', () => {
      setPeerInfo(null);
      toast.warn(t('messages.participantLeft') || 'Participant left the room');
    });

    return () => { u1(); u2(); u3(); u4(); };
  }, [on, t]);

  if (loading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center space-y-6">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">{t('loading.preparingSession')}</h2>
          <p className="text-neutral-500 text-sm">{t('loading.connectingServer')}</p>
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
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="dark h-screen bg-[#050505] text-white flex flex-col overflow-hidden"
        >
          {/* Header */}
          <header className="h-14 border-b border-neutral-800 bg-black/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-black tracking-tighter text-blue-500">JudgeX</h1>
              <div className="h-4 w-px bg-neutral-800" />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">{interview?.title}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {role === 'interviewer' && interview?.questions?.length > 0 && (
                <Select 
                  value={activeProblem?._id || interview?.questions?.find(q => q.isVisible)?.problemId?._id} 
                  onValueChange={async (problemId) => {
                    try {
                      // 1. Update backend visibility
                      await api.updateState(id, { activeProblemId: problemId }, candidateToken);
                      // 2. Emit socket event
                      emit('interview-problem-switch', { interviewId: id, problemId, language });
                      // 3. Local update
                      const question = interview.questions.find(q => q.problemId._id === problemId);
                      if (question) setActiveProblem(question.problemId);
                      toast.success('Problem switched successfully');
                    } catch (err) {
                      toast.error('Failed to switch problem');
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px] h-9 bg-neutral-900 border-neutral-800 text-xs font-bold text-blue-400">
                    <SelectValue placeholder="Select Question" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    {interview?.questions?.map((q, i) => (
                      <SelectItem key={q.problemId._id} value={q.problemId._id} className="text-xs">
                        {i + 1}. {q.problemId.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/interview/join/${inviteToken || interview?.inviteToken}`;
                  navigator.clipboard.writeText(url);
                  toast.success(t('messages.linkCopied') || 'Invite link copied!');
                }}
                className="bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Copy Invite Link</span>
              </Button>

              <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900 rounded-full border border-neutral-800">
                <div className={`h-2 w-2 rounded-full ${isSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-bold uppercase text-neutral-400">
                  {isSocketConnected ? t('status.connected') : t('status.offline')}
                </span>
              </div>
            </div>
          </header>

          {/* Main Layout */}
          <main className="flex-1 flex overflow-hidden p-4 gap-4">
            {/* Left: Problem (25%) */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-1/4 h-full min-w-[300px]"
            >
              <ProblemPanel problem={activeProblem || interview?.questions?.find(q => q.isVisible)?.problemId} />
            </motion.div>

            {/* Center: Editor (50%) */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex-1 h-full min-w-[400px]"
            >
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
            </motion.div>

            {/* Right: Video & Chat (25%) */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-1/4 h-full min-w-[300px] flex flex-col gap-4"
            >
              <div className="h-1/2">
                <VideoPanel 
                  {...webrtc}
                  isSocketConnected={isSocketConnected}
                  peerInfo={peerInfo || { 
                    name: role === 'interviewer' 
                      ? t('roles.candidate') || 'Candidate' 
                      : t('roles.interviewer') || 'Interviewer' 
                  }}
                />
              </div>
              <div className="flex-1">
                <ChatPanel 
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  role={role}
                />
              </div>
            </motion.div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InterviewRoom;
