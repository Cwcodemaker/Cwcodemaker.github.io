import { useEffect, useRef } from 'react';
import { WebSocketClient } from '@/lib/websocket';

export function useWebSocket(userId: string | null) {
  const wsRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    if (!userId) return;

    wsRef.current = new WebSocketClient(userId);

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [userId]);

  const on = (type: string, callback: (data: any) => void) => {
    if (wsRef.current) {
      wsRef.current.on(type, callback);
    }
  };

  const off = (type: string) => {
    if (wsRef.current) {
      wsRef.current.off(type);
    }
  };

  const send = (message: any) => {
    if (wsRef.current) {
      wsRef.current.send(message);
    }
  };

  return { on, off, send };
}
