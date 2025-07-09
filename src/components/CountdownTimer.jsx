import React, { useEffect, useState } from 'react';

function getTimeRemaining(expiresAt) {
  const total = Date.parse(expiresAt) - Date.now();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)));
  return { total, hours, minutes, seconds };
}

const CountdownTimer = ({ expiresAt }) => {
  const [time, setTime] = useState(getTimeRemaining(expiresAt));

  useEffect(() => {
    if (time.total <= 0) return;
    const interval = setInterval(() => {
      setTime(getTimeRemaining(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, time.total]);

  if (time.total <= 0) {
    return <span className="countdown-expired">Expired</span>;
  }

  return (
    <span className="countdown-timer">
      {String(time.hours).padStart(2, '0')}:
      {String(time.minutes).padStart(2, '0')}:
      {String(time.seconds).padStart(2, '0')}
    </span>
  );
};

export default CountdownTimer; 