import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
  ]
};

export const useWebRTC = (socketHandlers, interviewId, role) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [remoteMediaState, setRemoteMediaState] = useState({ audio: true, video: true });
  const [isConnected, setIsConnected] = useState(false);
  
  // Screen share state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);

  const pcRef = useRef(null);
  const screenPcRef = useRef(null);

  const iceQueue = useRef([]);
  const screenIceQueue = useRef([]);
  const isRemoteDescriptionSet = useRef(false);
  const isScreenRemoteDescriptionSet = useRef(false);

  // Refs for media state to avoid stale closures
  const localStreamRef = useRef(null);
  const isAudioEnabledRef = useRef(true);
  const isVideoEnabledRef = useRef(true);

  // If a peer queries presence before local media is ready, initiate once it is.
  const shouldInitiateRef = useRef(false);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Initialize Media
  const startMedia = useCallback(async (options = {}, existingStream = null) => {
    try {
      const wantAudio = options.audio !== false;
      const wantVideo = options.video !== false;

      // Prefer reusing an existing lobby preview stream, but only if it actually has live tracks.
      if (existingStream) {
        const hasLiveAudio = existingStream.getAudioTracks().some(t => t.readyState === 'live');
        const hasLiveVideo = existingStream.getVideoTracks().some(t => t.readyState === 'live');
        const usable = (!wantAudio || hasLiveAudio) && (!wantVideo || hasLiveVideo);

        if (usable) {
          setLocalStream(existingStream);
          localStreamRef.current = existingStream;
          setIsAudioEnabled(wantAudio);
          setIsVideoEnabled(wantVideo);
          isAudioEnabledRef.current = wantAudio;
          isVideoEnabledRef.current = wantVideo;

          // Kick presence signaling again now that media is ready.
          if (interviewId) socketHandlers?.emit('participant-request', { interviewId });
          if (role === 'interviewer') shouldInitiateRef.current = true;

          return existingStream;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: wantVideo,
        audio: wantAudio
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsAudioEnabled(wantAudio);
      setIsVideoEnabled(wantVideo);
      isAudioEnabledRef.current = wantAudio;
      isVideoEnabledRef.current = wantVideo;

      // Kick presence signaling again now that media is ready.
      if (interviewId) socketHandlers?.emit('participant-request', { interviewId });
      if (role === 'interviewer') shouldInitiateRef.current = true;

      return stream;
    } catch (err) {
      console.error('[WebRTC] Failed to get media:', err);
      toast.error('Failed to access camera/microphone');
      return null;
    }
  }, [interviewId, role, socketHandlers]);

  const createPeerConnection = useCallback((stream) => {
    if (pcRef.current) pcRef.current.close();
    
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    stream?.getTracks().forEach(track => pc.addTrack(track, stream));
    
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.streams[0]);
      setRemoteStream(event.streams[0]);
    };
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] Local ICE Candidate found');
        socketHandlers?.emit('interview-webrtc-ice', {
          interviewId,
          candidate: event.candidate
        });
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
      setIsConnected(pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed');
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Peer Connection state:', pc.connectionState);
    };

    pcRef.current = pc;
    return pc;
  }, [interviewId, socketHandlers]);

  const initiateCall = useCallback(async () => {
    console.log('[WebRTC] Manual/Auto initiating call (ICE Restart)...');
    
    // Close existing PC if any
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    const stream = localStream || await startMedia();
    if (!stream) {
      console.error('[WebRTC] Cannot initiate call without local stream');
      return;
    }

    const pc = createPeerConnection(stream);
    const offer = await pc.createOffer({ iceRestart: true });
    await pc.setLocalDescription(offer);
    
    console.log('[WebRTC] Sending Offer to peer...');
    socketHandlers?.emit('interview-webrtc-offer', {
      interviewId,
      offer
    });
  }, [localStream, startMedia, createPeerConnection, interviewId, socketHandlers]);

  // If we were asked to connect before we had media, initiate once ready.
  useEffect(() => {
    if (role !== 'interviewer') return;
    if (!localStream) return;
    if (!shouldInitiateRef.current) return;

    shouldInitiateRef.current = false;
    // Delay slightly to let the other peer finish joining the room.
    const t = setTimeout(() => {
      initiateCall();
    }, 300);
    return () => clearTimeout(t);
  }, [localStream, role, initiateCall]);

  // Signaling Handlers
  const handleOffer = useCallback(async (offer) => {
    let pc = pcRef.current;
    if (!pc) {
      const stream = localStream || await startMedia();
      pc = createPeerConnection(stream);
    }
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    isRemoteDescriptionSet.current = true;
    
    // Flush ICE
    while (iceQueue.current.length > 0) {
      await pc.addIceCandidate(new RTCIceCandidate(iceQueue.current.shift()));
    }
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketHandlers?.emit('interview-webrtc-answer', { interviewId, answer });
  }, [localStream, startMedia, createPeerConnection, interviewId, socketHandlers]);

  const handleAnswer = useCallback(async (answer) => {
    if (pcRef.current) {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      isRemoteDescriptionSet.current = true;
      while (iceQueue.current.length > 0) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(iceQueue.current.shift()));
      }
    }
  }, []);

  const handleIce = useCallback(async (candidate) => {
    if (pcRef.current && isRemoteDescriptionSet.current) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      iceQueue.current.push(candidate);
    }
  }, []);

  // Screen Share
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      setIsScreenSharing(true);
      
      const pc = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketHandlers?.emit('interview-screen-ice', { interviewId, candidate: event.candidate });
        }
      };
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketHandlers?.emit('interview-screen-offer', { interviewId, offer });
      
      stream.getVideoTracks()[0].onended = () => stopScreenShare();
      screenPcRef.current = pc;
    } catch (err) {
      console.error('[WebRTC] Screen share failed:', err);
    }
  }, [interviewId, socketHandlers]);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    if (screenPcRef.current) {
      screenPcRef.current.close();
      screenPcRef.current = null;
    }
    setIsScreenSharing(false);
    socketHandlers?.emit('interview-screen-stopped', { interviewId });
  }, [screenStream, interviewId, socketHandlers]);

  const handleScreenOffer = useCallback(async (offer) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.ontrack = (event) => setRemoteScreenStream(event.streams[0]);
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketHandlers?.emit('interview-screen-ice', { interviewId, candidate: event.candidate });
      }
    };
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    isScreenRemoteDescriptionSet.current = true;
    while (screenIceQueue.current.length > 0) {
      await pc.addIceCandidate(new RTCIceCandidate(screenIceQueue.current.shift()));
    }
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketHandlers?.emit('interview-screen-answer', { interviewId, answer });
    screenPcRef.current = pc;
  }, [interviewId, socketHandlers]);

  // Toggles
  const toggleAudio = useCallback(async () => {
    if (localStream && isAudioEnabled) {
      localStream.getAudioTracks().forEach(t => t.stop());
      setIsAudioEnabled(false);
      socketHandlers?.emit('interview-media-state', {
        interviewId,
        mediaState: { audio: false, video: isVideoEnabled }
      });
    } else {
      const stream = await startMedia({ audio: true, video: isVideoEnabled });
      if (stream) {
        setIsAudioEnabled(true);
        // Replace tracks in peer connection
        const audioTrack = stream.getAudioTracks()[0];
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'audio');
        if (sender) sender.replaceTrack(audioTrack);
      }
    }
  }, [localStream, isAudioEnabled, isVideoEnabled, interviewId, socketHandlers, startMedia]);

  const toggleVideo = useCallback(async () => {
    if (localStream && isVideoEnabled) {
      localStream.getVideoTracks().forEach(t => t.stop());
      setIsVideoEnabled(false);
      socketHandlers?.emit('interview-media-state', {
        interviewId,
        mediaState: { audio: isAudioEnabled, video: false }
      });
    } else {
      const stream = await startMedia({ audio: isAudioEnabled, video: true });
      if (stream) {
        setIsVideoEnabled(true);
        // Replace tracks in peer connection
        const videoTrack = stream.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      }
    }
  }, [localStream, isAudioEnabled, isVideoEnabled, interviewId, socketHandlers, startMedia]);

  // Lifecycle
  useEffect(() => {
    if (!socketHandlers?.on) return;
    
    const u1 = socketHandlers.on('webrtc-offer', ({ offer }) => handleOffer(offer));
    const u2 = socketHandlers.on('webrtc-answer', ({ answer }) => handleAnswer(answer));
    const u3 = socketHandlers.on('webrtc-ice', ({ candidate }) => handleIce(candidate));
    const u4 = socketHandlers.on('screen-offer', ({ offer }) => handleScreenOffer(offer));
    const u5 = socketHandlers.on('screen-stopped', () => setRemoteScreenStream(null));
    const u6 = socketHandlers.on('media-state-updated', ({ mediaState }) => {
      setRemoteMediaState(mediaState);
    });
    
    // When a new participant joins, the existing peer should initiate the call
    const u7 = socketHandlers.on('participant-query', ({ from }) => {
      console.log('[WebRTC] Participant query from:', from);
      if (role === 'interviewer') {
        if (localStreamRef.current) initiateCall();
        else shouldInitiateRef.current = true;
      }
    });

    // More direct: when someone joins the interview room, interviewer initiates.
    const u7b = socketHandlers.on('participant-joined', () => {
      if (role !== 'interviewer') return;
      if (localStreamRef.current) initiateCall();
      else shouldInitiateRef.current = true;
    });

    const u8 = socketHandlers.on('participant-info', (data) => {
      console.log('[WebRTC] Received participant info:', data);
      // If we joined and see someone else, we can also try to initiate or wait for offer
    });
    
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); u7b(); u8(); };
  }, [socketHandlers, handleOffer, handleAnswer, handleIce, handleScreenOffer]);

  return {
    localStream, remoteStream, 
    isAudioEnabled, isVideoEnabled, isConnected,
    isScreenSharing, screenStream, remoteScreenStream,
    startMedia, createPeerConnection, initiateCall,
    toggleAudio, toggleVideo,
    startScreenShare, stopScreenShare
  };
};

export default useWebRTC;
