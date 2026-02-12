import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { Editor } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import io from 'socket.io-client';
import { 
  Play, Send, Clock, ChevronLeft, Users, 
  MessageSquare, Code2, FileText, Loader2,
  Video, VideoOff, Mic, MicOff, Monitor,
  PhoneOff, AlertTriangle, Camera, Pause,
  ChevronDown, Eye, EyeOff, Star, Save, Search, Plus, Copy, Link
} from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { Card } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '~/components/ui/dialog';
import useWebRTC from './hooks/useWebRTC';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ============ API ============
const api = {
  getInterview: async (id, candidateToken) => {
    const headers = candidateToken ? { 'x-candidate-token': candidateToken } : {};
    const res = await fetch(`${API_URL}/interview/${id}`, { 
      credentials: 'include',
      headers 
    });
    return res.json();
  },
  joinInterview: async (token, name, email) => {
    const res = await fetch(`${API_URL}/interview/join/${token}?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
    return res.json();
  },
  startInterview: async (id) => {
    const res = await fetch(`${API_URL}/interview/${id}/start`, { method: 'POST', credentials: 'include' });
    return res.json();
  },
  pauseInterview: async (id, remainingTime) => {
    const res = await fetch(`${API_URL}/interview/${id}/pause`, { 
      method: 'POST', 
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remainingTime })
    });
    return res.json();
  },
  endInterview: async (id) => {
    const res = await fetch(`${API_URL}/interview/${id}/end`, { method: 'POST', credentials: 'include' });
    return res.json();
  },
  updateState: async (id, state, candidateToken) => {
    const headers = { 
      'Content-Type': 'application/json',
      ...(candidateToken ? { 'x-candidate-token': candidateToken } : {})
    };
    const res = await fetch(`${API_URL}/interview/${id}/state`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(state)
    });
    return res.json();
  },
  addMessage: async (id, content, role) => {
    const res = await fetch(`${API_URL}/interview/${id}/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, role })
    });
    return res.json();
  },
  saveFeedback: async (id, feedback) => {
    const res = await fetch(`${API_URL}/interview/${id}/feedback`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback)
    });
    return res.json();
  },
  takeSnapshot: async (id, note) => {
    const res = await fetch(`${API_URL}/interview/${id}/snapshot`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    });
    return res.json();
  },
  trackTabSwitch: async (id) => {
    const res = await fetch(`${API_URL}/interview/${id}/tab-switch`, { method: 'POST' });
    return res.json();
  },
  searchProblems: async (query) => {
    const res = await fetch(`${API_URL}/problem/search-for-interview?q=${encodeURIComponent(query)}&limit=5`, { credentials: 'include' });
    return res.json();
  },
  getProblemForInterview: async (id, role) => {
    const res = await fetch(`${API_URL}/problem/${id}/for-interview?role=${role}`, { credentials: 'include' });
    return res.json();
  }
};

