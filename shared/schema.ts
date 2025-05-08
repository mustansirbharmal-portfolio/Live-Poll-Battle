import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Custom types for the poll application
export interface PollRoom {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: Date;
  createdBy: string;
  endTime: Date;
  participants: Set<string>;
  votes: Record<string, number>;
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface UserVote {
  username: string;
  roomId: string;
  optionId: number;
}

// WebSocket message types
export type WebSocketMessage = 
  | { type: 'CREATE_ROOM', payload: { username: string } }
  | { type: 'JOIN_ROOM', payload: { username: string, roomId: string } }
  | { type: 'LEAVE_ROOM', payload: { username: string, roomId: string } }
  | { type: 'VOTE', payload: { username: string, roomId: string, optionId: number } };

export type WebSocketResponse =
  | { type: 'ROOM_CREATED', payload: { room: PollRoom } }
  | { type: 'ROOM_JOINED', payload: { room: PollRoom } }
  | { type: 'ROOM_LEFT', payload: { roomId: string } }
  | { type: 'VOTE_RECORDED', payload: { room: PollRoom, vote: UserVote } }
  | { type: 'ROOM_UPDATE', payload: { room: PollRoom } }
  | { type: 'ERROR', payload: { message: string } };
