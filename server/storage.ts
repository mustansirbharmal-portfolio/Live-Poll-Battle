import { 
  users, 
  type User, 
  type InsertUser, 
  type PollRoom, 
  type PollOption, 
  type UserVote 
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Poll room methods
  createRoom(creatorName: string): Promise<PollRoom>;
  getRoom(roomId: string): Promise<PollRoom | undefined>;
  joinRoom(roomId: string, username: string): Promise<PollRoom | undefined>;
  leaveRoom(roomId: string, username: string): Promise<PollRoom | undefined>;
  recordVote(roomId: string, username: string, optionId: number): Promise<{ room: PollRoom, vote: UserVote } | undefined>;
  hasUserVoted(username: string, roomId: string): boolean;
  cleanupExpiredRooms(): void;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<string, PollRoom>;
  private votes: Map<string, UserVote>; // key: username_roomId
  currentId: number;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.votes = new Map();
    this.currentId = 1;
    
    // Start a timer to clean up expired rooms
    setInterval(() => this.cleanupExpiredRooms(), 60000); // Check every minute
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Poll room methods
  
  // Generate a random room ID (6 characters, uppercase + numbers)
  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed confusing chars I, O, 0, 1
    let roomId = '';
    for (let i = 0; i < 6; i++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return roomId;
  }
  
  async createRoom(creatorName: string): Promise<PollRoom> {
    // Generate a unique room ID
    let roomId = this.generateRoomId();
    while (this.rooms.has(roomId)) {
      roomId = this.generateRoomId();
    }
    
    // Create poll options (hardcoded to "Cats vs Dogs" for this assignment)
    const options: PollOption[] = [
      { id: 1, text: 'Cats', votes: 0 },
      { id: 2, text: 'Dogs', votes: 0 }
    ];
    
    // Create the room with a 60-second timer
    const now = new Date();
    const endTime = new Date(now.getTime() + 60000); // 60 seconds
    
    const room: PollRoom = {
      id: roomId,
      question: 'Cats vs Dogs',
      options,
      createdAt: now,
      createdBy: creatorName,
      endTime,
      participants: new Set([creatorName]),
      votes: {}
    };
    
    this.rooms.set(roomId, room);
    return room;
  }
  
  async getRoom(roomId: string): Promise<PollRoom | undefined> {
    return this.rooms.get(roomId);
  }
  
  async joinRoom(roomId: string, username: string): Promise<PollRoom | undefined> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return undefined;
    }
    
    // Add user to participants if not already there
    room.participants.add(username);
    
    return room;
  }
  
  async leaveRoom(roomId: string, username: string): Promise<PollRoom | undefined> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return undefined;
    }
    
    // Remove user from participants
    room.participants.delete(username);
    
    return room;
  }
  
  async recordVote(roomId: string, username: string, optionId: number): Promise<{ room: PollRoom, vote: UserVote } | undefined> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return undefined;
    }
    
    // Check if poll is still active
    if (new Date() > room.endTime) {
      return undefined;
    }
    
    // Check if user already voted in this room
    const voteKey = `${username}_${roomId}`;
    if (this.votes.has(voteKey)) {
      return undefined;
    }
    
    // Find the option
    const option = room.options.find(opt => opt.id === optionId);
    if (!option) {
      return undefined;
    }
    
    // Record the vote
    option.votes++;
    room.votes[username] = optionId;
    
    // Create vote record
    const vote: UserVote = {
      username,
      roomId,
      optionId
    };
    
    this.votes.set(voteKey, vote);
    
    return { room, vote };
  }
  
  hasUserVoted(username: string, roomId: string): boolean {
    const voteKey = `${username}_${roomId}`;
    return this.votes.has(voteKey);
  }
  
  cleanupExpiredRooms(): void {
    const now = new Date();
    
    for (const [roomId, room] of this.rooms.entries()) {
      // Remove rooms that ended more than 30 minutes ago
      if (now.getTime() - room.endTime.getTime() > 30 * 60 * 1000) {
        this.rooms.delete(roomId);
        
        // Clean up related votes
        for (const [voteKey, vote] of this.votes.entries()) {
          if (vote.roomId === roomId) {
            this.votes.delete(voteKey);
          }
        }
      }
    }
  }
}

export const storage = new MemStorage();
