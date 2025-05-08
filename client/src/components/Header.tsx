import React from "react";

interface HeaderProps {
  username: string | null;
  roomId: string | null;
  onLeaveRoom: () => void;
}

const Header: React.FC<HeaderProps> = ({ username, roomId, onLeaveRoom }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-primary">Live Poll Battle</h1>
          
          {username && roomId && (
            <div id="room-info">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Room:</span>
                <span className="font-medium bg-gray-100 px-3 py-1 rounded-md text-gray-700">
                  {roomId}
                </span>
                <button 
                  onClick={onLeaveRoom}
                  className="text-sm text-gray-500 hover:text-red-500 flex items-center"
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
                  Leave
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
