import { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, 
  Settings, ArrowRight, Camera, 
  User, CheckCircle2, ShieldCheck,
  ChevronDown, Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
    // Removed auto-startPreview to prevent camera opening automatically
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
      // Clean up existing stream first
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

  const toggleVideo = () => {
    if (stream) {
      const state = !isVideoOn;
      stream.getVideoTracks().forEach(t => t.enabled = state);
      setIsVideoOn(state);
    }
  };

  const toggleMic = () => {
    if (stream) {
      const state = !isMicOn;
      stream.getAudioTracks().forEach(t => t.enabled = state);
      setIsMicOn(state);
    }
  };

  const handleJoin = () => {
    if (role === 'candidate' && !candidateToken && (!name.trim() || !email.trim())) {
      return;
    }
    // Pass the existing stream and settings
    onJoin({ name, email, isVideoOn, isMicOn, existingStream: stream });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="dark min-h-screen bg-[#050505] text-white flex items-center justify-center p-6"
    >
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
        
        {/* Left: Device Preview (3 Columns) */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 space-y-6"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Ready to join?
            </h1>
            <p className="text-neutral-500 text-lg">Check your camera and microphone before entering.</p>
          </div>

          <Card className="aspect-video relative bg-neutral-900 border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-2xl group ring-1 ring-neutral-800">
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
                  className="absolute inset-0 bg-neutral-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
                >
                  <div className="h-20 w-20 rounded-3xl bg-blue-600/20 flex items-center justify-center mb-4 ring-1 ring-blue-500/30">
                    <Video className="h-10 w-10 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {permissionError ? 'Permission Denied' : 'Camera is off'}
                  </h3>
                  <p className="text-neutral-500 text-sm max-w-xs mb-6">
                    {permissionError || 'Enable your camera and microphone to preview your setup.'}
                  </p>
                  <Button 
                    onClick={() => {
                      setPermissionError(null);
                      startPreview();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8"
                  >
                    {permissionError ? 'Try Again' : 'Enable Devices'}
                  </Button>
                </motion.div>
              )}
              {isPreviewActive && !isVideoOn && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-neutral-950 flex items-center justify-center"
                >
                  <div className="h-24 w-24 rounded-full bg-neutral-900 flex items-center justify-center shadow-inner">
                    <VideoOff className="h-10 w-10 text-neutral-600" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-2xl p-3 rounded-3xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
              <Button
                variant={isMicOn ? "ghost" : "destructive"}
                size="icon"
                onClick={toggleMic}
                className="h-14 w-14 rounded-2xl hover:bg-white/10 transition-colors"
              >
                {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>
              <Button
                variant={isVideoOn ? "ghost" : "destructive"}
                size="icon"
                onClick={toggleVideo}
                className="h-14 w-14 rounded-2xl hover:bg-white/10 transition-colors"
              >
                {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
              <Separator orientation="vertical" className="h-8 bg-white/10 mx-1" />
              
              {/* Quick Settings Dropdown */}
              <div className="flex items-center gap-2 pr-2">
                <Select value={selectedDevices.video} onValueChange={(id) => handleDeviceChange('video', id)}>
                  <SelectTrigger className="w-10 h-10 p-0 border-none bg-transparent hover:bg-white/10 rounded-xl flex items-center justify-center">
                    <Camera className="h-5 w-5 text-neutral-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    {devices.video.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs">{d.label || 'Camera'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDevices.audio} onValueChange={(id) => handleDeviceChange('audio', id)}>
                  <SelectTrigger className="w-10 h-10 p-0 border-none bg-transparent hover:bg-white/10 rounded-xl flex items-center justify-center">
                    <Volume2 className="h-5 w-5 text-neutral-400" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                    {devices.audio.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs">{d.label || 'Microphone'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-8 justify-center text-neutral-500 text-xs font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Secure Link
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              Devices Verified
            </span>
          </div>
        </motion.div>

        {/* Right: Info & Join (2 Columns) */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-8"
        >
          <Card className="bg-neutral-900/40 border-neutral-800 p-10 rounded-[2.5rem] space-y-8 backdrop-blur-md shadow-2xl relative overflow-hidden ring-1 ring-white/5">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Video className="h-24 w-24 -rotate-12" />
            </div>

            <div className="space-y-6 relative">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600/10 text-blue-400 border-blue-500/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                  {interview?.type || 'Technical'}
                </Badge>
                {isConnected && (
                   <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    Ready
                  </Badge>
                )}
              </div>
              <h2 className="text-3xl font-black leading-tight tracking-tight">{interview?.title || 'Interview Session'}</h2>
              <div className="flex items-center gap-3 text-neutral-400">
                <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Host</span>
                  <span className="text-sm font-bold text-neutral-300">{interview?.instructor?.username || 'JudgeX Host'}</span>
                </div>
              </div>
            </div>

            <Separator className="bg-neutral-800" />

            {role === 'candidate' && !candidateToken && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-neutral-500 text-[10px] uppercase tracking-widest font-black ml-1">Your Name</Label>
                  <Input 
                    placeholder="Full Name" 
                    className="bg-neutral-950 border-neutral-800 h-14 rounded-2xl focus:ring-2 ring-blue-500/20 px-6 font-medium"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-500 text-[10px] uppercase tracking-widest font-black ml-1">Email Address</Label>
                  <Input 
                    placeholder="name@example.com" 
                    className="bg-neutral-950 border-neutral-800 h-14 rounded-2xl focus:ring-2 ring-blue-500/20 px-6 font-medium"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Button 
              onClick={handleJoin}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xl font-black rounded-2xl shadow-xl shadow-blue-600/30 group transition-all"
            >
              Join Room
              <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <p className="text-[10px] text-center text-neutral-600 px-4 leading-relaxed uppercase tracking-widest font-black opacity-60">
              Secured & Powered by JudgeX Engine
            </p>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Lobby;
