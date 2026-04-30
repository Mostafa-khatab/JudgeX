import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { Loader2, Copy, Check, Share2 } from 'lucide-react';
import httpRequest from '~/utils/httpRequest';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
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
  addMessage: async (id, content, role) => {
    const res = await httpRequest.post(`/interview/${id}/messages`, { content, role });
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

  // 1. Socket Hook
  const { emit, on, isConnected } = useSocket(interview?._id, role, {
    name: role === 'interviewer' 
      ? interview?.instructor?.username || 'Interviewer' 
      : interview?.candidate?.name || 'Candidate',
    avatar: interview?.instructor?.avatar || null
  });

  // 2. State Hook
  const { code, setCode, language, setLanguage, activeProblem } = useInterviewState(
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
        if (inviteToken && !candidateToken) {
          // Stay in lobby for candidate info
          setLoading(false);
          return;
        } else if (inviteToken && candidateToken) {
          res = await api.joinInterview(inviteToken, '', '');
        } else if (id) {
          res = await api.getInterview(id);
        }

        if (res?.success) {
          setInterview(res.data);
          setRole(res.role);
          setMessages(res.data.messages || []);
          if (res.candidateToken) {
            setCandidateToken(res.candidateToken);
            localStorage.setItem('candidateToken', res.candidateToken);
          }
        }
      } catch (err) {
        toast.error(t(err.message.includes('interview:') ? err.message : 'errors.failedFetchInterview'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, inviteToken, candidateToken]);

  const handleJoinFromLobby = async (data) => {
    setLoading(true);
    try {
      if (inviteToken && !candidateToken) {
        // Candidate joining for the first time
        const res = await api.joinInterview(inviteToken, data.name, data.email);
        if (res.success) {
          setInterview(res.data);
          setRole('candidate');
          setCandidateToken(res.candidateToken);
          localStorage.setItem('candidateToken', res.candidateToken);
        }
      }

      // Both roles: Start media and enter room
      await webrtc.startMedia({ video: data.isVideoOn, audio: data.isMicOn }, data.existingStream);
      setShowLobby(false);
      
    } catch (err) {
      console.error('[Room] Join failed:', err);
      toast.error(t('errors.failedJoinPrefix') + (err.response?.data?.message || err.message));
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
      const res = await api.addMessage(interview._id, content, role);
      if (res.success) {
        setMessages(prev => [...prev, res.message]);
        emit('interview-chat-message', { interviewId: interview._id, role, content });
      }
    } catch (err) {
      toast.error(t('errors.failedSendMessage'));
    }
  };

  // Listen for real-time messages
  useEffect(() => {
    const cleanup = on('chat-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return cleanup;
  }, [on]);

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
            isConnected={isConnected}
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
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-bold uppercase text-neutral-400">
                  {isConnected ? t('status.connected') : t('status.offline')}
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
                  isConnected={isConnected}
                  peerInfo={{ name: role === 'interviewer' ? t('roles.candidate') : t('roles.interviewer') }}
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
