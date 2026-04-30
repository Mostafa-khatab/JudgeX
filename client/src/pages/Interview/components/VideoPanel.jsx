import { useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, 
  Monitor, PhoneOff, User
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
    <div className="flex flex-row gap-3 h-full">
      {/* Remote View */}
      <div className="relative flex-1 bg-neutral-900 rounded-md overflow-hidden group">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-neutral-100 dark:bg-neutral-800">
            <div className="p-4 bg-neutral-200 dark:bg-neutral-700 rounded-full">
              <User className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              {!isSocketConnected ? 'Connecting to server...' : 'Waiting for peer...'}
            </p>
          </div>
        )}
        
        {/* Overlay Info */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge variant="secondary" className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border-neutral-200 dark:border-neutral-800">
            <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
            <span className="truncate max-w-[100px]">{peerInfo?.name || 'Remote Peer'}</span>
          </Badge>
          {!remoteMediaState?.audio && (
            <Badge variant="destructive" className="bg-red-500/90 backdrop-blur-sm">
              <MicOff className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>

      {/* Screen Share View (if active) */}
      {remoteScreenStream && (
        <div className="relative flex-1 bg-neutral-900 rounded-md overflow-hidden ring-1 ring-blue-500/30">
          <video
            ref={remoteScreenRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
          />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/80 dark:text-blue-300 backdrop-blur-sm border-blue-200 dark:border-blue-800">Peer's Screen</Badge>
          </div>
        </div>
      )}

      {/* Local Preview & Controls */}
      <div className="w-[160px] flex flex-col gap-3 shrink-0">
        <div className="relative aspect-video bg-neutral-900 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <VideoOff className="h-6 w-6 text-neutral-400" />
            </div>
          )}
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="text-[10px] py-0 px-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">You</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={isAudioEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={toggleAudio}
              className="w-full h-9"
            >
              {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={isVideoEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={toggleVideo}
              className="w-full h-9"
            >
              {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={isScreenSharing ? "default" : "outline"}
              className="w-full h-9 px-0 text-xs"
              onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
            >
              <Monitor className="h-3.5 w-3.5 mr-1" />
              {isScreenSharing ? 'Stop' : 'Screen'}
            </Button>
            <Button
              variant="outline"
              className="w-full h-9 px-0 text-xs"
              onClick={initiateCall}
            >
              <PhoneOff className="h-3.5 w-3.5 mr-1 rotate-[135deg]" />
              Reconnect
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPanel;
