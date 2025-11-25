
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabaseCallClient } from '../../../supabase/callClient';
import { uxCall_getPeerConfig, uxCall_playRingtone } from '../utils/uxCall_webrtc';

export type UxCallState = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

interface CallSession {
  id: string;
  caller_uid: string;
  callee_uid: string;
  chat_id: string;
  call_type: 'audio' | 'video';
  status: 'ringing' | 'active' | 'ended' | 'rejected';
}

// 1. FIXED: Strict Audio Constraints to prevent Echo/Noise
const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000
};

export const useUxCall = (chatId: string, currentUserUid: string) => {
  // State
  const [callState, setCallState] = useState<UxCallState>('idle');
  const [session, setSession] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for WebRTC & Cleanup
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const signalingChannel = useRef<any>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);
  
  // 2. FIXED: Track Cleanup Helper
  const stopLocalStream = useCallback(() => {
    if (localStream) {
      console.debug("[UxCall] Stopping local tracks");
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  // --- HELPER: Initialize WebRTC Peer ---
  const createPeer = useCallback(() => {
    if (peerConnection.current) return peerConnection.current;

    console.debug("[UxCall] Creating new RTCPeerConnection");
    const pc = new RTCPeerConnection(uxCall_getPeerConfig());

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && session) {
        signalingChannel.current?.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'ice',
            candidate: event.candidate,
            from: currentUserUid
          }
        });
      }
    };

    // 3. FIXED: Robust Remote Track Handling
    pc.ontrack = (event) => {
      console.debug("[UxCall] Remote track received:", event.track.kind, event.track.id);
      // Only set if it's a new stream or the first stream
      if (event.streams && event.streams[0]) {
        setRemoteStream(prev => {
          if (prev && prev.id === event.streams[0].id) return prev;
          return event.streams[0];
        });
      } else {
        // Fallback for single track w/o stream
        const newStream = new MediaStream([event.track]);
        setRemoteStream(newStream);
      }
    };

    // Connection State Changes
    pc.onconnectionstatechange = () => {
      console.debug("[UxCall] Connection State:", pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        hangUp();
        setError('Connection lost');
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [session, currentUserUid]);

  // --- SIGNALING HANDLER ---
  const handleSignal = async (payload: any) => {
    if (!peerConnection.current) return;
    if (payload.from === currentUserUid) return; // Ignore own messages

    const pc = peerConnection.current;

    try {
      if (payload.type === 'offer') {
        console.debug("[UxCall] Received Offer");
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        
        // Process queued ICE candidates
        while (iceCandidatesQueue.current.length > 0) {
          const c = iceCandidatesQueue.current.shift();
          if(c) await pc.addIceCandidate(c);
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        signalingChannel.current?.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'answer', sdp: answer, from: currentUserUid }
        });

      } else if (payload.type === 'answer') {
        console.debug("[UxCall] Received Answer");
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

      } else if (payload.type === 'ice') {
        const candidate = new RTCIceCandidate(payload.candidate);
        if (pc.remoteDescription) {
          await pc.addIceCandidate(candidate);
        } else {
          iceCandidatesQueue.current.push(candidate);
        }
      } else if (payload.type === 'end') {
        console.debug("[UxCall] Received End Signal");
        hangUp();
      }
    } catch (err) {
      console.error("Signaling error:", err);
    }
  };

  // --- 1. START CALL (Caller) ---
  const startCall = async (calleeUid: string, type: 'audio' | 'video') => {
    stopLocalStream(); // Ensure clean slate
    try {
      setCallState('calling');
      console.debug("[UxCall] Starting call...", type);
      
      // 1. Get User Media with STRICT constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
        video: type === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false
      });
      setLocalStream(stream);
      setIsVideoOff(type === 'audio');

      // 2. Create DB Session
      const { data, error } = await supabaseCallClient
        .from('call_sessions')
        .insert({
          chat_id: chatId,
          caller_uid: currentUserUid,
          callee_uid: calleeUid,
          call_type: type,
          status: 'ringing'
        })
        .select()
        .single();

      if (error) throw error;
      setSession(data);

      // 3. Init Peer & Add Tracks
      const pc = createPeer();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // 4. Create Offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video'
      });
      await pc.setLocalDescription(offer);

      // 5. Subscribe & Send Offer (will happen in useEffect when session is set)
      uxCall_playRingtone('outgoing');

    } catch (err) {
      console.error("Failed to start call:", err);
      setError("Could not access camera/mic or start call.");
      setCallState('idle');
    }
  };

  // --- 2. ACCEPT CALL (Callee) ---
  const acceptCall = async () => {
    if (!session) return;
    stopLocalStream(); // Ensure clean slate
    try {
      console.debug("[UxCall] Accepting call...");
      // 1. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
        video: session.call_type === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false
      });
      setLocalStream(stream);
      
      // 2. Update DB Status
      await supabaseCallClient
        .from('call_sessions')
        .update({ status: 'active' })
        .eq('id', session.id);

      // 3. Init Peer & Add Tracks
      const pc = createPeer();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      // We wait for the 'offer' signal which triggers the rest
      setCallState('connected'); // Optimistic
    } catch (err) {
      console.error("Failed to accept call:", err);
      setError("Could not access media devices.");
      hangUp();
    }
  };

  const rejectCall = async () => {
    if (!session) return;
    await supabaseCallClient.from('call_sessions').update({ status: 'rejected' }).eq('id', session.id);
    setCallState('idle');
    setSession(null);
  };

  const hangUp = useCallback(async () => {
    console.debug("[UxCall] Hanging up");
    // 1. Send End Signal
    if (signalingChannel.current && session) {
      signalingChannel.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'end', from: currentUserUid }
      });
    }

    // 2. Update DB
    if (session) {
      await supabaseCallClient
        .from('call_sessions')
        .update({ status: 'ended' })
        .eq('id', session.id);
    }

    // 3. Cleanup Local
    stopLocalStream();
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    // Reset State
    setCallState('idle');
    setSession(null);
    setLocalStream(null);
    setRemoteStream(null);
    iceCandidatesQueue.current = [];
  }, [session, stopLocalStream, currentUserUid]);


  // --- MEDIA CONTROLS ---
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsVideoOff(!track.enabled);
      });
    }
  };


  // --- EFFECT: REALTIME SUBSCRIPTION (Signaling + DB) ---
  useEffect(() => {
    if (!chatId || !currentUserUid) return;

    // A. Listen for DB updates (Incoming calls)
    const dbChannel = supabaseCallClient.channel(`db_calls:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_sessions', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const newSession = payload.new as CallSession;
          // If I am the callee and status is ringing
          if (newSession.callee_uid === currentUserUid && newSession.status === 'ringing') {
            setSession(newSession);
            setCallState('incoming');
            uxCall_playRingtone('incoming');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'call_sessions', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const updated = payload.new as CallSession;
          if (updated.status === 'ended' || updated.status === 'rejected') {
            if (session && session.id === updated.id) {
               hangUp();
            }
          }
        }
      )
      .subscribe();

    // B. Signaling Channel (WebRTC Handshake)
    const sigChannel = supabaseCallClient.channel(`room:chat_${chatId}`)
      .on('broadcast', { event: 'signal' }, (payload) => {
        handleSignal(payload.payload);
      })
      .subscribe();

    signalingChannel.current = sigChannel;

    return () => {
      supabaseCallClient.removeChannel(dbChannel);
      supabaseCallClient.removeChannel(sigChannel);
    };
  }, [chatId, currentUserUid, session, hangUp]);

  // --- EFFECT: Send Offer when Session Creates (Caller side) ---
  useEffect(() => {
    if (session && session.caller_uid === currentUserUid && callState === 'calling' && signalingChannel.current) {
        // We need to wait a tiny bit for the peer to create the offer
        const sendInitialOffer = async () => {
             if (peerConnection.current && peerConnection.current.localDescription) {
                 signalingChannel.current.send({
                     type: 'broadcast',
                     event: 'signal',
                     payload: { 
                         type: 'offer', 
                         sdp: peerConnection.current.localDescription, 
                         from: currentUserUid 
                     }
                 });
             }
        };
        // Retry a few times if PC isn't ready
        const i = setInterval(() => {
            if(peerConnection.current?.localDescription) {
                sendInitialOffer();
                clearInterval(i);
            }
        }, 500);
        return () => clearInterval(i);
    }
  }, [session, callState, currentUserUid]);


  return {
    callState,
    session,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    error,
    startCall,
    acceptCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleVideo
  };
};
