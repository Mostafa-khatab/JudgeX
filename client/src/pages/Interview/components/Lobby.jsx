import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, 
  ArrowRight, Camera, 
  User, CheckCircle2, ShieldCheck,
  Volume2, Copy, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '~/components/ui/select';

const Lobby = ({ interview, role, onJoin, candidateToken, isConnected, authUser }) => {
  const [name, setName] = useState(() => authUser?.username || localStorage.getItem('candidateName') || '');
  const [email, setEmail] = useState(() => authUser?.email || localStorage.getItem('candidateEmail') || '');

  // Sync with authUser if it loads later
  useEffect(() => {
    if (authUser) {
      if (!name) setName(authUser.username || '');
      if (!email) setEmail(authUser.email || '');
    }
  }, [authUser]);
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [selectedDevices, setSelectedDevices] = useState({ video: '', audio: '' });
  const [permissionError, setPermissionError] = useState(null);
  
  // Media Preview State
  const [stream, setStream] = useState(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    getDevices();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const getDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const video = allDevices.filter(d => d.kind === 'videoinput');
      const audio = allDevices.filter(d => d.kind === 'audioinput');
      setDevices({ video, audio });
      if (video.length) setSelectedDevices(prev => ({ ...prev, video: video[0].deviceId }));
      if (audio.length) setSelectedDevices(prev => ({ ...prev, audio: audio[0].deviceId }));
    } catch (err) {
      console.error('Lobby: Failed to get devices', err);
    }
  };

  const startPreview = useCallback(async (videoDeviceId, audioDeviceId) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true
      };

      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      setIsPreviewActive(true);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error('Lobby: Preview failed', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Camera/Mic access was denied. Please enable them in your browser settings.');
      } else {
        toast.error('Could not access selected device');
      }
      setIsPreviewActive(false);
    }
  }, [stream]);

  const handleDeviceChange = useCallback((type, deviceId) => {
    setSelectedDevices(prev => ({ ...prev, [type]: deviceId }));
    startPreview(
      type === 'video' ? deviceId : selectedDevices.video,
      type === 'audio' ? deviceId : selectedDevices.audio
    );
  }, [selectedDevices, startPreview]);

  const copyInviteLink = () => {
    if (!interview?.inviteToken) {
      toast.error('Invite link is not available yet');
      return;
    }
    const link = `${window.location.origin}/interview/join/${interview.inviteToken}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied to clipboard!');
  };

  const toggleVideo = async () => {
    // Keep preview tracks alive when possible; just enable/disable.
    if (stream?.getVideoTracks?.()?.[0]) {
      const track = stream.getVideoTracks()[0];
      track.enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
      setIsPreviewActive(track.enabled);
      return;
    }
    await startPreview(selectedDevices.video, selectedDevices.audio);
    setIsVideoOn(true);
  };

  const toggleMic = async () => {
    if (stream?.getAudioTracks?.()?.[0]) {
      const track = stream.getAudioTracks()[0];
      track.enabled = !isMicOn;
      setIsMicOn(!isMicOn);
      return;
    }
    await startPreview(selectedDevices.video, selectedDevices.audio);
    setIsMicOn(true);
  };

  const handleJoin = () => {
    const joinName = name.trim() || authUser?.username || '';
    const joinEmail = email.trim() || authUser?.email || '';
    if (role === 'candidate' && !authUser && (!joinName || !joinEmail)) {
      toast.error('Please enter your name and email');
      return;
    }
    onJoin({ name: joinName, email: joinEmail, isVideoOn, isMicOn, existingStream: stream });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0b] text-neutral-50 relative overflow-hidden"
    >
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-5 gap-16 items-center relative z-10">
        
        {/* Left: Device Preview */}
        <motion.div 
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-3 space-y-10"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
              Lobby Room
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-white">
              Ready to <span className="text-blue-500">Join?</span>
            </h1>
            <p className="text-neutral-400 text-lg font-medium max-w-md leading-relaxed">
              Optimize your setup for the best interview experience.
            </p>
          </div>

          <div className="relative aspect-video rounded-[32px] overflow-hidden bg-black border border-white/5 shadow-2xl group">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            
            <AnimatePresence>
              {!isPreviewActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0b] p-8 text-center">
                  <div className="p-8 bg-blue-600/10 text-blue-500 rounded-[32px] mb-8">
                    <Camera className="h-14 w-14" />
                  </div>
                  <h3 className="text-3xl font-black mb-4">Camera is Disabled</h3>
                  <p className="text-neutral-500 text-sm max-w-xs leading-relaxed font-medium">
                    Please enable your camera and microphone to ensure you are ready for the interview.
                  </p>
                </div>
              )}
            </AnimatePresence>

            {/* Controls Bar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#121214]/80 backdrop-blur-2xl p-2 rounded-2xl border border-white/10 shadow-2xl">
              <Button
                variant={isMicOn ? "ghost" : "destructive"}
                size="icon"
                onClick={toggleMic}
                className="h-12 w-12 rounded-xl text-white"
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              <Button
                variant={isVideoOn ? "ghost" : "destructive"}
                size="icon"
                onClick={toggleVideo}
                className="h-12 w-12 rounded-xl text-white"
              >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              
              <div className="h-8 w-[1px] bg-white/10 mx-2" />
              
              <Select value={selectedDevices.video || 'default-video'} onValueChange={(id) => handleDeviceChange('video', id)}>
                <SelectTrigger className="w-12 h-12 p-0 border-none bg-transparent hover:bg-white/5 rounded-xl flex items-center justify-center">
                  <Camera className="h-5 w-5 text-neutral-400" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f11] border-white/10 text-white rounded-xl">
                  {(devices.video.length > 0 ? devices.video : [{ deviceId: 'default-video', label: 'Default Camera' }]).map((d, i) => (
                    <SelectItem key={d.deviceId || `video-${i}`} value={d.deviceId || `video-fallback-${i}`} className="text-xs">{d.label || `Camera ${i + 1}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDevices.audio || 'default-audio'} onValueChange={(id) => handleDeviceChange('audio', id)}>
                <SelectTrigger className="w-12 h-12 p-0 border-none bg-transparent hover:bg-white/5 rounded-xl flex items-center justify-center">
                  <Volume2 className="h-5 w-5 text-neutral-400" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f11] border-white/10 text-white rounded-xl">
                  {(devices.audio.length > 0 ? devices.audio : [{ deviceId: 'default-audio', label: 'Default Microphone' }]).map((d, i) => (
                    <SelectItem key={d.deviceId || `audio-${i}`} value={d.deviceId || `audio-fallback-${i}`} className="text-xs">{d.label || `Microphone ${i + 1}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-10 justify-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
            <span className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Encrypted Stream
            </span>
            <span className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              System Verified
            </span>
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <motion.div 
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-[#0f0f11] p-10 rounded-[40px] border border-white/5 space-y-10 shadow-2xl relative">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.15em] text-neutral-400">
                Technical Session
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-white">{interview?.title || 'Interview'}</h2>
              
              <div className="flex items-center gap-5 p-5 bg-white/[0.02] rounded-3xl border border-white/5">
                <div className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Host</span>
                  <span className="text-lg font-bold text-white mt-1">JudgeX Host</span>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-white/5" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-600/10 text-blue-500 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-blue-500">Share with Candidate</span>
              </div>
              <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                Send this unique link to the person you are interviewing. No login required.
              </p>
              <Button 
                variant="outline" 
                onClick={copyInviteLink}
                className="w-full h-12 rounded-xl bg-transparent border-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all"
              >
                <Copy className="h-4 w-4 mr-3" />
                Copy Link
              </Button>
            </div>

            <Button 
              onClick={handleJoin}
              className="w-full h-16 text-sm font-black uppercase tracking-[0.2em] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-2xl shadow-blue-600/20 group"
            >
              Enter Room
              <ArrowRight className="h-5 w-5 ml-4 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <p className="text-[10px] text-center text-neutral-600 font-black uppercase tracking-[0.2em]">
              JudgeX Secure Environment
            </p>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Lobby;
