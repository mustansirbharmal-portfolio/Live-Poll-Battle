import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginView from "@/pages/LoginView";
import RoomSelectionView from "@/pages/RoomSelectionView";
import PollRoomView from "@/pages/PollRoomView";
import Header from "@/components/Header";
import NotFound from "@/pages/not-found";
import { useWebSocket } from "@/hooks/use-websocket";
import { WebSocketProvider } from "@/lib/socket";

function Router() {
  const [username, setUsername] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  
  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    const savedRoomId = localStorage.getItem("roomId");
    
    if (savedUsername) {
      setUsername(savedUsername);
    }
    
    if (savedRoomId) {
      setRoomId(savedRoomId);
    }
  }, []);
  
  const handleLogin = (newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem("username", newUsername);
  };
  
  const handleJoinRoom = (newRoomId: string) => {
    setRoomId(newRoomId);
    localStorage.setItem("roomId", newRoomId);
  };
  
  const handleLeaveRoom = () => {
    setRoomId(null);
    localStorage.removeItem("roomId");
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Pass Header without onLeaveRoom to PollRoomView since it handles leaving the room itself */}
      {username && roomId ? (
        <Header 
          username={username} 
          roomId={roomId} 
          onLeaveRoom={() => {}} // This is a placeholder, actual handler is in PollRoomView
        />
      ) : (
        <Header 
          username={username} 
          roomId={roomId} 
          onLeaveRoom={handleLeaveRoom} 
        />
      )}
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Switch>
            {!username && <Route path="/" component={() => <LoginView onLogin={handleLogin} />} />}
            
            {username && !roomId && (
              <Route 
                path="/" 
                component={() => <RoomSelectionView username={username} onJoinRoom={handleJoinRoom} />} 
              />
            )}
            
            {username && roomId && (
              <Route 
                path="/" 
                component={() => (
                  <PollRoomView 
                    username={username} 
                    roomId={roomId}
                    onLeaveRoom={handleLeaveRoom} 
                  />
                )} 
              />
            )}
            
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WebSocketProvider>
          <Toaster />
          <Router />
        </WebSocketProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
