import React from 'react';

const StatsBar = ({ viewCount, downloadCount, realtimeViewers = 1 }) => {
  return (
    <div className="stats-bar">
      <span className="stats-item" title="Realtime viewers">
        🟢 {realtimeViewers}
      </span>
      <span className="stats-item" title="Views">
        👁️ {viewCount}
      </span>
      <span className="stats-item" title="Downloads">
        ⬇️ {downloadCount}
      </span>
    </div>
  );
};

export default StatsBar; 