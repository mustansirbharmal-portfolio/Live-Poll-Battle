# Live Poll Battle

A real-time poll application where users can create rooms, vote, and see live results with a 60-second timer.

## Setup Instructions

### Prerequisites
- Node.js (v16 or above)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/live-poll-battle.git
   cd live-poll-battle
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the application:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Features Implemented

### User Authentication
- Simple username-based authentication without passwords
- Persistent sessions using localStorage

### Poll Room Management
- Create new poll rooms with unique 6-character codes
- Join existing rooms using room codes
- Room access control to prevent rejoining after voting
- Real-time participant count and live updates

### Voting System
- Real-time vote submission and result updates
- Prevention of duplicate votes from the same user
- Visual feedback on vote submission
- Automatic redirection after voting
- Local storage persistence for vote status

### User Interface
- Clean, responsive design using Tailwind CSS and shadcn/ui
- Live countdown timer with visual indicators
- Clear status indicators for vote states
- Room code sharing with copy-to-clipboard functionality
- Recent rooms list with vote status tracking

### Real-time Features
- WebSocket integration for instant updates across clients
- Live participant counting
- Real-time vote tallying and results display
- 60-second countdown timer synchronized across clients

### Session Management
- Room and vote data persistence across page reloads
- Historical room tracking for easy rejoins
- Prevention of rejoining rooms where user has already voted

## Architecture and Implementation

### Vote State Sharing and Room Management

The application uses a client-server architecture with WebSockets for real-time communication. 

On the server side, an in-memory storage system manages poll rooms and votes using Maps for efficient lookups. Each room has a unique ID, participant list, and vote tracking. The server is responsible for:
1. Creating and managing poll rooms
2. Tracking participants
3. Validating and recording votes
4. Broadcasting real-time updates to all clients in a room
5. Enforcing business rules (preventing duplicate votes, limiting room access)

Vote state is shared across clients through WebSocket messages, which notify all room participants of events like:
- New participants joining
- Votes being cast
- Poll status changes

The client maintains local state for the UI while relying on the server as the single source of truth. When a user takes an action (joining a room, casting a vote), the client sends a message to the server, which processes the request and broadcasts the updated state to all connected clients.

For persistence across page reloads, the application uses localStorage to store:
- The user's username
- Current room ID
- Vote history
- Recent rooms list

This architecture enables a seamless real-time experience where all participants can see poll results update instantly while maintaining data consistency and preventing invalid operations like duplicate voting.