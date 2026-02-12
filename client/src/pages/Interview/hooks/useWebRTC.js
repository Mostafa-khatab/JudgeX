import { useState, useRef, useEffect, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export const useWebRTC = (socket, interviewId, isInterviewer) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Initialize media
  const initMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Failed to get media:', err);
      return null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    // Add local tracks
    stream?.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
    
    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('interview-webrtc-ice', {
          interviewId,
          candidate: event.candidate
        });
      }
    };
    
    pc.onconnectionstatechange = () => {
      setIsConnected(pc.connectionState === 'connected');
    };
    
    peerConnection.current = pc;
    return pc;
  }, [socket, interviewId]);

  // Start call (Interviewer initiates)
  const startCall = useCallback(async () => {
    const stream = await initMedia();
    if (!stream) return;
    
    const pc = createPeerConnection(stream);
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socket?.emit('interview-webrtc-offer', {
      interviewId,
      offer
    });
  }, [initMedia, createPeerConnection, socket, interviewId]);

  // Handle incoming offer
  const handleOffer = useCallback(async (offer) => {
    const stream = await initMedia();
    if (!stream) return;
    
    const pc = createPeerConnection(stream);
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socket?.emit('interview-webrtc-answer', {
      interviewId,
      answer
    });
  }, [initMedia, createPeerConnection, socket, interviewId]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (answer) => {
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (candidate) => {
    if (peerConnection.current) {
      await peerConnection.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(prev => !prev);
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(prev => !prev);
    }
  }, [localStream]);

  // End call
  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setRemoteStream(null);
    setIsConnected(false);
  }, [localStream]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    socket.on('webrtc-offer', ({ offer }) => {
      handleOffer(offer);
    });
    
    socket.on('webrtc-answer', ({ answer }) => {
      handleAnswer(answer);
    });
    
    socket.on('webrtc-ice', ({ candidate }) => {
      handleIceCandidate(candidate);
    });
    
    return () => {
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice');
    };
  }, [socket, handleOffer, handleAnswer, handleIceCandidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isAudioEnabled,
    isVideoEnabled,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo
  };
};

export default useWebRTC;
