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
      // Hardware Off: Stop all video tracks to turn off the light
      stream.getVideoTracks().forEach(t => t.stop());
      setIsVideoOn(false);
      // We don't set stream to null yet to keep audio if active, 
      // but we'll need to re-init for video
      setIsPreviewActive(false); 
    } else {
      // Hardware On: Re-request stream
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
    // Pass the existing stream and settings
    onJoin({ name, email, isVideoOn, isMicOn, existingStream: stream });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-6 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50"
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
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Ready to join?
            </h1>
            <p className="text-neutral-500 text-base">Check your camera and microphone before entering.</p>
          </div>

          <Card className="jx-glass aspect-video relative overflow-hidden">
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
                  className="absolute inset-0 bg-neutral-100/80 dark:bg-neutral-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                >
                  <div className="p-4 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full mb-4">
                    <Video className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-neutral-900 dark:text-neutral-100">
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
                    className="px-6"
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
                  className="absolute inset-0 bg-neutral-900 flex items-center justify-center"
                >
                  <div className="h-20 w-20 rounded-full bg-neutral-800 flex items-center justify-center">
                    <VideoOff className="h-8 w-8 text-neutral-500" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Button
                variant={isMicOn ? "ghost" : "destructive"}
                size="icon"
                onClick={toggleMic}
                className="h-10 w-10"
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              <Button
                variant={isVideoOn ? "ghost" : "destructive"}
                size="icon"
                onClick={toggleVideo}
                className="h-10 w-10"
              >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              <Separator orientation="vertical" className="h-6 mx-2" />
              
              {/* Quick Settings Dropdown */}
              <div className="flex items-center gap-1 pr-1">
                <Select value={selectedDevices.video} onValueChange={(id) => handleDeviceChange('video', id)}>
                  <SelectTrigger className="w-9 h-9 p-0 border-none bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center">
                    <Camera className="h-4 w-4 text-neutral-500" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.video.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs">{d.label || 'Camera'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDevices.audio} onValueChange={(id) => handleDeviceChange('audio', id)}>
                  <SelectTrigger className="w-9 h-9 p-0 border-none bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center">
                    <Volume2 className="h-4 w-4 text-neutral-500" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.audio.map(d => (
                      <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs">{d.label || 'Microphone'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-6 justify-center text-neutral-500 text-xs font-medium uppercase tracking-wider">
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
          className="lg:col-span-2 space-y-6"
        >
          <Card className="jx-glass p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:bg-blue-900/20 px-3 py-0.5 rounded-full text-xs font-medium">
                  {interview?.type || 'Technical'}
                </Badge>
                {isConnected && (
                   <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900 dark:bg-emerald-900/20 px-3 py-0.5 rounded-full text-xs font-medium">
                    Ready
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">{interview?.title || 'Interview Session'}</h2>
              <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-neutral-500">Host</span>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{interview?.instructor?.username || 'JudgeX Host'}</span>
                </div>
              </div>
            </div>

            <Separator />
            
            {role === 'interviewer' && (
              <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <Label className="text-xs font-semibold">Share with Candidate</Label>
                </div>
                <p className="text-xs text-neutral-500">Send this link to the person you are interviewing. They do not need to log in.</p>
                <Button 
                  variant="outline" 
                  onClick={copyInviteLink}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Invite Link
                </Button>
              </div>
            )}

            {role === 'candidate' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Your Name</Label>
                  <Input 
                    placeholder="Full Name" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Email Address</Label>
                  <Input 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

              <Button 
                onClick={handleJoin}
                className="w-full h-12 text-base font-medium transition-all"
              >
                Join Room
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            
            <p className="text-xs text-center text-neutral-500">
              Secured & Powered by JudgeX
            </p>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Lobby;
