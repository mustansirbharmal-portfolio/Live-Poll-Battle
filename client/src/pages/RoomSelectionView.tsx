import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useWebSocketContext } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { RecentRoom } from "@/types";

interface RoomSelectionViewProps {
  username: string;
  onJoinRoom: (roomId: string) => void;
}

const RoomSelectionView: React.FC<RoomSelectionViewProps> = ({
  username,
  onJoinRoom,
}) => {
  const [roomCode, setRoomCode] = useState("");
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const { isConnected, lastMessage, sendMessage } = useWebSocketContext();
  const { toast } = useToast();

  // Load recent rooms from localStorage and check for voted status
  useEffect(() => {
    const savedRooms = localStorage.getItem("recentRooms");
    if (savedRooms) {
      try {
        // Load rooms
        const rooms: RecentRoom[] = JSON.parse(savedRooms);
        
        // Check each room for vote status
        const roomsWithVoteStatus = rooms.map(room => {
          const hasVoted = localStorage.getItem(`vote_${room.id}`) !== null;
          return { 
            ...room, 
            hasVoted // Add a hasVoted property to each room
          };
        });
        
        setRecentRooms(roomsWithVoteStatus);
      } catch (e) {
        console.error("Failed to parse recent rooms:", e);
      }
    }
  }, []);

  // Handle WebSocket responses
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "ROOM_CREATED" || lastMessage.type === "ROOM_JOINED") {
      const { room } = lastMessage.payload;
      
      // Add to recent rooms
      const newRecentRoom: RecentRoom = {
        id: room.id,
        question: room.question,
      };
      
      const updatedRecentRooms = [
        newRecentRoom,
        ...recentRooms.filter((r) => r.id !== room.id).slice(0, 4) // Keep only the 5 most recent
      ];
      
      setRecentRooms(updatedRecentRooms);
      localStorage.setItem("recentRooms", JSON.stringify(updatedRecentRooms));
      
      // Join the room
      onJoinRoom(room.id);
    } else if (lastMessage.type === "ERROR") {
      // Display error message
      toast({
        title: "Error",
        description: lastMessage.payload.message,
        variant: "destructive",
      });
      
      // If the error is about already having voted in a room,
      // tag that room in localStorage so we can show it differently
      if (lastMessage.payload.message.includes("already voted")) {
        const roomIdMatch = lastMessage.payload.message.match(/room\s+([A-Z0-9]+)/i);
        if (roomIdMatch && roomIdMatch[1]) {
          const roomId = roomIdMatch[1];
          const savedRooms = localStorage.getItem("recentRooms");
          
          if (savedRooms) {
            try {
              const rooms: RecentRoom[] = JSON.parse(savedRooms);
              const updatedRooms = rooms.map(room => {
                if (room.id === roomId) {
                  // Tag the room as "voted"
                  localStorage.setItem(`vote_${roomId}`, "true");
                }
                return room;
              });
              
              localStorage.setItem("recentRooms", JSON.stringify(updatedRooms));
            } catch (e) {
              console.error("Failed to update recent rooms:", e);
            }
          }
        }
      }
    }
  }, [lastMessage, onJoinRoom, recentRooms, toast]);

  const handleCreateRoom = () => {
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Not connected to server. Please try again.",
        variant: "destructive",
      });
      return;
    }

    sendMessage({
      type: "CREATE_ROOM",
      payload: { username },
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room code",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Not connected to server. Please try again.",
        variant: "destructive",
      });
      return;
    }

    sendMessage({
      type: "JOIN_ROOM",
      payload: { username, roomId: roomCode.trim().toUpperCase() },
    });
  };

  const handleRejoinRoom = (roomId: string) => {
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Not connected to server. Please try again.",
        variant: "destructive",
      });
      return;
    }

    sendMessage({
      type: "JOIN_ROOM",
      payload: { username, roomId },
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="mb-8">
        <CardContent className="pt-6 px-6 pb-8">
          <h2 className="text-xl font-semibold mb-6">
            Hello, <span className="text-primary">{username}</span>!
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Room Option */}
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                    clipRule="evenodd"
                  />
                </svg>
                Create a New Poll
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Start a new poll room where others can join and vote.
              </p>
              <Button onClick={handleCreateRoom} className="w-full">
                Create Room
              </Button>
            </div>
            
            {/* Join Room Option */}
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Join Existing Poll
              </h3>
              <form onSubmit={handleJoinRoom}>
                <div className="mb-4">
                  <Label
                    htmlFor="room-code"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Room Code
                  </Label>
                  <Input
                    type="text"
                    id="room-code"
                    name="roomCode"
                    placeholder="Enter room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="w-full"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Join Room
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recently Used Rooms */}
      {recentRooms.length > 0 && (
        <Card>
          <CardContent className="px-6 py-6">
            <h3 className="text-lg font-medium mb-4">Recent Rooms</h3>
            <div className="divide-y">
              {recentRooms.map((room) => (
                <div
                  key={room.id}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{room.question}</div>
                    <div className="text-sm text-gray-500">
                      Room: <span>{room.id}</span>
                      {room.hasVoted && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                          Voted
                        </span>
                      )}
                    </div>
                  </div>
                  {room.hasVoted ? (
                    <Button
                      variant="ghost"
                      className="text-gray-400 cursor-not-allowed"
                      disabled
                    >
                      Already Voted
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="text-primary hover:text-primary-foreground hover:bg-primary"
                      onClick={() => handleRejoinRoom(room.id)}
                    >
                      Rejoin
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoomSelectionView;
