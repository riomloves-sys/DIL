
import React, { useEffect, useRef } from 'react';
import { ScreenShareStatus } from '../hooks/useUxScreenShare';

interface Props {
  status: ScreenShareStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onStop: () => void;
}

const UxWatch_ScreenShareModal: React.FC<Props> = ({ status, localStream, remoteStream, onStop }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (status === 'sharing' || status === 'offering') {
        videoRef.current.srcObject = localStream;
        // Host MUST mute local video to avoid echo/feedback loop
        videoRef.current.muted = true;
      } else if (status === 'viewing') {
        videoRef.current.srcObject = remoteStream;
        // Viewer listens to audio
        videoRef.current.muted = false;
      }
    }
  }, [status, localStream, remoteStream]);

  if (status === 'idle' || (!localStream && !remoteStream)) return null;

  const isHost = status === 'sharing' || status === 'offering';

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fade-in">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">LIVE</span>
          <h3 className="text-white font-bold text-lg shadow-sm">
            {isHost ? "You are sharing your screen" : "Watching Partner's Screen"}
          </h3>
        </div>
        <button 
          onClick={onStop}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md border border-white/20 transition"
        >
          {isHost ? "Stop Sharing" : "Exit"}
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 w-full h-full flex items-center justify-center bg-gray-900 relative">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          controls={!isHost} // Viewer gets controls
          className="max-w-full max-h-full w-full h-full object-contain shadow-2xl"
        />
        
        {/* Host Hint */}
        {isHost && (
          <div className="absolute bottom-20 bg-black/60 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm border border-white/10">
            <i className="fas fa-volume-mute mr-2"></i> Your preview is muted. Partner can hear system audio.
          </div>
        )}
      </div>

    </div>
  );
};

export default UxWatch_ScreenShareModal;
