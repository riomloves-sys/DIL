
import React from 'react';

interface Props {
  callerName?: string;
  callType: 'audio' | 'video';
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const UxCall_IncomingToast: React.FC<Props> = ({ callerName = 'Partner', callType, visible, onAccept, onReject }) => {
  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[110] w-[90%] max-w-sm bg-gray-900/95 backdrop-blur border border-gray-700 shadow-2xl rounded-2xl p-4 flex items-center justify-between animate-slide-down">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
          <i className={`fas ${callType === 'video' ? 'fa-video' : 'fa-phone'} text-white text-lg`}></i>
        </div>
        <div>
          <h4 className="text-white font-bold">{callerName}</h4>
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-wide">Incoming {callType}...</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={onReject}
          className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition"
        >
          <i className="fas fa-times text-white"></i>
        </button>
        <button 
          onClick={onAccept}
          className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition animate-bounce"
        >
          <i className="fas fa-phone text-white"></i>
        </button>
      </div>
    </div>
  );
};

export default UxCall_IncomingToast;
