import React from "react";
import { PollOption as PollOptionType } from "@shared/schema";

interface PollOptionProps {
  option: PollOptionType;
  hasVoted: boolean;
  votedFor: number | null;
  totalVotes: number;
  isPollClosed: boolean;
  onVote: (optionId: number) => void;
}

const PollOption: React.FC<PollOptionProps> = ({
  option,
  hasVoted,
  votedFor,
  totalVotes,
  isPollClosed,
  onVote,
}) => {
  const { id, text, votes } = option;
  const isSelected = votedFor === id;
  
  // Calculate percentage (guard against division by zero)
  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  
  // Determine if this option is clickable
  const isClickable = !hasVoted && !isPollClosed;
  
  return (
    <div
      className={`border rounded-lg p-6 transition-all ${
        isClickable ? "cursor-pointer hover:shadow-md" : ""
      } ${isPollClosed ? "opacity-75" : ""}`}
      onClick={() => isClickable && onVote(id)}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-medium">{text}</h3>
        {isSelected && (
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
            Your vote
          </span>
        )}
      </div>
      
      {/* Image based on option id (1 for cats, 2 for dogs) */}
      {id === 1 ? (
        <img
          src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500"
          alt="Cute cat"
          className="w-full h-40 object-cover rounded-md mb-4"
        />
      ) : (
        <img
          src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500"
          alt="Cute dog"
          className="w-full h-40 object-cover rounded-md mb-4"
        />
      )}
      
      {/* Results (only shown after voting) */}
      {hasVoted && (
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">{percentage}%</span>
            <span className="text-sm text-gray-600">{votes} votes</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollOption;
