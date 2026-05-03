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

// Max auto-reconnect attempts before giving up
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAYS = [1000, 3000, 7000]; // Exponential backoff

export const useWebRTC = (socketHandlers, interviewId, role) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [remoteMediaState, setRemoteMediaState] = useState({ audio: true, video: true });
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
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

  // Reconnect tracking
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Cleanup reconnect timer on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, []);

  // ============ Track Recovery ============
  // When the browser kills a track (e.g. device disconnect, permission revoke),
  // attempt to re-acquire it automatically.
  const attachTrackRecovery = useCallback((stream) => {
    if (!stream) return;

    stream.getTracks().forEach((track) => {
      track.onended = async () => {
        console.warn(`[WebRTC] Track ended unexpectedly: ${track.kind}. Attempting recovery...`);
        try {
          const constraints = track.kind === 'audio' ? { audio: true, video: false } : { audio: false, video: true };
          const newStream = await navigator.mediaDevices.getUserMedia(constraints);
          const newTrack = newStream.getTracks()[0];
          if (!newTrack) return;

          // Replace in the local stream
          const currentStream = localStreamRef.current;
          if (currentStream) {
            // Remove old ended track
            const oldTrack = currentStream.getTracks().find(t => t.kind === track.kind);
            if (oldTrack) currentStream.removeTrack(oldTrack);
            currentStream.addTrack(newTrack);
          }

          // Replace in peer connection sender
          const sender = pcRef.current?.getSenders().find(s => s.track?.kind === track.kind || (!s.track && track.kind === 'audio'));
          if (sender) {
            try {
              await sender.replaceTrack(newTrack);
            } catch (err) {
              console.warn('[WebRTC] Failed to replace track on sender:', err);
            }
          }

          // Attach recovery to the new track too
          newTrack.onended = track.onended;

          if (track.kind === 'audio') {
            setIsAudioEnabled(true);
            isAudioEnabledRef.current = true;
          } else {
            setIsVideoEnabled(true);
            isVideoEnabledRef.current = true;
          }

          console.log(`[WebRTC] Track ${track.kind} recovered successfully`);
        } catch (err) {
          console.error(`[WebRTC] Failed to recover ${track.kind} track:`, err);
          if (track.kind === 'audio') {
            setIsAudioEnabled(false);
            isAudioEnabledRef.current = false;
          } else {
            setIsVideoEnabled(false);
            isVideoEnabledRef.current = false;
          }
        }
      };
    });
  }, []);

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
          // Stop unwanted tracks to release hardware light
          if (!wantAudio) {
            existingStream.getAudioTracks().forEach(t => { t.stop(); existingStream.removeTrack(t); });
          }
          if (!wantVideo) {
            existingStream.getVideoTracks().forEach(t => { t.stop(); existingStream.removeTrack(t); });
          }

          setLocalStream(existingStream);
          localStreamRef.current = existingStream;
          setIsAudioEnabled(wantAudio);
          setIsVideoEnabled(wantVideo);
          isAudioEnabledRef.current = wantAudio;
          isVideoEnabledRef.current = wantVideo;
          attachTrackRecovery(existingStream);

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
      attachTrackRecovery(stream);

      // Kick presence signaling again now that media is ready.
      if (interviewId) socketHandlers?.emit('participant-request', { interviewId });
      if (role === 'interviewer') shouldInitiateRef.current = true;

      return stream;
    } catch (err) {
      console.error('[WebRTC] Failed to get media:', err);
      toast.error('Failed to access camera/microphone');
      return null;
    }
  }, [interviewId, role, socketHandlers, attachTrackRecovery]);

  const createPeerConnection = useCallback((stream) => {
    if (pcRef.current) {
      try { pcRef.current.close(); } catch { /* ignore */ }
    }

    // Reset ICE queue for fresh connection
    iceQueue.current = [];
    isRemoteDescriptionSet.current = false;
    
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
      const state = pc.iceConnectionState;

      if (state === 'connected' || state === 'completed') {
        setIsConnected(true);
        setIsReconnecting(false);
        reconnectAttemptsRef.current = 0; // Reset attempts on success
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      } else if (state === 'disconnected') {
        setIsConnected(false);
        // Start auto-reconnect with backoff
        handleAutoReconnect();
      } else if (state === 'failed') {
        setIsConnected(false);
        // Immediate reconnect attempt
        handleAutoReconnect();
      } else if (state === 'closed') {
        setIsConnected(false);
        setIsReconnecting(false);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Peer Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        handleAutoReconnect();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [interviewId, socketHandlers]);

  // Auto-reconnect with exponential backoff
  const handleAutoReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return; // Already scheduled

    const attempt = reconnectAttemptsRef.current;
    if (attempt >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('[WebRTC] Max reconnect attempts reached. Manual reconnect required.');
      setIsReconnecting(false);
      toast.error('Connection lost. Click reconnect to try again.');
      return;
    }

    const delay = RECONNECT_DELAYS[attempt] || 7000;
    console.log(`[WebRTC] Auto-reconnect attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`);
    setIsReconnecting(true);

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      reconnectAttemptsRef.current = attempt + 1;

      // Emit reconnect request to peer
      socketHandlers?.emit('interview-webrtc-reconnect', { interviewId });

      // If we're the interviewer, initiate the call directly
      if (role === 'interviewer' && localStreamRef.current) {
        initiateCall();
      }
    }, delay);
  }, [interviewId, socketHandlers, role]);

  const initiateCall = useCallback(async () => {
    console.log('[WebRTC] Manual/Auto initiating call (ICE Restart)...');
    
    // Close existing PC if any
    if (pcRef.current) {
      try { pcRef.current.close(); } catch { /* ignore */ }
      pcRef.current = null;
    }

    const stream = localStreamRef.current || await startMedia();
    if (!stream) {
      console.error('[WebRTC] Cannot initiate call without local stream');
      return;
    }

    const pc = createPeerConnection(stream);
    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      
      console.log('[WebRTC] Sending Offer to peer...');
      socketHandlers?.emit('interview-webrtc-offer', {
        interviewId,
        offer
      });
    } catch (err) {
      console.error('[WebRTC] Failed to create/set offer:', err);
    }
  }, [startMedia, createPeerConnection, interviewId, socketHandlers]);

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
    try {
      let pc = pcRef.current;
      if (!pc) {
        const stream = localStreamRef.current || await startMedia({
          audio: isAudioEnabledRef.current,
          video: isVideoEnabledRef.current
        });
        pc = createPeerConnection(stream);
      } else if (pc.signalingState !== 'stable') {
        console.warn('[WebRTC] Offer glare detected. signalingState:', pc.signalingState);
        if (role === 'interviewer') return; 
      }
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      isRemoteDescriptionSet.current = true;
      
      while (iceQueue.current.length > 0) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(iceQueue.current.shift()));
        } catch (err) {
          console.warn('[WebRTC] Failed to add queued ICE candidate:', err);
        }
      }
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketHandlers?.emit('interview-webrtc-answer', { interviewId, answer });
    } catch (err) {
      console.error('[WebRTC] Failed to handle offer:', err);
    }
  }, [startMedia, createPeerConnection, interviewId, socketHandlers, role]);

  const handleAnswer = useCallback(async (answer) => {
    try {
      if (pcRef.current) {
        if (pcRef.current.signalingState !== 'have-local-offer') {
          console.warn(`[WebRTC] Ignored answer. signalingState is ${pcRef.current.signalingState}`);
          return;
        }
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        isRemoteDescriptionSet.current = true;
        while (iceQueue.current.length > 0) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(iceQueue.current.shift()));
          } catch (err) {
            console.warn('[WebRTC] Failed to add queued ICE candidate:', err);
          }
        }
      }
    } catch (err) {
      console.error('[WebRTC] Failed to handle answer:', err);
    }
  }, []);

  const handleIce = useCallback(async (candidate) => {
    try {
      if (pcRef.current && isRemoteDescriptionSet.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        iceQueue.current.push(candidate);
      }
    } catch (err) {
      console.warn('[WebRTC] Failed to add ICE candidate:', err);
      // Queue it for later if it fails
      if (!isRemoteDescriptionSet.current) {
        iceQueue.current.push(candidate);
      }
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
      try { screenPcRef.current.close(); } catch { /* ignore */ }
      screenPcRef.current = null;
    }
    setIsScreenSharing(false);
    socketHandlers?.emit('interview-screen-stopped', { interviewId });
  }, [screenStream, interviewId, socketHandlers]);

  const handleScreenAnswer = useCallback(async (answer) => {
    try {
      if (screenPcRef.current) {
        await screenPcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.warn('[WebRTC] Failed to handle screen answer:', err);
    }
  }, []);

  const handleScreenIce = useCallback(async (candidate) => {
    try {
      const pc = screenPcRef.current;
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.warn('[WebRTC] Failed to add screen ICE candidate:', err);
    }
  }, []);

  const handleScreenOffer = useCallback(async (offer) => {
    try {
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
    } catch (err) {
      console.error('[WebRTC] Failed to handle screen offer:', err);
    }
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
      if (!next) {
        existing.stop();
        stream.removeTrack(existing);
        setIsAudioEnabled(false);
        isAudioEnabledRef.current = false;
      }
    } else if (next) {
      // If audio track doesn't exist (started muted), request audio-only and attach.
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const track = newStream.getAudioTracks()[0];
        if (track) {
          stream.addTrack(track);
          // Attach recovery
          track.onended = async () => {
            console.warn('[WebRTC] Audio track ended, recovering...');
            try {
              const recoveryStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
              const newTrack = recoveryStream.getAudioTracks()[0];
              if (newTrack && localStreamRef.current) {
                const old = localStreamRef.current.getAudioTracks()[0];
                if (old) localStreamRef.current.removeTrack(old);
                localStreamRef.current.addTrack(newTrack);
                const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'audio');
                if (sender) await sender.replaceTrack(newTrack);
              }
            } catch (e) {
              console.error('[WebRTC] Audio recovery failed:', e);
            }
          };

          const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'audio');
          if (sender) {
            try { await sender.replaceTrack(track); } catch { /* ignore */ }
          } else {
            // Add track to peer connection if no sender exists
            pcRef.current?.addTrack(track, stream);
            // Trigger renegotiation so the remote peer receives the new track
            if (isConnected) initiateCall();
          }
          setIsAudioEnabled(true);
          isAudioEnabledRef.current = true;
        }
      } catch (err) {
        console.error('[WebRTC] Failed to acquire audio:', err);
        toast.error('Could not access microphone');
        return;
      }
    }

    socketHandlers?.emit('interview-media-state', {
      interviewId,
      mediaState: { audio: isAudioEnabledRef.current, video: isVideoEnabledRef.current }
    });
  }, [localStream, isAudioEnabled, isVideoEnabled, interviewId, socketHandlers, startMedia, isConnected, initiateCall]);

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
      if (!next) {
        existing.stop();
        stream.removeTrack(existing);
        setIsVideoEnabled(false);
        isVideoEnabledRef.current = false;
      }
    } else if (next) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        const track = newStream.getVideoTracks()[0];
        if (track) {
          stream.addTrack(track);
          // Attach recovery
          track.onended = async () => {
            console.warn('[WebRTC] Video track ended, recovering...');
            try {
              const recoveryStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
              const newTrack = recoveryStream.getVideoTracks()[0];
              if (newTrack && localStreamRef.current) {
                const old = localStreamRef.current.getVideoTracks()[0];
                if (old) localStreamRef.current.removeTrack(old);
                localStreamRef.current.addTrack(newTrack);
                const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
                if (sender) await sender.replaceTrack(newTrack);
              }
            } catch (e) {
              console.error('[WebRTC] Video recovery failed:', e);
            }
          };

          const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            try { await sender.replaceTrack(track); } catch { /* ignore */ }
          } else {
            pcRef.current?.addTrack(track, stream);
            if (isConnected) initiateCall();
          }
          setIsVideoEnabled(true);
          isVideoEnabledRef.current = true;
        }
      } catch (err) {
        console.error('[WebRTC] Failed to acquire video:', err);
        toast.error('Could not access camera');
        return;
      }
    }

    socketHandlers?.emit('interview-media-state', {
      interviewId,
      mediaState: { audio: isAudioEnabledRef.current, video: isVideoEnabledRef.current }
    });
  }, [localStream, isAudioEnabled, isVideoEnabled, interviewId, socketHandlers, startMedia, isConnected, initiateCall]);

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
    isReconnecting, remoteMediaState,
    isScreenSharing, screenStream, remoteScreenStream,
    startMedia, createPeerConnection, initiateCall,
    toggleAudio, toggleVideo,
    startScreenShare, stopScreenShare
  };
};

export default useWebRTC;
