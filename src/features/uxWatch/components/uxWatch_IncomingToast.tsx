
import React from 'react';

interface Props {
  hostName?: string;
  visible: boolean;
  type?: 'watch-party' | 'screen-share';
  onJoin: () => void;
  onDismiss: () => void;
}

const UxWatch_IncomingToast: React.FC<Props> = ({ hostName = 'Partner', visible, type = 'watch-party', onJoin, onDismiss }) => {
  if (!visible) return null;

  const isScreenShare = type === 'screen-share';

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[120] bg-gray-900 border border-indigo-500 shadow-2xl rounded-xl p-4 flex items-center gap-4 animate-bounce-in w-[90%] max-w-sm">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center animate-pulse ${isScreenShare ? 'bg-teal-600' : 'bg-indigo-600'}`}>
            <span className="text-2xl">{isScreenShare ? '🖥️' : '🍿'}</span>
        </div>
        <div className="flex-1">
            <h4 className="text-white font-bold">{hostName}</h4>
            <p className="text-gray-300 text-xs">
              {isScreenShare ? "started sharing their screen!" : "started a Watch Party!"}
            </p>
        </div>
        <div className="flex gap-2">
            <button onClick={onDismiss} className="text-gray-400 hover:text-white px-2">Ignore</button>
            <button 
              onClick={onJoin} 
              className={`text-white px-4 py-1.5 rounded-lg font-bold text-sm shadow-lg transition ${isScreenShare ? 'bg-teal-600 hover:bg-teal-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
            >
              {isScreenShare ? 'View' : 'Join'}
            </button>
        </div>
    </div>
  );
};

export default UxWatch_IncomingToast;
