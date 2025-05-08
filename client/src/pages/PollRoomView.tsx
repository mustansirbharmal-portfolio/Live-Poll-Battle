import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWebSocketContext } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import CountdownTimer from "@/components/CountdownTimer";
import PollOption from "@/components/PollOption";
import { PollRoom, PollOption as PollOptionType } from "@shared/schema";

interface PollRoomViewProps {
  username: string;
  roomId: string;
  onLeaveRoom: () => void;
}

const PollRoomView: React.FC<PollRoomViewProps> = ({
  username,
  roomId,
  onLeaveRoom,
}) => {
  const [room, setRoom] = useState<PollRoom | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState<number | null>(null);
  const [isPollClosed, setIsPollClosed] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const { isConnected, lastMessage, sendMessage } = useWebSocketContext();
  const { toast } = useToast();

  // Load saved vote from localStorage
  useEffect(() => {
    const savedVote = localStorage.getItem(`vote_${roomId}`);
    if (savedVote) {
      setHasVoted(true);
      setVotedFor(parseInt(savedVote));
    }
  }, [roomId]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "ROOM_JOINED") {
      const { room: newRoom } = lastMessage.payload;
      setRoom(newRoom);
      setParticipantCount(newRoom.participants.size);
      
      // Check if poll is already closed
      const endTime = new Date(newRoom.endTime);
      if (endTime.getTime() < Date.now()) {
        setIsPollClosed(true);
      }
      
      // Check if we already have a vote saved for this room
      const savedVote = localStorage.getItem(`vote_${roomId}`);
      if (savedVote) {
        setHasVoted(true);
        setVotedFor(parseInt(savedVote));
      }
    } 
    else if (lastMessage.type === "ROOM_UPDATE") {
      const { room: updatedRoom } = lastMessage.payload;
      setRoom(updatedRoom);
      setParticipantCount(updatedRoom.participants.size);
    } 
    else if (lastMessage.type === "VOTE_RECORDED") {
      const { room: updatedRoom, vote } = lastMessage.payload;
      setRoom(updatedRoom);
      
      // If it's our vote, mark it as voted
      if (vote.username === username && vote.roomId === roomId) {
        setHasVoted(true);
        setVotedFor(vote.optionId);
        localStorage.setItem(`vote_${roomId}`, vote.optionId.toString());
        
        toast({
          title: "Success!",
          description: "Your vote has been recorded.",
          variant: "success",
        });
        
        // After voting, redirect back to room selection after a brief delay
        setTimeout(() => {
          if (isConnected) {
            sendMessage({
              type: "LEAVE_ROOM",
              payload: { username, roomId },
            });
          }
          onLeaveRoom();
        }, 2000); // 2 second delay to show the success message
      }
    } 
    else if (lastMessage.type === "ERROR") {
      toast({
        title: "Error",
        description: lastMessage.payload.message,
        variant: "destructive",
      });
    }
  }, [lastMessage, roomId, username, toast]);

  // Join the room when component mounts
  useEffect(() => {
    if (isConnected) {
      sendMessage({
        type: "JOIN_ROOM",
        payload: { username, roomId },
      });
    }
    
    // Cleanup: leave room when unmounting
    return () => {
      if (isConnected) {
        sendMessage({
          type: "LEAVE_ROOM",
          payload: { username, roomId },
        });
      }
    };
  }, [isConnected, sendMessage, username, roomId]);
  
  // Handle manually leaving room
  const handleLeaveRoomClick = () => {
    // First send leave room message if connected
    if (isConnected) {
      sendMessage({
        type: "LEAVE_ROOM",
        payload: { username, roomId },
      });
    }
    // Then call the parent component's handler
    onLeaveRoom();
  };

  const handleVote = (optionId: number) => {
    if (!isConnected || hasVoted || isPollClosed) return;

    sendMessage({
      type: "VOTE",
      payload: { username, roomId, optionId },
    });
  };

  const handleTimerComplete = () => {
    setIsPollClosed(true);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
        variant: "success",
      });
      
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Calculate total votes
  const totalVotes = room?.options.reduce((sum, opt) => sum + opt.votes, 0) || 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Room Status Bar with Leave Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="flex items-center text-sm mr-4">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse-slow"></div>
            <span>Live</span>
          </div>
          <div className="text-sm text-gray-600">
            <span>{participantCount}</span> participants
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Leave Room Button */}
          <button 
            onClick={handleLeaveRoomClick}
            className="text-sm text-gray-500 hover:text-red-500 flex items-center px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Leave Room
          </button>
          
          {/* Timer */}
          {room && !isPollClosed && (
            <CountdownTimer
              duration={60}
              onComplete={handleTimerComplete}
            />
          )}
        </div>
      </div>
      
      {/* Poll Content */}
      <Card className="mb-8">
        <CardContent className="px-6 py-8">
          {room ? (
            <>
              {/* Poll Question */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold mb-2">{room.question}</h2>
                <p className="text-gray-600">
                  {!hasVoted && !isPollClosed && (
                    <span className="font-medium text-amber-500">
                      Vote now - time is running out!
                    </span>
                  )}
                  {hasVoted && !isPollClosed && (
                    <span className="font-medium text-gray-600">
                      You have voted
                    </span>
                  )}
                  {isPollClosed && (
                    <span className="font-medium text-gray-600">
                      Poll has ended
                    </span>
                  )}
                </p>
              </div>
              
              {/* Poll Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {room.options.map((option) => (
                  <PollOption
                    key={option.id}
                    option={option}
                    hasVoted={hasVoted}
                    votedFor={votedFor}
                    totalVotes={totalVotes}
                    isPollClosed={isPollClosed}
                    onVote={handleVote}
                  />
                ))}
              </div>
              
              {/* Poll is closed message */}
              {isPollClosed && (
                <div className="mt-8 text-center">
                  <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-amber-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium mb-2">Poll has ended</h3>
                  <p className="text-gray-600">
                    The time limit for this poll has been reached.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading poll data...</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Share Section */}
      <Card>
        <CardContent className="px-6 py-6">
          <h3 className="text-lg font-medium mb-4">Share this poll</h3>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex-grow">
              <div className="flex items-center border rounded-md bg-gray-50 px-3 py-2">
                <span className="text-gray-600 mr-2">Room Code:</span>
                <span className="font-medium text-gray-800">{roomId}</span>
              </div>
            </div>
            <Button
              onClick={copyRoomCode}
              className="inline-flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copied ? "Copied!" : "Copy Code"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PollRoomView;
