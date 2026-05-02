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

const Lobby = ({ interview, role, onJoin, candidateToken, isConnected }) => {
  const [name, setName] = useState(() => localStorage.getItem('candidateName') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('candidateEmail') || '');
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [selectedDevices, setSelectedDevices] = useState({ video: '', audio: '' });
  const [permissionError, setPermissionError] = useState(null);
  
  // Media Preview State
  const [stream, setStream] = useState(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
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
    if (stream && isVideoOn) {
      stream.getVideoTracks().forEach(t => t.stop());
      setIsVideoOn(false);
      setIsPreviewActive(false); 
    } else {
      await startPreview(selectedDevices.video, selectedDevices.audio);
      setIsVideoOn(true);
    }
  };

  const toggleMic = async () => {
    if (stream && isMicOn) {
      stream.getAudioTracks().forEach(t => t.stop());
      setIsMicOn(false);
    } else {
      await startPreview(selectedDevices.video, selectedDevices.audio);
      setIsMicOn(true);
    }
  };

  const handleJoin = () => {
    if (role === 'candidate' && (!name.trim() || !email.trim())) {
      toast.error('Please enter your name and email');
      return;
    }
    onJoin({ name, email, isVideoOn, isMicOn, existingStream: stream });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-6 jx-mesh-bg text-neutral-900 dark:text-neutral-50 relative overflow-hidden"
    >
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-5 gap-12 items-center relative z-10">
        
        {/* Left: Device Preview (3 Columns) */}
        <motion.div 
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="lg:col-span-3 space-y-8"
        >
          <div className="space-y-3">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
              Lobby Room
            </Badge>
            <h1 className="text-5xl font-black tracking-tighter text-white drop-shadow-2xl">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Join?</span>
            </h1>
            <p className="text-neutral-400 text-lg font-medium leading-relaxed max-w-md">
              Optimize your setup for the best interview experience.
            </p>
          </div>

          <Card className="jx-glass-strong aspect-video relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] group ring-1 ring-white/10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            
            <AnimatePresence>
              {!isPreviewActive && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-[#0f0f11]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="p-6 bg-blue-600/20 text-blue-400 rounded-3xl mb-6 shadow-2xl shadow-blue-600/10"
                  >
                    <Camera className="h-12 w-12" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-3 text-white">
                    {permissionError ? 'Access Denied' : 'Camera is Disabled'}
                  </h3>
                  <p className="text-neutral-400 text-sm max-w-xs mb-8 font-medium leading-relaxed">
                    {permissionError || 'Please enable your camera and microphone to ensure you are ready for the interview.'}
                  </p>
                  <Button 
                    onClick={() => {
                      setPermissionError(null);
                      startPreview();
                    }}
                    className="px-10 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20"
                  >
                    {permissionError ? 'Try Again' : 'Enable Camera'}
                  </Button>
                </motion.div>
              )}
              {isPreviewActive && !isVideoOn && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#0f0f11] flex items-center justify-center"
                >
                  <div className="h-24 w-24 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center shadow-2xl">
                    <VideoOff className="h-10 w-10 text-neutral-600" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-2xl p-2.5 rounded-2xl border border-white/10 shadow-2xl transform transition-transform duration-300 group-hover:scale-105">
              <Button
                variant={isMicOn ? "ghost" : "destructive"}
                size="icon"
                onClick={toggleMic}
                className={`h-12 w-12 rounded-xl ${isMicOn ? 'text-white hover:bg-white/10' : ''}`}
              >
                {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>
              <Button
                variant={isVideoOn ? "ghost" : "destructive"}
                size="icon"
                onClick={toggleVideo}
                className={`h-12 w-12 rounded-xl ${isVideoOn ? 'text-white hover:bg-white/10' : ''}`}
              >
                {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
              
              <div className="h-8 w-[1px] bg-white/10 mx-1" />
              
              <div className="flex items-center gap-1.5 pr-1">
                <Select value={selectedDevices.video} onValueChange={(id) => handleDeviceChange('video', id)}>
                  <SelectTrigger className="w-12 h-12 p-0 border-none bg-transparent hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors">
                    <Camera className="h-5 w-5 text-neutral-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f11] border-white/10 text-white rounded-xl">
                    {devices.video.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs focus:bg-blue-600">{d.label || 'Camera'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDevices.audio} onValueChange={(id) => handleDeviceChange('audio', id)}>
                  <SelectTrigger className="w-12 h-12 p-0 border-none bg-transparent hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors">
                    <Volume2 className="h-5 w-5 text-neutral-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f11] border-white/10 text-white rounded-xl">
                    {devices.audio.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs focus:bg-blue-600">{d.label || 'Microphone'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-8 justify-center text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em]">
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

        {/* Right: Info & Join (2 Columns) */}
        <motion.div 
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="jx-glass p-10 space-y-8 shadow-[0_30px_60px_rgba(0,0,0,0.4)] ring-1 ring-white/5 relative overflow-hidden">
            {/* Glossy overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
            
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/5 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {interview?.type || 'Technical'} Session
                </Badge>
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-white">{interview?.title || 'Interview Session'}</h2>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl shadow-inner">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Host</span>
                  <span className="text-base font-bold text-white leading-none mt-1">{interview?.instructor?.username || 'JudgeX Host'}</span>
                </div>
              </div>
            </div>

            <Separator className="bg-white/5" />
            
            {role === 'interviewer' && (
              <div className="space-y-4 p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <Label className="text-[11px] font-black uppercase tracking-widest text-blue-400">Share with Candidate</Label>
                </div>
                <p className="text-xs text-neutral-400 font-medium leading-relaxed">Send this unique link to the person you are interviewing. No login required.</p>
                <Button 
                  variant="outline" 
                  onClick={copyInviteLink}
                  className="w-full h-11 rounded-xl bg-transparent border-white/10 hover:bg-white/5 text-white font-bold text-xs uppercase tracking-tight"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            )}

            {role === 'candidate' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-neutral-500 ml-1">Your Full Name</Label>
                  <Input 
                    placeholder="e.g. John Doe" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-12 rounded-xl bg-white/5 border-white/5 text-white placeholder:text-neutral-600 focus:ring-blue-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-neutral-500 ml-1">Email Address</Label>
                  <Input 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-12 rounded-xl bg-white/5 border-white/5 text-white placeholder:text-neutral-600 focus:ring-blue-500/40"
                  />
                </div>
              </div>
            )}

            <Button 
              onClick={handleJoin}
              className="w-full h-14 text-sm font-black uppercase tracking-[0.15em] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-2xl shadow-blue-600/30 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center">
                Enter Room
                <ArrowRight className="h-5 w-5 ml-3 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
            
            <p className="text-[10px] text-center text-neutral-600 font-black uppercase tracking-widest">
              JudgeX Secure Environment
            </p>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Lobby;
