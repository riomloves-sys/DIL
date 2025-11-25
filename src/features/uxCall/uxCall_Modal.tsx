
import React, { useEffect, useRef } from 'react';
import { UxCallState } from './hooks/useUxCall';

interface Props {
  callState: UxCallState;
  callType: 'audio' | 'video';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  onHangup: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  remoteName?: string;
}

const UxCall_Modal: React.FC<Props> = ({
  callState,
  callType,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  onHangup,
  onToggleMute,
  onToggleVideo,
  remoteName = "Partner"
}) => {
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Attach Local Stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach Remote Stream
  useEffect(() => {
    // For video element
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    // For audio element (Audio Only Backup)
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState === 'idle' || callState === 'incoming') return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center animate-fade-in">
      
      {/* 
         FIXED: Dedicated Audio Element for Remote Stream 
         Ensures audio plays even if video element is hidden or glitching.
         NO 'muted' attribute here - this is the incoming audio.
      */}
      <audio ref={remoteAudioRef} autoPlay playsInline controls={false} />

      {/* Remote Video (Full Screen) */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {callState === 'connected' && remoteStream ? (
          <>
            {callType === 'video' ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
                // Rely on <audio> for sound if needed, but <video> usually handles both. 
                // To prevent double audio if both exist, we can mute video IF audio tag is present?
                // Actually safer to just rely on one. Let's use <video> for playback if video call.
                // If audio call, we use the audio tag above.
                muted={callType !== 'video'} // Mute video element if not video call, rely on audio tag? No, keep simple.
                // Better strategy: Only render VIDEO element if callType is video.
              />
            ) : (
              <div className="flex flex-col items-center animate-pulse">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg border-4 border-white/10">
                   <i className="fas fa-microphone text-5xl text-white"></i>
                </div>
                <h2 className="text-white text-2xl font-bold tracking-wide">Voice Call Active</h2>
                <p className="text-gray-400 mt-2 text-sm font-mono">Signal: Excellent</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
               <span className="text-4xl text-white font-bold">{remoteName[0]}</span>
            </div>
            <h2 className="text-white text-xl font-bold">{callState === 'calling' ? 'Calling...' : 'Connecting...'}</h2>
            <p className="text-gray-400">{remoteName}</p>
          </div>
        )}

        {/* Local Video (PIP) - FIXED: ALWAYS MUTED to prevent Echo */}
        {localStream && callType === 'video' && (
          <div className="absolute bottom-24 right-4 w-32 h-48 bg-black rounded-xl border-2 border-gray-700 overflow-hidden shadow-2xl">
             <video 
               ref={localVideoRef} 
               autoPlay 
               playsInline 
               muted={true} // CRITICAL FIX: Self-view must be muted
               className={`w-full h-full object-cover transform ${isVideoOff ? 'hidden' : 'scale-x-[-1]'}`} 
             />
             {isVideoOff && (
               <div className="w-full h-full flex items-center justify-center bg-gray-800">
                 <i className="fas fa-video-slash text-gray-500"></i>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-6 pb-4">
        
        <button 
          onClick={onToggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition ${isMuted ? 'bg-white text-black' : 'bg-gray-700/50 text-white hover:bg-gray-600'}`}
        >
          <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
        </button>
        
        <button 
          onClick={onHangup}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-2xl shadow-lg transform hover:scale-105 transition"
        >
          <i className="fas fa-phone-slash"></i>
        </button>

        {callType === 'video' && (
          <button 
            onClick={onToggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition ${isVideoOff ? 'bg-white text-black' : 'bg-gray-700/50 text-white hover:bg-gray-600'}`}
          >
            <i className={`fas ${isVideoOff ? 'fa-video-slash' : 'fa-video'}`}></i>
          </button>
        )}

      </div>
    </div>
  );
};

export default UxCall_Modal;
