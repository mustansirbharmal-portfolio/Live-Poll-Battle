import { useState, useEffect, useRef, useCallback } from "react";
import { WebSocketMessage, WebSocketResponse } from "@shared/schema";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketResponse | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    // Connect to WebSocket server
    // For production: Connect to backend deployed on Render
    // For development: Connect to local backend
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
    
    let wsUrl;
    if (BACKEND_URL && import.meta.env.PROD) {
      // In production with backend URL set
      const protocol = BACKEND_URL.startsWith('https') ? 'wss:' : 'ws:';
      const host = BACKEND_URL.replace('https://', '').replace('http://', '');
      wsUrl = `${protocol}//${host}/ws`;
    } else {
      // In development or no backend URL (uses same origin)
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }
    
    const ws = new WebSocket(wsUrl);
    webSocketRef.current = ws;
    
    // Setup WebSocket event handlers
    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };
    
    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketResponse;
        setLastMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };
    
    // Clean up WebSocket connection on unmount
    return () => {
      ws.close();
    };
  }, []);
  
  // Function to send messages to the WebSocket server
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }, []);
  
  return { isConnected, lastMessage, sendMessage };
}
