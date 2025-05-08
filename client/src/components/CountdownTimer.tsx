import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  duration: number; // in seconds
  onComplete: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  duration,
  onComplete,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const circumference = 2 * Math.PI * 28; // 2πr where r=28
  const [offset, setOffset] = useState(0);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    // Check if timer is already expired
    if (timeRemaining <= 0) {
      // Use setTimeout to avoid React warning about setState during render
      setTimeout(() => {
        onComplete();
      }, 0);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onComplete]);

  useEffect(() => {
    // Update circle progress
    const newOffset = circumference - (timeRemaining / duration) * circumference;
    setOffset(newOffset);

    // Change color when time is running out
    if (timeRemaining <= 10 && !isWarning) {
      setIsWarning(true);
    }
  }, [timeRemaining, duration, circumference, isWarning]);

  return (
    <div className="timer-circle w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke={isWarning ? "#ef4444" : "#f59e0b"}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={`absolute font-semibold ${isWarning ? "text-red-500" : "text-amber-500"}`}>
        {timeRemaining}
      </div>
    </div>
  );
};

export default CountdownTimer;
