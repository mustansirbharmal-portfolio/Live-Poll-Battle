import { PollRoom, PollOption, UserVote } from "@shared/schema";

export type Toast = {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
};

export type RecentRoom = {
  id: string;
  question: string;
  hasVoted?: boolean;
};

export interface AppState {
  username: string | null;
  roomId: string | null;
  room: PollRoom | null;
  hasVoted: boolean;
  votedFor: number | null;
  isPollClosed: boolean;
  recentRooms: RecentRoom[];
}
