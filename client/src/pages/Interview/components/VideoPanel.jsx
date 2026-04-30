import { useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, 
  Monitor, PhoneOff, User, MoreVertical 
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
      <div className="relative flex-1 bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl group">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-neutral-900/50 backdrop-blur-sm">
            <div className="h-20 w-20 rounded-full bg-neutral-800 flex items-center justify-center animate-pulse">
              <User className="h-10 w-10 text-neutral-600" />
            </div>
            <p className="text-neutral-500 text-sm font-medium animate-pulse">
              {!isSocketConnected ? 'Connecting to server...' : 'Waiting for peer...'}
            </p>
          </div>
        )}
        
        {/* Overlay Info */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Badge className="bg-black/40 backdrop-blur-md border-neutral-700/50 py-1 px-3">
            <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`} />
            <span className="truncate max-w-[100px]">{peerInfo?.name || 'Remote Peer'}</span>
          </Badge>
          {!remoteMediaState?.audio && (
            <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/20 backdrop-blur-md">
              <MicOff className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>

      {/* Screen Share View (if active) */}
      {remoteScreenStream && (
        <div className="relative aspect-video bg-neutral-950 rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl group ring-2 ring-blue-500/20">
          <video
            ref={remoteScreenRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-blue-600/90 backdrop-blur-md">Peer's Screen</Badge>
          </div>
        </div>
      )}

      {/* Local Preview & Controls */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className="relative aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
              <VideoOff className="h-8 w-8 text-neutral-700" />
            </div>
          )}
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-black/60 backdrop-blur-sm text-[10px] py-0 px-2 border-neutral-800">You</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 justify-center">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={isAudioEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={toggleAudio}
              className={`h-12 w-full rounded-xl transition-all ${isAudioEnabled ? 'bg-neutral-800 border-neutral-700' : 'bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500/30'}`}
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button
              variant={isVideoEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={toggleVideo}
              className={`h-12 w-full rounded-xl transition-all ${isVideoEnabled ? 'bg-neutral-800 border-neutral-700' : 'bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500/30'}`}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className={`h-12 w-full rounded-xl gap-2 text-[10px] font-bold transition-all ${isScreenSharing ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-neutral-800 border-neutral-700'}`}
              onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
            >
              <Monitor className="h-4 w-4" />
              {isScreenSharing ? 'Stop' : 'Screen'}
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full rounded-xl gap-2 text-[10px] font-bold bg-neutral-800 border-neutral-700 hover:bg-blue-600/20 hover:border-blue-500 hover:text-blue-400 transition-all"
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
