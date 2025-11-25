
import React from 'react';
import { useUxCall } from './hooks/useUxCall';

interface Props {
  onCall: (type: 'audio' | 'video') => void;
  disabled?: boolean;
}

const UxCall_Button: React.FC<Props> = ({ onCall, disabled }) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onCall('audio')}
        disabled={disabled}
        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition disabled:opacity-50"
        title="Voice Call"
      >
        <i className="fas fa-phone"></i>
      </button>
      <button
        onClick={() => onCall('video')}
        disabled={disabled}
        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition disabled:opacity-50"
        title="Video Call"
      >
        <i className="fas fa-video"></i>
      </button>
    </div>
  );
};

export default UxCall_Button;
