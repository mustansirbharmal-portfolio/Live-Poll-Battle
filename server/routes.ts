import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { WebSocketMessage, WebSocketResponse } from "@shared/schema";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server on a distinct path
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });
  
  // Store client connections with their associated usernames and rooms
  const clients = new Map<WebSocket, { username?: string, roomId?: string }>();
  
  wss.on('connection', (ws) => {
    log("WebSocket connected", "socket");
    
    // Add client to map
    clients.set(ws, {});
    
    // Handle messages from client
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        log(`Received message: ${JSON.stringify(message)}`, "socket");
        
        // Handle different message types
        switch (message.type) {
          case 'CREATE_ROOM': {
            const { username } = message.payload;
            
            // Create a new room
            const room = await storage.createRoom(username);
            
            // Update client tracking
            clients.set(ws, { username, roomId: room.id });
            
            // Send response
            const response: WebSocketResponse = {
              type: 'ROOM_CREATED',
              payload: { room }
            };
            
            ws.send(JSON.stringify(response));
            
            log(`Room created: ${room.id} by ${username}`, "socket");
            break;
          }
          
          case 'JOIN_ROOM': {
            const { username, roomId } = message.payload;
            
            // Check if room exists
            const room = await storage.getRoom(roomId);
            
            if (!room) {
              const response: WebSocketResponse = {
                type: 'ERROR',
                payload: { message: `Room ${roomId} does not exist` }
              };
              ws.send(JSON.stringify(response));
              break;
            }
            
            // Check if user has already voted in this room
            const voteKey = `${username}_${roomId}`;
            const hasVoted = storage.hasUserVoted(username, roomId);
            
            if (hasVoted) {
              const response: WebSocketResponse = {
                type: 'ERROR',
                payload: { message: `You have already voted in room ${roomId}` }
              };
              ws.send(JSON.stringify(response));
              break;
            }
            
            // Join the room
            const updatedRoom = await storage.joinRoom(roomId, username);
            
            // Update client tracking
            clients.set(ws, { username, roomId });
            
            // Send response to the client
            const response: WebSocketResponse = {
              type: 'ROOM_JOINED',
              payload: { room: updatedRoom! }
            };
            
            ws.send(JSON.stringify(response));
            
            // Notify all clients in the room
            broadcastToRoom(updatedRoom!, ws);
            
            log(`${username} joined room: ${roomId}`, "socket");
            break;
          }
          
          case 'LEAVE_ROOM': {
            const { username, roomId } = message.payload;
            
            // Check if room exists
            const room = await storage.getRoom(roomId);
            
            if (!room) {
              const response: WebSocketResponse = {
                type: 'ROOM_LEFT',
                payload: { roomId }
              };
              ws.send(JSON.stringify(response));
              break;
            }
            
            // Leave the room
            const updatedRoom = await storage.leaveRoom(roomId, username);
            
            // Update client tracking
            clients.set(ws, { username });
            
            // Send response to the client
            const response: WebSocketResponse = {
              type: 'ROOM_LEFT',
              payload: { roomId }
            };
            
            ws.send(JSON.stringify(response));
            
            // Notify all clients in the room
            if (updatedRoom) {
              broadcastToRoom(updatedRoom);
            }
            
            log(`${username} left room: ${roomId}`, "socket");
            break;
          }
          
          case 'VOTE': {
            const { username, roomId, optionId } = message.payload;
            
            // Record the vote
            const result = await storage.recordVote(roomId, username, optionId);
            
            if (!result) {
              const response: WebSocketResponse = {
                type: 'ERROR',
                payload: { message: 'Failed to record vote. The poll may be closed or you may have already voted.' }
              };
              ws.send(JSON.stringify(response));
              break;
            }
            
            // Send response to the client
            const response: WebSocketResponse = {
              type: 'VOTE_RECORDED',
              payload: { room: result.room, vote: result.vote }
            };
            
            ws.send(JSON.stringify(response));
            
            // Notify all clients in the room
            broadcastToRoom(result.room);
            
            log(`${username} voted for option ${optionId} in room: ${roomId}`, "socket");
            break;
          }
          
          default:
            log(`Unknown message type: ${(message as any).type}`, "socket");
        }
      } catch (error) {
        console.error('Error processing message:', error);
        
        // Send error response
        const response: WebSocketResponse = {
          type: 'ERROR',
          payload: { message: 'Invalid message format' }
        };
        
        ws.send(JSON.stringify(response));
      }
    });
    
    // Handle client disconnection
    ws.on('close', async () => {
      const clientInfo = clients.get(ws);
      
      if (clientInfo && clientInfo.username && clientInfo.roomId) {
        // Leave any room the client was in
        const room = await storage.getRoom(clientInfo.roomId);
        
        if (room) {
          const updatedRoom = await storage.leaveRoom(clientInfo.roomId, clientInfo.username);
          
          // Notify remaining clients
          if (updatedRoom) {
            broadcastToRoom(updatedRoom);
          }
          
          log(`${clientInfo.username} disconnected from room: ${clientInfo.roomId}`, "socket");
        }
      }
      
      // Remove client from map
      clients.delete(ws);
      log("WebSocket disconnected", "socket");
    });
  });
  
  // Function to broadcast room updates to all clients in a room
  function broadcastToRoom(room: any, excludeClient?: WebSocket) {
    const roomUpdate: WebSocketResponse = {
      type: 'ROOM_UPDATE',
      payload: { room }
    };
    
    const message = JSON.stringify(roomUpdate);
    
    for (const [client, info] of clients.entries()) {
      if (client !== excludeClient && 
          client.readyState === WebSocket.OPEN && 
          info.roomId === room.id) {
        client.send(message);
      }
    }
  }

  return httpServer;
}
