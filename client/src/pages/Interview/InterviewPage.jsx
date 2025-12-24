import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, Plus, Play, Copy, Users, Clock, 
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import CollaborativeEditor from '../../components/Interview/CollaborativeEditor';
import AddQuestionModal from '../../components/Interview/AddQuestionModal';
import { runCode } from '~/services/codeRunner';

// Language templates
const codeTemplates = {
  c: `#include <stdio.h>

int main() {
    // Write your solution here
    
    return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        // Write your solution here
        
    }
}`,
  python: `# Write your solution here

def main():
    pass

if __name__ == "__main__":
    main()`,
  javascript: `// Write your solution here

function main() {
    
}

main();`,
};

const languageOptions = [
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
];

const InterviewPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  
  // Timer
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  // UI State
  const [activeTab, setActiveTab] = useState('problem');
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(codeTemplates['cpp']);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  // Run code state
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [activeOutputTab, setActiveOutputTab] = useState('output');

  // Video/Audio state
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [hasRemoteUser, setHasRemoteUser] = useState(false);
  
  // Refs
  const socketRef = useRef(null);
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Socket and media setup
  useEffect(() => {
    socketRef.current = io(socketUrl);

    // Get user media with fallback
    const getMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(mediaStream);
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = mediaStream;
        }
        return mediaStream;
      } catch (err) {
        console.warn('Could not get video/audio, trying video only:', err);
        try {
          const videoOnly = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setStream(videoOnly);
          if (myVideoRef.current) {
            myVideoRef.current.srcObject = videoOnly;
          }
          return videoOnly;
        } catch (err2) {
          console.warn('Could not get video, trying audio only:', err2);
          try {
            const audioOnly = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            setStream(audioOnly);
            return audioOnly;
          } catch (err3) {
            console.error('Could not access any media devices:', err3);
            toast.warning('Could not access camera/microphone');
            return null;
          }
        }
      }
    };

    getMedia().then((mediaStream) => {
      // Join room
      socketRef.current.emit('join-room', roomId);

      // Handle new user joining
      socketRef.current.on('user-joined', async (userId) => {
        toast.info('A participant joined the interview');
        setHasRemoteUser(true);
        
        if (mediaStream) {
          await createOffer(mediaStream);
        }
      });

      // Handle offer
      socketRef.current.on('offer', async ({ offer }) => {
        await handleOffer(offer, mediaStream);
      });

      // Handle answer
      socketRef.current.on('answer', async ({ answer }) => {
        if (peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (err) {
            console.error('Error setting remote description:', err);
          }
        }
      });

      // Handle ICE candidate
      socketRef.current.on('ice-candidate', async ({ candidate }) => {
        if (peerConnectionRef.current && candidate) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        }
      });

      // User left
      socketRef.current.on('user-left', () => {
        toast.info('A participant left');
        setHasRemoteUser(false);
        setRemoteStream(null);
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
      });
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, socketUrl]);

  const createPeerConnection = (mediaStream) => {
    const pc = new RTCPeerConnection(iceServers);

    // Add local tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        pc.addTrack(track, mediaStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const createOffer = async (mediaStream) => {
    try {
      const pc = createPeerConnection(mediaStream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('offer', { roomId, offer });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  const handleOffer = async (offer, mediaStream) => {
    try {
      const pc = createPeerConnection(mediaStream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit('answer', { roomId, answer });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  const toggleMute = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMuted(!audioTracks[0].enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        setIsCameraOff(!videoTracks[0].enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      setScreenStream(null);
      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(displayStream);
        setIsScreenSharing(true);

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = displayStream;
        }

        // Handle when user stops sharing via browser button
        displayStream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error('Error sharing screen:', err);
        if (err.name !== 'NotAllowedError') {
          toast.error('Could not share screen');
        }
      }
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(codeTemplates[lang]);
    setShowLanguageDropdown(false);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }
    setIsRunning(true);
    setActiveOutputTab('output');
    try {
      const res = await runCode({
        code,
        language,
        input: '',
      });
      setOutput(res.output || res.error || 'No output');
    } catch (err) {
      console.error(err);
      setOutput(`Error: ${err.message || 'Execution failed'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/interview/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const endInterview = () => {
    if (confirm('Are you sure you want to end this interview?')) {
      navigate('/interview/create');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#1a1a2e] text-white overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-12 bg-[#16162a] border-b border-gray-700/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <Video className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">JudgeX Interview</span>
          </div>
          <div className="h-4 w-px bg-gray-600" />
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Clock size={12} />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
          >
            <Copy size={12} />
            Copy Link
          </button>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-[10px] font-medium">I</div>
            {hasRemoteUser && (
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-[10px] font-medium">C</div>
            )}
          </div>
          <button
            onClick={endInterview}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors"
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem/Question */}
        <div className="w-[400px] bg-[#1e1e3f] border-r border-gray-700/50 flex flex-col shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-gray-700/50">
            <button
              onClick={() => setActiveTab('problem')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'problem'
                  ? 'text-white border-b-2 border-blue-500 bg-blue-500/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText size={14} className="inline mr-2" />
              Problem
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-white border-b-2 border-blue-500 bg-blue-500/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare size={14} className="inline mr-2" />
              Chat
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === 'problem' ? (
              <div>
                {selectedQuestion ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white">
                        {selectedQuestion.id}. {selectedQuestion.name}
                      </h2>
                      <span className={`text-xs px-2 py-1 rounded ${
                        selectedQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                        selectedQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedQuestion.difficulty}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedQuestion.task}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <FileText className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="text-gray-400 mb-2">No problem selected</h3>
                    <button
                      onClick={() => setIsAddQuestionOpen(true)}
                      className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus size={14} />
                      Select Problem
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Chat feature coming soon...
              </div>
            )}
          </div>

          {/* Add Question Button */}
          {activeTab === 'problem' && selectedQuestion && (
            <div className="p-3 border-t border-gray-700/50">
              <button
                onClick={() => setIsAddQuestionOpen(true)}
                className="w-full px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                Change Problem
              </button>
            </div>
          )}
        </div>

        {/* Center Panel - Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor Toolbar */}
          <div className="h-10 bg-[#16162a] border-b border-gray-700/50 flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded text-xs font-medium transition-colors"
                >
                  {languageOptions.find(l => l.value === language)?.label}
                  <ChevronDown size={12} />
                </button>
                {showLanguageDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-32 bg-[#1e1e3f] border border-gray-700 rounded-lg shadow-xl z-20 py-1">
                    {languageOptions.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => handleLanguageChange(lang.value)}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-700/50 transition-colors ${
                          language === lang.value ? 'text-blue-400' : 'text-gray-300'
                        }`}
                      >
                        {lang.label}
                        {language === lang.value && <span className="float-right">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 text-white text-xs font-medium rounded transition-colors disabled:cursor-not-allowed"
              >
                <Play size={12} />
                {isRunning ? 'Running...' : 'Run'}
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 min-h-0">
            <CollaborativeEditor
              roomId={roomId}
              socketUrl={socketUrl}
              onChange={handleCodeChange}
              language={language}
              initialCode={code}
            />
          </div>

          {/* Output Panel */}
          <div className="h-48 bg-[#16162a] border-t border-gray-700/50 flex flex-col shrink-0">
            <div className="flex border-b border-gray-700/50">
              <button
                onClick={() => setActiveOutputTab('output')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeOutputTab === 'output'
                    ? 'text-white border-b-2 border-green-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Output
              </button>
              <button
                onClick={() => setActiveOutputTab('testcases')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeOutputTab === 'testcases'
                    ? 'text-white border-b-2 border-green-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Test Cases
              </button>
            </div>
            <div className="flex-1 p-3 overflow-auto">
              <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">
                {output || 'Click "Run" to execute your code...'}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Panel - Participants & Video */}
        <div className="w-[280px] bg-[#1e1e3f] border-l border-gray-700/50 flex flex-col shrink-0">
          {/* Participants */}
          <div className="border-b border-gray-700/50">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-gray-400" />
                <span className="text-sm font-medium">Participants</span>
                <span className="text-xs text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">
                  {hasRemoteUser ? 2 : 1}
                </span>
              </div>
            </div>
            <div className="px-4 pb-3 space-y-2">
              <div className="flex items-center gap-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-medium">I</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Interviewer (You)</p>
                  <p className="text-xs text-blue-400">Host</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
              {hasRemoteUser && (
                <div className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-medium">C</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Candidate</p>
                    <p className="text-xs text-gray-400">Interviewee</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              )}
            </div>
          </div>

          {/* Video Preview Area */}
          <div className="flex-1 p-3 space-y-2 overflow-auto">
            {/* Screen Share */}
            {screenStream && (
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative border-2 border-purple-500">
                <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                <div className="absolute bottom-2 left-2 text-xs bg-purple-500/80 px-2 py-1 rounded flex items-center gap-1">
                  <Monitor size={10} />
                  Screen
                </div>
              </div>
            )}
            
            {/* My Video */}
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative border border-blue-500/50">
              <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {isCameraOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-lg font-medium">I</div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 text-xs bg-black/50 px-2 py-1 rounded">You</div>
            </div>

            {/* Remote Video */}
            {remoteStream && (
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative border border-green-500/50">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 text-xs bg-black/50 px-2 py-1 rounded">Candidate</div>
              </div>
            )}
          </div>

          {/* Video Controls */}
          <div className="p-3 border-t border-gray-700/50">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full transition-colors ${
                  isMuted ? 'bg-red-500 hover:bg-red-400' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button
                onClick={toggleCamera}
                className={`p-3 rounded-full transition-colors ${
                  isCameraOff ? 'bg-red-500 hover:bg-red-400' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isCameraOff ? 'Turn On Camera' : 'Turn Off Camera'}
              >
                {isCameraOff ? <VideoOff size={16} /> : <Video size={16} />}
              </button>
              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition-colors ${
                  isScreenSharing ? 'bg-green-500 hover:bg-green-400' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
              >
                {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Question Modal */}
      <AddQuestionModal
        isOpen={isAddQuestionOpen}
        onClose={() => setIsAddQuestionOpen(false)}
        onSelectQuestion={(q) => {
          setSelectedQuestion(q);
          setIsAddQuestionOpen(false);
        }}
      />
    </div>
  );
};

export default InterviewPage;
