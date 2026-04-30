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
import ClayIcon from './components/ClayIcon';

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
          className="dark h-screen text-white flex flex-col overflow-hidden bg-[radial-gradient(1200px_700px_at_15%_-10%,rgba(59,130,246,0.28),transparent_55%),radial-gradient(900px_600px_at_92%_12%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(900px_700px_at_60%_120%,rgba(16,185,129,0.16),transparent_50%),linear-gradient(to_br,rgba(10,10,10,1),rgba(4,4,6,1))]"
        >
          {/* Header */}
          <header className="h-16 px-5 sm:px-7 shrink-0">
            <div className="jx-glass-header h-full rounded-b-3xl border border-white/10 border-t-0 flex items-center justify-between px-5 sm:px-7">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <ClayIcon size={38} tint="violet" className="rounded-2xl">
                    <Sparkles className="h-5 w-5" />
                  </ClayIcon>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg font-black tracking-tight">JudgeX</span>
                      <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">Interview</span>
                    </div>
                    <div className="truncate text-[11px] font-black uppercase tracking-[0.20em] text-neutral-500">
                      {interview?.title}
                    </div>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-black/20 backdrop-blur-xl">
                  <LayoutGrid className="h-3.5 w-3.5 text-neutral-300" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">Bento Mode</span>
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
                  <SelectTrigger className="w-[180px] h-10 bg-black/30 border-white/10 text-[11px] font-black tracking-[0.12em] text-blue-200/90 backdrop-blur-xl">
                    <SelectValue placeholder="Select Question" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-950/90 border-white/10 text-white backdrop-blur-xl">
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
                className="h-10 rounded-2xl bg-white/[0.06] border-white/12 text-blue-200/90 hover:bg-white/[0.10] gap-2 shadow-lg shadow-black/30"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Copy Invite Link</span>
              </Button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-black/20 backdrop-blur-xl">
                <div className={`h-2 w-2 rounded-full ${isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400">
                  {isSocketConnected ? t('status.connected') : t('status.offline')}
                </span>
              </div>
            </div>
            </div>
          </header>

          {/* Main Layout */}
          <main className="flex-1 overflow-hidden p-4 sm:p-6">
            <div className="h-full grid grid-cols-12 grid-rows-12 gap-4">
              {/* Problem */}
              <motion.section
                initial={{ x: -18, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="col-span-12 lg:col-span-3 row-span-5 lg:row-span-12 min-h-0"
              >
                <div className="jx-glass h-full overflow-hidden">
                  <div className="jx-glass-header flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <ClayIcon size={34} tint="blue" className="rounded-2xl">
                        <Code2 className="h-4.5 w-4.5" />
                      </ClayIcon>
                      <div>
                        <div className="jx-tile-title">Problem</div>
                        <div className="jx-tile-subtitle">Specs and constraints</div>
                      </div>
                    </div>
                  </div>
                  <div className="h-[calc(100%-52px)] min-h-0">
                    <ProblemPanel problem={activeProblem || interview?.questions?.find(q => q.isVisible)?.problemId} />
                  </div>
                </div>
              </motion.section>

              {/* Editor */}
              <motion.section
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="col-span-12 lg:col-span-6 row-span-7 lg:row-span-12 min-h-0"
              >
                <div className="jx-glass-strong h-full overflow-hidden">
                  <div className="jx-glass-header flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <ClayIcon size={34} tint="violet" className="rounded-2xl">
                        <LayoutGrid className="h-4.5 w-4.5" />
                      </ClayIcon>
                      <div>
                        <div className="jx-tile-title">Workspace</div>
                        <div className="jx-tile-subtitle">Editor and output</div>
                      </div>
                    </div>
                  </div>
                  <div className="h-[calc(100%-52px)] min-h-0">
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

              {/* Video */}
              <motion.section
                initial={{ x: 18, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="col-span-12 lg:col-span-3 row-span-5 lg:row-span-6 min-h-0"
              >
                <div className="jx-glass h-full overflow-hidden">
                  <div className="jx-glass-header flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <ClayIcon size={34} tint="emerald" className="rounded-2xl">
                        <VideoIcon className="h-4.5 w-4.5" />
                      </ClayIcon>
                      <div>
                        <div className="jx-tile-title">Call</div>
                        <div className="jx-tile-subtitle">Video and screenshare</div>
                      </div>
                    </div>
                  </div>
                  <div className="h-[calc(100%-52px)] min-h-0 p-4">
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

              {/* Chat */}
              <motion.section
                initial={{ x: 18, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="col-span-12 lg:col-span-3 row-span-7 lg:row-span-6 min-h-0"
              >
                <div className="jx-glass h-full overflow-hidden">
                  <div className="jx-glass-header flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <ClayIcon size={34} tint="amber" className="rounded-2xl">
                        <MessageSquare className="h-4.5 w-4.5" />
                      </ClayIcon>
                      <div>
                        <div className="jx-tile-title">Chat</div>
                        <div className="jx-tile-subtitle">Notes and discussion</div>
                      </div>
                    </div>
                  </div>
                  <div className="h-[calc(100%-52px)] min-h-0">
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
