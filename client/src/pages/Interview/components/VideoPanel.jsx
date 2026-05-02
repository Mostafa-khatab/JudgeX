import { useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, 
  Monitor, PhoneOff, User, LogOut
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';

const VideoPanel = ({
  localStream, remoteStream,
  isAudioEnabled, isVideoEnabled,
  toggleAudio, toggleVideo, initiateCall,
  isConnected, // WebRTC status
  isSocketConnected, // Socket status
  peerInfo,
  remoteMediaState,
  isScreenSharing, startScreenShare, stopScreenShare,
  remoteScreenStream,
  onLeave,
  compact,
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
      <div className={`relative ${compact ? 'flex-none h-40' : 'flex-1'} bg-neutral-950/60 rounded-2xl overflow-hidden group shadow-inner border border-white/10`}>
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-white/5 backdrop-blur-md">
            <div className="p-5 bg-white/10 rounded-full animate-pulse border border-white/10">
              <User className="h-8 w-8 text-neutral-500 dark:text-neutral-400" />
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs font-medium tracking-wide uppercase">
              {!isSocketConnected ? 'Connecting...' : 'Waiting for Peer'}
            </p>
          </div>
        )}
        
        {/* Overlay Info */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Badge className="bg-black/40 hover:bg-black/60 backdrop-blur-md border-white/10 text-white py-1 px-3">
            <div className={`h-1.5 w-1.5 rounded-full mr-2 ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-neutral-400'}`} />
            <span className="truncate max-w-[120px] font-semibold">{peerInfo?.name || 'Remote Peer'}</span>
          </Badge>
          {!remoteMediaState?.audio && (
            <Badge variant="destructive" className="bg-rose-500/80 backdrop-blur-md border-none shadow-lg">
              <MicOff className="h-3 w-3" />
            </Badge>
          )}
        </div>

        {/* Live Indicator */}
        {isConnected && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-rose-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-tighter uppercase backdrop-blur-sm">
            <div className="jx-pulse-dot bg-white shadow-none h-1.5 w-1.5" />
            Live
          </div>
        )}
      </div>

      {/* Screen Share View (if active) */}
      {remoteScreenStream && (
        <div className="relative flex-1 bg-neutral-950 rounded-xl overflow-hidden ring-2 ring-blue-500/20 shadow-2xl">
          <video
            ref={remoteScreenRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-blue-600/90 text-white backdrop-blur-sm border-none">
              <Monitor className="h-3 w-3 mr-1.5" />
              Peer's Screen
            </Badge>
          </div>
        </div>
      )}

      {/* Local Preview & Controls */}
      <div className="flex items-end gap-3 shrink-0">
        <div className={`relative ${compact ? 'w-24' : 'w-32'} aspect-video bg-neutral-950/60 rounded-2xl overflow-hidden border border-white/10 shadow-lg group`}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
              <VideoOff className="h-5 w-5 text-neutral-500" />
            </div>
          )}
          <div className="absolute bottom-2 left-2">
            <Badge className="text-[9px] py-0 px-1.5 bg-black/60 backdrop-blur-md border-none text-white/80">You</Badge>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              variant={isAudioEnabled ? "secondary" : "destructive"}
              size="icon"
              onClick={toggleAudio}
              className="flex-1 h-9 rounded-2xl shadow-sm"
              title="Mute"
            >
              {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="icon"
              onClick={toggleVideo}
              className="flex-1 h-9 rounded-2xl shadow-sm"
              title="Camera"
            >
              {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 h-9 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm"
              onClick={onLeave}
              title="Leave"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Leave
            </Button>
            <Button
              variant="outline"
              className="w-10 h-9 rounded-2xl text-white/70 hover:text-white border-white/10 bg-white/5 hover:bg-white/10"
              onClick={initiateCall}
              title="Reconnect"
            >
              <PhoneOff className="h-3.5 w-3.5 rotate-[135deg]" />
            </Button>
          </div>

          {!compact && (
            <div className="flex gap-2">
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                className={`flex-1 h-9 rounded-2xl text-[11px] font-bold uppercase tracking-tight shadow-sm ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              >
                <Monitor className="h-3.5 w-3.5 mr-1.5" />
                {isScreenSharing ? 'Stop' : 'Share'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPanel;
