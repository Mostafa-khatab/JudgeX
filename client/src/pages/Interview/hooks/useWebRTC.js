import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19305' },
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
    }
  ],
  iceCandidatePoolSize: 10,
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

      // Allow joining with mic+cam off without prompting for permissions.
      if (!wantAudio && !wantVideo) {
        setLocalStream(null);
        localStreamRef.current = null;
        setIsAudioEnabled(false);
        setIsVideoEnabled(false);
        isAudioEnabledRef.current = false;
        isVideoEnabledRef.current = false;
        return null;
      }

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
      
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.warn('[WebRTC] ICE Connection failed/disconnected, requesting reconnect...');
        socketHandlers?.emit('interview-webrtc-reconnect', { interviewId });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Peer Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        socketHandlers?.emit('interview-webrtc-reconnect', { interviewId });
      }
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

  const handleScreenAnswer = useCallback(async (answer) => {
    if (screenPcRef.current) {
      await screenPcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  const handleScreenIce = useCallback(async (candidate) => {
    const pc = screenPcRef.current;
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const handleScreenOffer = useCallback(async (offer) => {
    console.log('[WebRTC] Received screen share offer');
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote screen track received');
      setRemoteScreenStream(event.streams[0]);
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketHandlers?.emit('interview-screen-ice', { interviewId, candidate: event.candidate });
      }
    };
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketHandlers?.emit('interview-screen-answer', { interviewId, answer });
    screenPcRef.current = pc;
  }, [interviewId, socketHandlers]);

  // Toggles
  const toggleAudio = useCallback(async () => {
    if (!interviewId) return;
    if (!localStreamRef.current) {
      await startMedia({ audio: true, video: isVideoEnabledRef.current });
      return;
    }

    const stream = localStreamRef.current;
    const next = !isAudioEnabledRef.current;

    const existing = stream.getAudioTracks()[0];
    if (existing) {
      // Avoid stopping tracks: stopping can tear down capture and destabilize the peer connection.
      existing.enabled = next;
      setIsAudioEnabled(next);
      isAudioEnabledRef.current = next;
    } else if (next) {
      // If audio track doesn't exist (started muted), request audio-only and attach.
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const track = newStream.getAudioTracks()[0];
      if (track) {
        stream.addTrack(track);
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'audio');
        if (sender) await sender.replaceTrack(track);
        setIsAudioEnabled(true);
        isAudioEnabledRef.current = true;
      }
    }

    socketHandlers?.emit('interview-media-state', {
      interviewId,
      mediaState: { audio: isAudioEnabledRef.current, video: isVideoEnabledRef.current }
    });
  }, [localStream, isAudioEnabled, isVideoEnabled, interviewId, socketHandlers, startMedia]);

  const toggleVideo = useCallback(async () => {
    if (!interviewId) return;
    if (!localStreamRef.current) {
      await startMedia({ audio: isAudioEnabledRef.current, video: true });
      return;
    }

    const stream = localStreamRef.current;
    const next = !isVideoEnabledRef.current;

    const existing = stream.getVideoTracks()[0];
    if (existing) {
      existing.enabled = next;
      setIsVideoEnabled(next);
      isVideoEnabledRef.current = next;
    } else if (next) {
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      const track = newStream.getVideoTracks()[0];
      if (track) {
        stream.addTrack(track);
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(track);
        setIsVideoEnabled(true);
        isVideoEnabledRef.current = true;
      }
    }

    socketHandlers?.emit('interview-media-state', {
      interviewId,
      mediaState: { audio: isAudioEnabledRef.current, video: isVideoEnabledRef.current }
    });
  }, [localStream, isAudioEnabled, isVideoEnabled, interviewId, socketHandlers, startMedia]);

  // Lifecycle
  useEffect(() => {
    if (!socketHandlers?.on) return;
    
    const u1 = socketHandlers.on('webrtc-offer', ({ offer }) => handleOffer(offer));
    const u2 = socketHandlers.on('webrtc-answer', ({ answer }) => handleAnswer(answer));
    const u3 = socketHandlers.on('webrtc-ice', ({ candidate }) => handleIce(candidate));
    const u3b = socketHandlers.on('webrtc-reconnect-request', () => {
      console.log('[WebRTC] Reconnect requested by peer');
      if (role === 'interviewer') initiateCall();
    });
    const u4 = socketHandlers.on('screen-offer', ({ offer }) => handleScreenOffer(offer));
    const u4b = socketHandlers.on('screen-answer', ({ answer }) => handleScreenAnswer(answer));
    const u4c = socketHandlers.on('screen-ice', ({ candidate }) => handleScreenIce(candidate));
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
    const u7b = socketHandlers.on('participant-joined', (data) => {
      console.log('[WebRTC] Participant joined:', data);
      if (role === 'interviewer') {
        if (localStreamRef.current) initiateCall();
        else shouldInitiateRef.current = true;
      }
    });

    const u7c = socketHandlers.on('current-participants', ({ participants }) => {
      console.log('[WebRTC] Current participants in room:', participants);
      // If we join and someone is already there, the interviewer should initiate
      if (role === 'interviewer' && participants.length > 0) {
        if (localStreamRef.current) initiateCall();
        else shouldInitiateRef.current = true;
      }
    });

    const u8 = socketHandlers.on('participant-info', (data) => {
      console.log('[WebRTC] Received participant info:', data);
    });
    
    return () => { u1(); u2(); u3(); u3b(); u4(); u4b(); u4c(); u5(); u6(); u7(); u7b(); u7c(); u8(); };
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
