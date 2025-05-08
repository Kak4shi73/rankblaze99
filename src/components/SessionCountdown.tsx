import React, { useEffect, useState } from 'react';

interface SessionCountdownProps {
  remainingTime: number; // in milliseconds
  onTimeout: () => void;
}

const SessionCountdown: React.FC<SessionCountdownProps> = ({ remainingTime, onTimeout }) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(Math.ceil(remainingTime / 1000));
  const [isLastMinute, setIsLastMinute] = useState<boolean>(secondsLeft <= 60);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeout();
      return;
    }

    // Determine update frequency (every minute until last minute, then every second)
    const updateInterval = secondsLeft > 60 && secondsLeft > 120 ? 60000 : 1000;
    const decrementValue = updateInterval === 60000 ? 60 : 1;

    const timer = setTimeout(() => {
      const newValue = secondsLeft - decrementValue;
      setSecondsLeft(newValue);
      
      // Check if we're entering the last minute
      if (newValue <= 60 && !isLastMinute) {
        setIsLastMinute(true);
      }
    }, updateInterval);

    return () => clearTimeout(timer);
  }, [secondsLeft, isLastMinute, onTimeout]);

  // Format the display text
  const formatTimeDisplay = () => {
    if (secondsLeft <= 0) {
      return 'Logging out...';
    }

    if (secondsLeft > 60) {
      const minutes = Math.floor(secondsLeft / 60);
      const seconds = secondsLeft % 60;
      return `Session: ${minutes}m ${seconds}s remaining`;
    } else {
      return `Session: ${secondsLeft}s remaining`;
    }
  };

  return (
    <div
      className={`fixed bottom-3 right-3 p-2 px-3 rounded text-sm font-bold z-50 text-white
        ${isLastMinute ? 'bg-red-800/90' : 'bg-black/70'}`}
    >
      {formatTimeDisplay()}
    </div>
  );
};

export default SessionCountdown; 