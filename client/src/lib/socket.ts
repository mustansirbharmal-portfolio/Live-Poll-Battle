import React, { createContext, useContext, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { WebSocketMessage, WebSocketResponse } from '@shared/schema';

// Create WebSocket context
interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketResponse | null;
  sendMessage: (message: WebSocketMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Create provider component
interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider(props: WebSocketProviderProps) {
  const ws = useWebSocket();
  
  // Using React.createElement to avoid JSX parser issues
  return React.createElement(
    WebSocketContext.Provider, 
    { value: ws }, 
    props.children
  );
}

// Custom hook to use WebSocket context
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  
  return context;
};
