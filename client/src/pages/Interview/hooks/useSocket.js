import { useEffect, useRef, useCallback, useState } from 'react';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const useSocket = (interviewId, role, userInfo) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Memoize userInfo fields to avoid unnecessary re-connections
  const userInfoStr = JSON.stringify(userInfo);

  const connect = useCallback(() => {
    if (socketRef.current?.connected || isConnecting) return;

    setIsConnecting(true);

    socketRef.current = io(API_URL, {
      withCredentials: true,
      transports: ['websocket'],
      auth: {
        inviteToken: localStorage.getItem('candidateToken') || userInfo?.inviteToken
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current.on('connect', () => {
      console.log('[Socket] Connected:', socketRef.current.id);
      setIsConnected(true);
      setIsConnecting(false);
      
      const info = JSON.parse(userInfoStr || '{}');
      socketRef.current.emit('join-interview', {
        interviewId,
        role,
        ...info
      });
      socketRef.current.emit('participant-request', { interviewId });
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setIsConnecting(false);
      setIsConnected(false);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      setIsConnected(false);
      setIsConnecting(false);
    });

    return socketRef.current;
  }, [interviewId, role, userInfoStr]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`[Socket] Cannot emit ${event}, not connected.`);
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
    return () => socketRef.current?.off(event, callback);
  }, []);

  useEffect(() => {
    if (interviewId) {
      connect();
    }
    return () => disconnect();
  }, [interviewId, connect, disconnect]);

  return {
    socket: socketRef.current,
    emit,
    on,
    isConnected,
    isConnecting
  };
};

export default useSocket;
