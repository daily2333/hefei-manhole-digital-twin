import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { runtimeConfig } from '../config/runtimeConfig';

const SOCKET_URL = runtimeConfig.wsUrl;

interface RealtimeUpdate {
  manholeId: string;
  data: Record<string, unknown>;
}

interface AlarmEvent {
  id: string;
  manholeId: string;
  type: string;
  level: string;
  message: string;
}

type UpdateHandler = (update: RealtimeUpdate) => void;
type AlarmHandler = (alarm: AlarmEvent) => void;

let globalSocket: Socket | null = null;
const subscribers = new Map<string, Set<(...args: unknown[]) => void>>();

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    globalSocket.on('connect', () => {
      console.log('[socket] connected');
    });

    globalSocket.on('disconnect', () => {
      console.log('[socket] disconnected');
    });

    globalSocket.on('realtime:global', (data: RealtimeUpdate) => {
      const handlers = subscribers.get('realtime:global');
      if (handlers) handlers.forEach((h) => h(data));
    });

    globalSocket.on('alarm:new', (data: AlarmEvent) => {
      const handlers = subscribers.get('alarm:new');
      if (handlers) handlers.forEach((h) => h(data));
    });
  }
  return globalSocket;
}

export function useRealtimeSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = getSocket();
    return () => {
      // socket is global, don't disconnect
    };
  }, []);

  const subscribe = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    if (!subscribers.has(event)) subscribers.set(event, new Set());
    subscribers.get(event)!.add(handler);
    return () => {
      subscribers.get(event)?.delete(handler);
    };
  }, []);

  const onRealtimeUpdate = useCallback((handler: UpdateHandler) => {
    return subscribe('realtime:global', handler as (...args: unknown[]) => void);
  }, [subscribe]);

  const onNewAlarm = useCallback((handler: AlarmHandler) => {
    return subscribe('alarm:new', handler as (...args: unknown[]) => void);
  }, [subscribe]);

  const joinManhole = useCallback((manholeId: string) => {
    getSocket().emit('join', `manhole:${manholeId}`);
  }, []);

  const leaveManhole = useCallback((manholeId: string) => {
    getSocket().emit('leave', `manhole:${manholeId}`);
  }, []);

  return { onRealtimeUpdate, onNewAlarm, joinManhole, leaveManhole };
}