// ============ Component ============
const InterviewRoom = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const interviewId = id || null;
  const inviteToken = token || null;
  
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('candidate');
  const [candidateToken, setCandidateToken] = useState(localStorage.getItem('candidateToken'));
  
  // Join form (for candidates)
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  
  // Editor state
  const [code, setCode] = useState('// Start coding here...\n');
  const [language, setLanguage] = useState('cpp');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  // UI state
  const [activePanel, setActivePanel] = useState('problem');
  const [remainingTime, setRemainingTime] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  
  // Feedback state (interviewer only)
  const [feedback, setFeedback] = useState({
    problemSolving: { score: null, notes: '' },
    communication: { score: null, notes: '' },
    codingStyle: { score: null, notes: '' },
    overallNotes: ''
  });
  
  // Video state
  const [showVideo, setShowVideo] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  // Problem Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Current Problem
  const [currentProblem, setCurrentProblem] = useState(null);
  
  // Video refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Socket
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const codeUpdateTimeout = useRef(null);
  
  // WebRTC state
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const peerConnectionRef = useRef(null);
  
  // Remote media state
  const [remoteMediaState, setRemoteMediaState] = useState({ audio: true, video: true });
  
  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Start video call
  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsVideoReady(true);
      
      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('interview-webrtc-ice', {
            interviewId: interview._id,
            candidate: event.candidate
          });
        }
      };
      
      pc.onconnectionstatechange = () => {
        setIsConnected(pc.connectionState === 'connected');
      };
      
      peerConnectionRef.current = pc;
      
      // If interviewer, create offer
      if (role === 'interviewer') {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('interview-webrtc-offer', {
          interviewId: interview._id,
          offer
        });
      }
      
      toast.success('Camera started!');
    } catch (err) {
      console.error('Failed to start video:', err);
      toast.error('Failed to access camera/microphone');
    }
  };

  const handleWebRTCOffer = async (offer) => {
    if (!peerConnectionRef.current) {
      await startVideoCall();
    }
    const pc = peerConnectionRef.current;
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current?.emit('interview-webrtc-answer', {
      interviewId: interview._id,
      answer
    });
  };

  const handleWebRTCAnswer = async (answer) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleWebRTCIce = async (candidate) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const enabled = !isAudioEnabled;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      setIsAudioEnabled(enabled);
      
      // Broadcast to peer
      socketRef.current?.emit('interview-media-state', {
        interviewId: interview._id,
        mediaState: { audio: enabled, video: isVideoEnabled }
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const enabled = !isVideoEnabled;
      localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      setIsVideoEnabled(enabled);
      
      // Broadcast to peer
      socketRef.current?.emit('interview-media-state', {
        interviewId: interview._id,
        mediaState: { audio: isAudioEnabled, video: enabled }
      });
    }
  };

  const endVideoCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setIsConnected(false);
    setIsVideoReady(false);
  };

  // ============ Effects ============
  useEffect(() => {
    if (inviteToken && !candidateToken) {
      setShowJoinForm(true);
      setLoading(false);
    } else if (inviteToken && candidateToken) {
      // Auto-join with existing token
      setLoading(true);
      api.joinInterview(inviteToken, '', '').then(res => {
        if (res.success) {
          setInterview(res.data);
          setRole('candidate');
          if (res.candidateToken) {
            setCandidateToken(res.candidateToken);
            localStorage.setItem('candidateToken', res.candidateToken);
          }
          setLoading(false);
        } else {
          // Token invalid
          localStorage.removeItem('candidateToken');
          setCandidateToken(null);
          setShowJoinForm(true);
          setLoading(false);
        }
      }).catch(() => {
        localStorage.removeItem('candidateToken');
        setCandidateToken(null);
        setShowJoinForm(true);
        setLoading(false);
      });
    } else if (interviewId) {
      loadInterview();
    }
  }, [interviewId, inviteToken, candidateToken]);

  useEffect(() => {
    if (interview && !showJoinForm) {
      setupSocket();
      setupTabTracking();
    }
    return () => {
      socketRef.current?.disconnect();
    };
  }, [interview?._id, showJoinForm]);

  useEffect(() => {
    if (interview?.status !== 'active' || remainingTime <= 0) return;
    const timer = setInterval(() => {
      setRemainingTime(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [interview?.status, remainingTime]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ============ Functions ============
  const loadInterview = async () => {
    try {
      const res = await api.getInterview(interviewId, candidateToken);
      if (res.success) {
        setInterview(res.data);
        setRole(res.role);
        setCode(res.data.state?.code || '// Start coding here...\n');
        setLanguage(res.data.state?.language || 'cpp');
        setMessages(res.data.messages || []);
        setRemainingTime(res.data.state?.remainingTime || res.data.duration * 60);
        setTabSwitchCount(res.data.tabSwitchCount || 0);
        if (res.data.feedback) setFeedback(res.data.feedback);
        
        // Load active problem if exists
        if (res.data.state?.activeProblemId) {
          try {
            const probRes = await api.getProblemForInterview(res.data.state.activeProblemId, res.role);
            if (probRes.success) setCurrentProblem(probRes.data);
          } catch (e) {
            console.error('Failed to load active problem', e);
          }
        }
      } else {
        toast.error(res.message || 'Failed to load interview');
        navigate('/interview');
      }
    } catch (err) {
      toast.error('Failed to load interview');
      navigate('/interview');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinName.trim() || !joinEmail.trim()) {
      toast.warning('Please enter your name and email');
      return;
    }
    
    try {
      const res = await api.joinInterview(inviteToken, joinName, joinEmail);
      if (res.success) {
        localStorage.setItem('candidateToken', res.candidateToken);
        setCandidateToken(res.candidateToken);
        setInterview(res.data);
        setRole('candidate');
        setCode(res.data.state?.code || '');
        setLanguage(res.data.state?.language || 'cpp');
        setMessages(res.data.messages || []);
        setRemainingTime(res.data.state?.remainingTime || res.data.duration * 60);
        setShowJoinForm(false);
      } else {
        toast.error(res.message || 'Failed to join');
      }
    } catch (err) {
      toast.error('Failed to join interview');
    }
  };

  const setupSocket = () => {
    socketRef.current = io(API_URL, { withCredentials: true });
    
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-interview', {
        interviewId: interview._id,
        role,
        name: role === 'interviewer' ? 'Interviewer' : interview?.candidate?.name || 'Candidate'
      });
    });

    socketRef.current.on('code-updated', (data) => {
      if (data.from !== socketRef.current.id) {
        setCode(data.code);
        if (data.language) setLanguage(data.language);
      }
    });

    socketRef.current.on('language-changed', (data) => {
      setLanguage(data.language);
    });

    socketRef.current.on('chat-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on('status-updated', (data) => {
      setInterview(prev => ({ ...prev, status: data.status }));
      if (data.remainingTime !== undefined) setRemainingTime(data.remainingTime);
    });

    socketRef.current.on('interview-finished', () => {
      toast.info('Interview has ended');
      navigate(`/interview/results/${interview._id}`);
    });

    socketRef.current.on('problem-updated', (data) => {
      // Refresh interview data when problem changes
      loadInterview();
    });

    socketRef.current.on('tab-switch-detected', () => {
      setTabSwitchCount(prev => prev + 1);
      toast.warning('Candidate switched tabs!', { toastId: 'tab-switch' });
    });

    socketRef.current.on('participant-joined', ({ role: joinedRole, name }) => {
      toast.info(`${name || joinedRole} joined the interview`);
    });
    
    // Problem switch with starter code
    socketRef.current.on('problem-switched', ({ problem, starterCode }) => {
      loadInterview(); // Refresh interview data
      setCurrentProblem(problem);
      setCode(starterCode); // Update code editor
      toast.info(`Problem switched to: ${problem.name}`);
    });
    
    // WebRTC signaling
    socketRef.current.on('webrtc-offer', async ({ offer }) => {
      await handleWebRTCOffer(offer);
    });
    
    socketRef.current.on('webrtc-answer', async ({ answer }) => {
      await handleWebRTCAnswer(answer);
    });
    
    socketRef.current.on('webrtc-ice', async ({ candidate }) => {
      await handleWebRTCIce(candidate);
    });
    
    // Media state from remote peer
    socketRef.current.on('media-state-updated', ({ mediaState }) => {
      setRemoteMediaState(mediaState);
      if (!mediaState.audio) {
        toast.info('Peer muted their microphone', { toastId: 'remote-mute' });
      }
      if (!mediaState.video) {
        toast.info('Peer turned off camera', { toastId: 'remote-video-off' });
      }
    });
    
    // Reconnection request
    socketRef.current.on('webrtc-reconnect-request', async () => {
      toast.info('Peer requesting reconnection...');
      if (peerConnectionRef.current) {
        peerConnectionRef.current.restartIce();
      }
    });
    
    // Participant rejoined
    socketRef.current.on('participant-rejoined', ({ role: rejoinedRole, name }) => {
      toast.success(`${name || rejoinedRole} reconnected!`);
    });
  };

  const setupTabTracking = () => {
    if (role !== 'candidate') return;
    
    const handleVisibilityChange = () => {
      if (document.hidden && interview?.status === 'active') {
        api.trackTabSwitch(interview._id);
        socketRef.current?.emit('interview-tab-switch', { interviewId: interview._id });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  const handleCodeChange = useCallback((value) => {
    setCode(value || '');
    
    // Debounce socket emit
    clearTimeout(codeUpdateTimeout.current);
    codeUpdateTimeout.current = setTimeout(() => {
      socketRef.current?.emit('interview-code-update', {
        interviewId: interview._id,
        code: value,
        language
      });
    }, 100);
  }, [interview?._id, language]);

  const handleLanguageChange = (newLang) => {
    if (!interview?.allowedLanguages?.includes(newLang)) {
      toast.warning('This language is not allowed');
      return;
    }
    setLanguage(newLang);
    socketRef.current?.emit('interview-language-change', { 
      interviewId: interview._id, 
      language: newLang 
    });
    api.updateState(interview._id, { language: newLang }, candidateToken);
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setShowOutput(true);
    setOutput('Running...');
    
    setTimeout(() => {
      setOutput('✓ Code executed successfully\n\nOutput:\nHello World!');
      setIsRunning(false);
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const msg = { role, content: chatInput, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    socketRef.current?.emit('interview-chat-message', { 
      interviewId: interview._id, 
      ...msg 
    });
    
    try {
      await api.addMessage(interview._id, chatInput, role);
    } catch (err) {
      console.error('Failed to save message');
    }
    
    setChatInput('');
  };

  const handleStartInterview = async () => {
    try {
      const res = await api.startInterview(interview._id);
      if (res.success) {
        setInterview(res.data);
        setRemainingTime(res.data.state?.remainingTime || res.data.duration * 60);
        socketRef.current?.emit('interview-status-update', {
          interviewId: interview._id,
          status: 'active',
          remainingTime: res.data.state?.remainingTime
        });
        toast.success('Interview started!');
      }
    } catch (err) {
      toast.error('Failed to start interview');
    }
  };

  const handlePauseInterview = async () => {
    try {
      const res = await api.pauseInterview(interview._id, remainingTime);
      if (res.success) {
        setInterview(res.data);
        socketRef.current?.emit('interview-status-update', {
          interviewId: interview._id,
          status: 'paused'
        });
      }
    } catch (err) {
      toast.error('Failed to pause');
    }
  };

  const handleEndInterview = async () => {
    if (!window.confirm('End this interview?')) return;
    
    try {
      // Save feedback first
      if (role === 'interviewer') {
        await api.saveFeedback(interview._id, feedback);
      }
      await api.endInterview(interview._id);
      socketRef.current?.emit('interview-ended', { interviewId: interview._id });
      navigate(`/interview/results/${interview._id}`);
    } catch (err) {
      toast.error('Failed to end interview');
    }
  };

  const handleTakeSnapshot = async () => {
    try {
      const res = await api.takeSnapshot(interview._id, '');
      if (res.success) {
        toast.success('Snapshot saved!');
      }
    } catch (err) {
      toast.error('Failed to take snapshot');
    }
  };

  const handleSearchProblems = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await api.searchProblems(query);
      if (res.success) {
        setSearchResults(res.data);
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProblem = (problem) => {
    if (window.confirm(`Switch active problem to "${problem.name}"? This will reset the editor code.`)) {
      socketRef.current?.emit('interview-problem-switch', {
        interviewId: interview._id,
        problemId: problem._id,
        language
      });
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMonacoLanguage = (lang) => {
    const map = { 'cpp': 'cpp', 'c++': 'cpp', 'python': 'python', 'javascript': 'javascript', 'java': 'java', 'go': 'go', 'rust': 'rust' };
    return map[lang] || 'cpp';
  };

  const copyInviteLink = () => {
    if (!interview?.inviteToken) return;
    const url = `${window.location.origin}/interview/join/${interview.inviteToken}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied to clipboard');
  };

  // ... (inside the return statement, adding the dialog to interviewer controls)

  // ============ Join Form ============
  if (showJoinForm) {
    return (
      <div className="dark min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-8">
        <Card className="bg-neutral-900 border-neutral-800 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Video className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Join Interview</h1>
            <p className="text-neutral-500 mt-2">Enter your details to join the session</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-neutral-300">Your Name *</Label>
              <Input
                placeholder="John Doe"
                className="bg-neutral-950 border-neutral-800 h-12"
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-300">Email *</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                className="bg-neutral-950 border-neutral-800 h-12"
                value={joinEmail}
                onChange={e => setJoinEmail(e.target.value)}
              />
            </div>
            <Button 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-lg"
              onClick={handleJoin}
            >
              Join Interview
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ============ Loading ============
  if (loading) {
    return (
      <div className="dark min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-neutral-500">Loading interview...</p>
        </div>
      </div>
    );
  }

  // ============ Main Render ============
  return (
    <div className="dark h-screen flex flex-col bg-neutral-950 text-white overflow-hidden">
      
      {/* Header */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/interview')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="h-4 w-px bg-neutral-700" />
          <div>
            <h1 className="text-sm font-bold">{interview?.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[10px] h-4 ${
                interview?.status === 'active' ? 'border-green-500 text-green-500' : 
                interview?.status === 'paused' ? 'border-yellow-500 text-yellow-500' :
                'border-neutral-600 text-neutral-400'
              }`}>
                {interview?.status}
              </Badge>
              <span className="text-[10px] text-neutral-500 capitalize">{role}</span>
              {role === 'interviewer' && tabSwitchCount > 0 && (
                <Badge variant="outline" className="text-[10px] h-4 border-red-500 text-red-500">
                  ⚠ {tabSwitchCount} tab switches
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className={`flex items-center gap-2 text-sm font-mono px-4 py-1.5 rounded-lg ${
            remainingTime < 300 ? 'bg-red-500/20 text-red-400' : 'bg-neutral-800'
          }`}>
            <Clock className="h-4 w-4" />
            <span className="font-bold">{formatTime(remainingTime)}</span>
          </div>
          
          {/* Interviewer Controls */}
          {role === 'interviewer' && (
            <>
              {interview?.status === 'pending' && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleStartInterview}>
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
              )}
              {interview?.status === 'active' && (
                <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-500" onClick={handlePauseInterview}>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              )}
              
              <Button size="sm" variant="outline" onClick={copyInviteLink} className="border-blue-500 text-blue-500 hover:bg-blue-500/10">
                 <Link className="h-4 w-4 mr-1.5" />
                 Copy Link
              </Button>

              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleTakeSnapshot}>
                <Camera className="h-4 w-4 mr-1" />
                Snapshot
              </Button>
              <Button size="sm" variant="destructive" onClick={handleEndInterview}>
                <PhoneOff className="h-4 w-4 mr-1" />
                End
              </Button>
              
              {/* Problem Selector Dialog */}
              <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-500/10">
                    <Search className="h-4 w-4 mr-1.5" />
                    Change Problem
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select Problem</DialogTitle>
                    <DialogDescription className="text-xs text-neutral-400">Search and select a problem to switch the active task.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input
                      placeholder="Search by title..."
                      value={searchQuery}
                      onChange={(e) => handleSearchProblems(e.target.value)}
                      className="bg-neutral-800 border-neutral-700"
                    />
                    
                    <div className="space-y-2 max-h-[300px] overflow-auto">
                      {isSearching ? (
                        <div className="text-center py-4 text-neutral-500">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map(p => (
                          <div 
                            key={p._id}
                            onClick={() => handleSelectProblem(p)}
                            className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 hover:bg-neutral-800 cursor-pointer transition-colors"
                          >
                            <div>
                              <div className="font-bold text-sm">{p.name}</div>
                              <div className="text-xs text-neutral-500 flex gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] h-4">{p.difficulty}</Badge>
                                <span>{p.timeLimit}ms</span>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : searchQuery.length > 1 ? (
                        <div className="text-center py-4 text-neutral-500">No problems found</div>
                      ) : (
                        <div className="text-center py-4 text-neutral-500 text-sm">Type 2+ chars to search</div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel */}
        <div className="w-80 border-r border-neutral-800 flex flex-col shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-neutral-800">
            {[
              { id: 'problem', icon: FileText, label: 'Problem' },
              { id: 'chat', icon: MessageSquare, label: 'Chat', count: messages.length },
              ...(role === 'interviewer' ? [{ id: 'feedback', icon: Star, label: 'Feedback' }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                  activePanel === tab.id 
                    ? 'bg-blue-600/10 text-blue-500 border-blue-500' 
                    : 'text-neutral-500 border-transparent hover:text-neutral-300'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] px-1.5 rounded-full">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
          
          {/* Panel Content */}
          <div className="flex-1 overflow-auto p-4">
            {activePanel === 'problem' && (
              <div className="space-y-4">
                {currentProblem ? (
                  <div className="prose prose-invert max-w-none prose-sm">
                    <h2 className="text-lg font-bold mb-4">{currentProblem.name}</h2>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <Badge variant="outline" className={`border-neutral-600 ${
                        currentProblem.difficulty === 'easy' ? 'text-green-500' :
                        currentProblem.difficulty === 'medium' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {currentProblem.difficulty}
                      </Badge>
                      <Badge variant="outline" className="border-neutral-600">
                        {currentProblem.timeLimit}ms
                      </Badge>
                      <Badge variant="outline" className="border-neutral-600">
                        {currentProblem.memoryLimit}MB
                      </Badge>
                    </div>
                    
                    <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {currentProblem.task}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Interviewer Extras */}
                    {role === 'interviewer' && currentProblem.testcase && (
                      <div className="mt-8 pt-4 border-t border-neutral-700">
                        <h3 className="font-bold mb-2 text-yellow-500 flex items-center gap-2">
                          <EyeOff className="h-4 w-4" />
                          Hidden Test Cases (You Only)
                        </h3>
                        <pre className="bg-neutral-950 p-3 rounded text-xs font-mono text-neutral-400 overflow-auto border border-neutral-800">
                          {JSON.stringify(currentProblem.testcase, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : interview?.questions?.length > 0 ? (
                  interview.questions.map((q, i) => (
                    <Card key={i} className="bg-neutral-800/50 border-neutral-700 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold">{q.problemName || q.customContent?.title || `Problem ${i + 1}`}</h3>
                        {role === 'interviewer' && (
                          <Badge variant="outline" className={q.isVisible ? 'border-green-500 text-green-500' : 'border-neutral-600'}>
                            {q.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px]">{q.problemDifficulty || 'Medium'}</Badge>
                      {q.customContent?.description && (
                        <p className="text-xs text-neutral-400 mt-3">{q.customContent.description}</p>
                      )}
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-10 text-neutral-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No problem selected</p>
                    {role === 'interviewer' && (
                      <Button variant="link" onClick={() => setIsSearchOpen(true)} className="mt-2 text-blue-500">
                        Select a problem
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {activePanel === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-3 overflow-auto mb-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === role ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                        msg.role === role ? 'bg-blue-600' : 'bg-neutral-800'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    className="bg-neutral-800 border-neutral-700 text-sm"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button size="icon" className="bg-blue-600 shrink-0" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {activePanel === 'feedback' && role === 'interviewer' && (
              <div className="space-y-4">
                <p className="text-xs text-neutral-500 mb-4">🔒 Private - Not visible to candidate</p>
                
                {['problemSolving', 'communication', 'codingStyle'].map(category => (
                  <div key={category} className="space-y-2">
                    <Label className="text-neutral-300 capitalize">{category.replace(/([A-Z])/g, ' $1')}</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(score => (
                        <button
                          key={score}
                          onClick={() => setFeedback(prev => ({
                            ...prev,
                            [category]: { ...prev[category], score }
                          }))}
                          className={`h-8 w-8 rounded-lg transition-all ${
                            feedback[category]?.score >= score 
                              ? 'bg-yellow-500 text-white' 
                              : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                          }`}
                        >
                          <Star className={`h-4 w-4 mx-auto ${feedback[category]?.score >= score ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Notes..."
                      className="bg-neutral-800 border-neutral-700 text-xs"
                      value={feedback[category]?.notes || ''}
                      onChange={e => setFeedback(prev => ({
                        ...prev,
                        [category]: { ...prev[category], notes: e.target.value }
                      }))}
                    />
                  </div>
                ))}
                
                <div className="space-y-2">
                  <Label className="text-neutral-300">Overall Notes</Label>
                  <Textarea
                    placeholder="General observations..."
                    className="bg-neutral-800 border-neutral-700 text-xs min-h-[80px]"
                    value={feedback.overallNotes}
                    onChange={e => setFeedback(prev => ({ ...prev, overallNotes: e.target.value }))}
                  />
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => api.saveFeedback(interview._id, feedback).then(() => toast.success('Feedback saved!'))}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Feedback
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="h-12 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <Code2 className="h-4 w-4 text-blue-500" />
              <select
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
                className="bg-neutral-800 border-neutral-700 rounded-lg px-3 py-1.5 text-xs"
              >
                {(interview?.allowedLanguages || ['cpp', 'python', 'javascript', 'java']).map(lang => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-neutral-700 text-xs"
                onClick={handleRunCode}
                disabled={isRunning}
              >
                {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                Run
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs">
                <Send className="h-3.5 w-3.5 mr-1" />
                Submit
              </Button>
            </div>
          </div>
          
          {/* Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={getMonacoLanguage(language)}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          
          {/* Output */}
          {showOutput && (
            <div className="h-40 border-t border-neutral-800 bg-neutral-900 overflow-auto shrink-0">
              <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
                <span className="text-xs font-bold text-neutral-400">Output</span>
                <button onClick={() => setShowOutput(false)} className="text-neutral-500 hover:text-white">✕</button>
              </div>
              <pre className="p-4 text-sm font-mono text-neutral-300">{output}</pre>
            </div>
          )}
        </div>
        
        {/* Video Panel */}
        {showVideo && (
          <div className="w-64 border-l border-neutral-800 flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
              <span className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                Video Chat
              </span>
              <button onClick={() => setShowVideo(false)} className="text-neutral-500 hover:text-white text-xs">
                ✕
              </button>
            </div>
            
            {/* Remote Video */}
            <div className="relative bg-neutral-900 aspect-video">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
                  <Users className="h-12 w-12" />
                </div>
              )}
              
              {/* Remote video off overlay */}
              {remoteStream && !remoteMediaState.video && (
                <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                  <VideoOff className="h-12 w-12 text-neutral-500" />
                </div>
              )}
              
              {/* Remote mute indicator */}
              {!remoteMediaState.audio && (
                <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1.5">
                  <MicOff className="h-3 w-3 text-white" />
                </div>
              )}
              
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px]">
                {role === 'interviewer' ? 'Candidate' : 'Interviewer'}
              </div>
            </div>
            
            {/* Local Video */}
            <div className="relative bg-neutral-950 aspect-video border-t border-neutral-800">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
              />
              {!localStream && (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-700">
                  <Video className="h-8 w-8" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-600/80 rounded text-[10px]">
                You
              </div>
            </div>
            
            {/* Video Controls */}
            <div className="p-3 border-t border-neutral-800 flex items-center justify-center gap-2">
              {!isVideoReady ? (
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-xs"
                  onClick={startVideoCall}
                >
                  <Video className="h-4 w-4 mr-1.5" />
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className={`h-9 w-9 ${!isAudioEnabled ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-neutral-700 hover:bg-neutral-800'}`}
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className={`h-9 w-9 ${!isVideoEnabled ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-neutral-700 hover:bg-neutral-800'}`}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    className="h-9 w-9"
                    onClick={endVideoCall}
                  >
                    <PhoneOff className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Connection Status */}
            <div className="px-3 py-2 border-t border-neutral-800 text-center">
              {isConnected ? (
                <Badge variant="outline" className="text-[10px] border-green-500 text-green-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5" />
                  Connected
                </Badge>
              ) : isVideoReady ? (
                <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse mr-1.5" />
                  Waiting for peer...
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-neutral-600 text-neutral-500">
                  Camera off
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewRoom;
