import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

const LiveUserCounter = () => {
  const [userCount, setUserCount] = useState(0);
  const minUsers = 1500;
  const maxUsers = 3500;

  useEffect(() => {
    // Set initial count
    const initialCount = Math.floor(Math.random() * (maxUsers - minUsers + 1)) + minUsers;
    setUserCount(initialCount);

    // Update count periodically
    const interval = setInterval(() => {
      setUserCount(prevCount => {
        // Random fluctuation between -5 and +8 users
        const change = Math.floor(Math.random() * 14) - 5;
        const newCount = prevCount + change;

        // Keep count within bounds
        if (newCount < minUsers) return minUsers;
        if (newCount > maxUsers) return maxUsers;
        return newCount;
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700">
      <div className="relative">
        <Users className="h-5 w-5 text-green-400" />
        <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-400 rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-400 rounded-full" />
      </div>
      <span className="ml-2 text-sm font-medium text-green-400">
        {userCount.toLocaleString()} online
      </span>
    </div>
  );
};

export default LiveUserCounter;