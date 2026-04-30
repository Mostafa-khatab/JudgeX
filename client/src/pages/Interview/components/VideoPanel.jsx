import { useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, 
  Monitor, PhoneOff, User
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import ClayIcon from './ClayIcon';

const VideoPanel = ({
  localStream, remoteStream,
  isAudioEnabled, isVideoEnabled,
  toggleAudio, toggleVideo, initiateCall,
  isConnected, // WebRTC status
  isSocketConnected, // Socket status
  peerInfo,
  remoteMediaState,
  isScreenSharing, onStartScreenShare, onStopScreenShare,
  remoteScreenStream,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteScreenRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (remoteScreenRef.current && remoteScreenStream) {
      remoteScreenRef.current.srcObject = remoteScreenStream;
    }
  }, [remoteScreenStream]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Remote View */}
      <div className="relative flex-1 bg-black/30 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 group">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-black/20 backdrop-blur-xl">
            <ClayIcon size={64} tint="neutral" className="rounded-[26px]">
              <User className="h-8 w-8 text-white/80" />
            </ClayIcon>
            <p className="text-neutral-400 text-sm font-medium animate-pulse">
              {!isSocketConnected ? 'Connecting to server...' : 'Waiting for peer...'}
            </p>
          </div>
        )}
        
        {/* Overlay Info */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Badge className="bg-black/35 backdrop-blur-2xl border-white/10 py-1 px-3 rounded-full">
            <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
            <span className="truncate max-w-[100px]">{peerInfo?.name || 'Remote Peer'}</span>
          </Badge>
          {!remoteMediaState?.audio && (
            <Badge variant="destructive" className="bg-rose-500/20 text-rose-200 border-rose-500/20 backdrop-blur-2xl rounded-full">
              <MicOff className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>

      {/* Screen Share View (if active) */}
      {remoteScreenStream && (
        <div className="relative aspect-video bg-black/30 rounded-3xl overflow-hidden border border-blue-500/25 shadow-2xl shadow-black/60 group ring-1 ring-blue-500/15">
          <video
            ref={remoteScreenRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-blue-500/25 border border-white/10 backdrop-blur-2xl rounded-full">Peer's Screen</Badge>
          </div>
        </div>
      )}

      {/* Local Preview & Controls */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className="relative aspect-video bg-black/30 rounded-3xl overflow-hidden border border-white/10 shadow-lg shadow-black/50">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center">
              <VideoOff className="h-8 w-8 text-white/30" />
            </div>
          )}
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-black/40 backdrop-blur-2xl text-[10px] py-0 px-2 border-white/10 rounded-full">You</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 justify-center">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={isAudioEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={toggleAudio}
              className={`h-12 w-full rounded-2xl transition-all border ${isAudioEnabled ? 'bg-white/[0.06] border-white/10 text-white hover:bg-white/[0.10]' : 'bg-rose-500/15 border-rose-500/20 text-rose-200 hover:bg-rose-500/20'}`}
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button
              variant={isVideoEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={toggleVideo}
              className={`h-12 w-full rounded-2xl transition-all border ${isVideoEnabled ? 'bg-white/[0.06] border-white/10 text-white hover:bg-white/[0.10]' : 'bg-rose-500/15 border-rose-500/20 text-rose-200 hover:bg-rose-500/20'}`}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className={`h-12 w-full rounded-2xl gap-2 text-[10px] font-black tracking-[0.18em] transition-all border ${isScreenSharing ? 'bg-blue-500/20 border-blue-500/30 text-blue-100' : 'bg-white/[0.06] border-white/10 text-neutral-200 hover:bg-white/[0.10]'}`}
              onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
            >
              <Monitor className="h-4 w-4" />
              {isScreenSharing ? 'Stop' : 'Screen'}
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full rounded-2xl gap-2 text-[10px] font-black tracking-[0.18em] bg-white/[0.06] border border-white/10 text-neutral-200 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-100 transition-all"
              onClick={initiateCall}
            >
              <PhoneOff className="h-4 w-4 rotate-[135deg]" />
              Reconnect
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPanel;
