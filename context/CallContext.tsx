
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { useAuth } from './AuthContext';

interface CallContextType {
  callStatus: 'idle' | 'calling' | 'incall' | 'incoming' | 'disabled';
  callType: 'audio' | 'video';
  isMuted: boolean;
  isVideoOff: boolean;
  callerDetails: { name: string; photo: string } | null;
  startCall: (recipientUid: string, name: string, photo: string, type: 'audio' | 'video') => void;
  answerCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType>({
  callStatus: 'idle',
  callType: 'audio',
  isMuted: false,
  isVideoOff: false,
  callerDetails: null,
  startCall: () => {},
  answerCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
  toggleVideo: () => {},
});

export const useCall = () => useContext(CallContext);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Call State
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'incall' | 'incoming' | 'disabled'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callerDetails, setCallerDetails] = useState<{ name: string; photo: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  // Refs
  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentCallRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize PeerJS globally
  useEffect(() => {
    if (!user) return;

    // Cleanup existing peer if it exists
    if (peerRef.current) {
        if (!peerRef.current.destroyed) {
            peerRef.current.destroy();
        }
        peerRef.current = null;
    }

    const initPeer = () => {
        // Use user.uid as the Peer ID
        const peer = new Peer(user.uid, {
            debug: 0 // Disable verbose logs
        });

        peer.on('open', (id) => {
          console.log('PeerJS connected with ID:', id);
          if (callStatus === 'disabled') setCallStatus('idle');
        });

        // --- RECONNECTION LOGIC ---
        peer.on('disconnected', () => {
            try {
                if(!peer.destroyed) peer.reconnect();
            } catch (err) {
                console.error('Reconnection failed:', err);
            }
        });

        peer.on('call', (call) => {
          // Incoming call logic
          const meta = call.metadata || {};
          setCallerDetails({
            name: meta.name || call.peer,
            photo: meta.photo || `https://ui-avatars.com/api/?name=${call.peer}`
          });
          setCallType(meta.type || 'audio');
          setIncomingCall(call);
          setCallStatus('incoming');
        });

        peer.on('error', (err: any) => {
          // CRITICAL FIX: Handle ID taken error
          if (err.type === 'unavailable-id') {
              console.warn("PeerJS ID taken. Calls disabled in this tab.");
              setCallStatus('disabled');
              return;
          }
          if (err.type === 'peer-unavailable') {
              alert("User is offline or unreachable.");
              endCallCleanup();
              return;
          }
          console.error('PeerJS error:', err);
        });

        peerRef.current = peer;
    };

    // Small delay to ensure previous instance is cleaned up
    const timer = setTimeout(initPeer, 1000);

    return () => {
      clearTimeout(timer);
      if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
      }
    };
  }, [user]);

  const startCall = async (recipientUid: string, name: string, photo: string, type: 'audio' | 'video') => {
    if (callStatus === 'disabled') {
        alert("Calling is disabled in this tab because the app is open in another tab. Please close other tabs and refresh.");
        return;
    }
    if (!peerRef.current || peerRef.current.disconnected || peerRef.current.destroyed) {
        alert("Call service unavailable. Please refresh the page.");
        return;
    }
    
    setCallType(type);
    setCallerDetails({ name, photo });
    setCallStatus('calling');
    setIsMuted(false);
    setIsVideoOff(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      
      localStreamRef.current = stream;
      
      // Update local video UI
      setTimeout(() => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.muted = true;
        }
      }, 100);

      const options = {
        metadata: {
            name: user?.displayName || 'Unknown',
            photo: user?.photoURL || '',
            type
        }
      };

      const call = peerRef.current.call(recipientUid, stream, options);
      
      if (!call) {
          throw new Error("Failed to initiate connection");
      }

      currentCallRef.current = call;

      call.on('stream', (remoteStream: MediaStream) => {
        setCallStatus('incall');
        setTimeout(() => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        }, 100);
      });

      call.on('close', endCallCleanup);
      call.on('error', (e: any) => {
        console.error("Call error:", e);
        endCallCleanup();
      });

    } catch (err) {
      console.error("Failed to get local stream", err);
      alert("Could not access camera/microphone or user is offline.");
      endCallCleanup();
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === 'video'
        });
        
        localStreamRef.current = stream;
        
        setTimeout(() => {
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.muted = true;
            }
        }, 100);

        incomingCall.answer(stream);
        currentCallRef.current = incomingCall;

        setCallStatus('incall');

        incomingCall.on('stream', (remoteStream: MediaStream) => {
            setTimeout(() => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            }, 100);
        });

        incomingCall.on('close', endCallCleanup);
        incomingCall.on('error', endCallCleanup);

    } catch (err) {
        console.error("Error answering call:", err);
        endCallCleanup();
    }
  };

  const endCallCleanup = () => {
    if (currentCallRef.current) currentCallRef.current.close();
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    // Only reset status if not permanently disabled
    setCallStatus(prev => prev === 'disabled' ? 'disabled' : 'idle');
    setIncomingCall(null);
    setCallerDetails(null);
    currentCallRef.current = null;
    localStreamRef.current = null;
  };

  const endCall = () => {
      endCallCleanup();
  };

  const toggleMute = () => {
      if (localStreamRef.current) {
          const track = localStreamRef.current.getAudioTracks()[0];
          if (track) {
              track.enabled = !track.enabled;
              setIsMuted(!track.enabled);
          }
      }
  };

  const toggleVideo = () => {
      if (localStreamRef.current) {
          const track = localStreamRef.current.getVideoTracks()[0];
          if (track) {
              track.enabled = !track.enabled;
              setIsVideoOff(!track.enabled);
          }
      }
  };

  return (
    <CallContext.Provider value={{
      callStatus, callType, isMuted, isVideoOff, callerDetails,
      startCall, answerCall, endCall, toggleMute, toggleVideo
    }}>
      {children}

      {/* --- CALL UI OVERLAY --- */}
      {(callStatus !== 'idle' && callStatus !== 'disabled') && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
            
            {/* Incoming Call Prompt */}
            {callStatus === 'incoming' && (
                <div className="bg-gray-800 p-8 rounded-2xl flex flex-col items-center max-w-sm w-full animate-fade-in">
                    <img src={callerDetails?.photo} className="w-24 h-24 rounded-full mb-4 border-4 border-blue-500 animate-bounce" />
                    <h2 className="text-2xl font-bold text-white">{callerDetails?.name}</h2>
                    <p className="text-blue-400 mb-8">Incoming {callType} call...</p>
                    <div className="flex gap-8">
                        <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition"><i className="fas fa-times text-white text-xl"></i></button>
                        <button onClick={answerCall} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition animate-pulse"><i className="fas fa-phone text-white text-xl"></i></button>
                    </div>
                </div>
            )}

            {/* Active/Calling UI */}
            {(callStatus === 'calling' || callStatus === 'incall') && (
                 <div className="relative w-full max-w-5xl h-full flex flex-col">
                    <div className="flex-1 relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
                        {callStatus === 'calling' ? (
                            <div className="text-center">
                                <img src={callerDetails?.photo} className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-white/20" />
                                <h3 className="text-2xl text-white font-bold animate-pulse">Calling {callerDetails?.name}...</h3>
                            </div>
                        ) : (
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                        )}

                        {/* Local Video PIP */}
                        <div className={`absolute bottom-4 right-4 w-32 h-48 md:w-48 md:h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-xl ${callType === 'audio' ? 'hidden' : ''}`}>
                             <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="h-24 flex items-center justify-center gap-6 mt-4">
                        <button onClick={toggleMute} className={`p-4 rounded-full text-white ${isMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-xl`}></i>
                        </button>
                        <button onClick={endCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg scale-110">
                            <i className="fas fa-phone-slash text-2xl"></i>
                        </button>
                        {callType === 'video' && (
                            <button onClick={toggleVideo} className={`p-4 rounded-full text-white ${isVideoOff ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                <i className={`fas ${isVideoOff ? 'fa-video-slash' : 'fa-video'} text-xl`}></i>
                            </button>
                        )}
                    </div>
                 </div>
            )}
        </div>
      )}
    </CallContext.Provider>
  );
};
