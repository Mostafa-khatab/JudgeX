import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import { Share2, Sparkles, LayoutGrid, Code2, MessageSquare, Video as VideoIcon } from 'lucide-react';
import httpRequest from '~/utils/httpRequest';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '~/components/ui/button';
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
  // Router instance isn't needed in this room view.
  
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
          className="h-screen text-neutral-900 dark:text-neutral-50 flex flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950"
        >
          {/* Header */}
          <header className="h-14 px-4 sm:px-6 shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div className="h-full flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold tracking-tight">JudgeX Interview</span>
                    </div>
                    <div className="truncate text-xs text-neutral-500">
                      {interview?.title}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
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
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Select Question" />
                  </SelectTrigger>
                  <SelectContent>
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
                className="h-9 gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Copy Invite Link</span>
              </Button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800">
                <div className={`h-2 w-2 rounded-full ${isSocketConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {isSocketConnected ? t('status.connected') : t('status.offline')}
                </span>
              </div>
            </div>
            </div>
          </header>

          {/* Main Layout */}
          <main className="flex-1 overflow-hidden p-4 sm:p-4">
            <div className="h-full grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 gap-4">
              {/* Problem */}
              <motion.section
                initial={{ x: -18, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="col-span-1 lg:col-span-3 min-h-0 h-full flex flex-col gap-4"
              >
                <div className="jx-glass flex-1 overflow-hidden flex flex-col">
                  <div className="jx-glass-header flex items-center px-4 py-2.5">
                    <div>
                      <div className="jx-tile-title">Problem Statement</div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ProblemPanel problem={activeProblem || interview?.questions?.find(q => q.isVisible)?.problemId} />
                  </div>
                </div>

                {/* Video */}
                <div className="jx-glass h-[240px] overflow-hidden flex flex-col">
                  <div className="jx-glass-header flex items-center px-4 py-2.5">
                    <div>
                      <div className="jx-tile-title">Participants</div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 p-3">
                    <VideoPanel
                      {...webrtc}
                      isSocketConnected={isSocketConnected}
                      peerInfo={peerInfo || {
                        name:
                          role === 'interviewer'
                            ? t('roles.candidate') || 'Candidate'
                            : t('roles.interviewer') || 'Interviewer'
                      }}
                    />
                  </div>
                </div>
              </motion.section>

              {/* Editor */}
              <motion.section
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="col-span-1 lg:col-span-6 min-h-0 h-full"
              >
                <div className="jx-glass-strong h-full overflow-hidden flex flex-col">
                  <div className="jx-glass-header flex items-center px-4 py-2.5">
                    <div>
                      <div className="jx-tile-title">Code Editor</div>
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

              {/* Chat */}
              <motion.section
                initial={{ x: 18, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="col-span-1 lg:col-span-3 min-h-0 h-full"
              >
                <div className="jx-glass h-full overflow-hidden flex flex-col">
                  <div className="jx-glass-header flex items-center px-4 py-2.5">
                    <div>
                      <div className="jx-tile-title">Chat & Notes</div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ChatPanel
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      role={role}
                    />
                  </div>
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
