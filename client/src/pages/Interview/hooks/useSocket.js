import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const useSocket = (interviewId, role, userInfo) => {
  const socketRef = useRef(null);
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    // Prevent multiple connection attempts
    if (socketRef.current?.connected || isConnectingRef.current) return;

    isConnectingRef.current = true;

    socketRef.current = io(API_URL, {
      withCredentials: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current.on('connect', () => {
      console.log('[Socket] Connected:', socketRef.current.id);
      isConnectingRef.current = false;
      socketRef.current.emit('join-interview', {
        interviewId,
        role,
        ...userInfo
      });
      // Initial presence query
      socketRef.current.emit('participant-request', { interviewId });
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      isConnectingRef.current = false;
    });

    socketRef.current.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      isConnectingRef.current = false;
    });

    socketRef.current.on('reconnect_attempt', () => {
      console.log('[Socket] Reconnecting...');
    });

    return socketRef.current;
  }, [interviewId, role, userInfo]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    isConnectingRef.current = false;
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
    isConnected: socketRef.current?.connected || false,
    isConnecting: isConnectingRef.current
  };
};

export default useSocket;
