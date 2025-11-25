
import { useState, useEffect, useRef, useCallback } from 'react';
import { uxWatchScreenSupabase } from '../../../supabase/uxWatch_screen_client';
import { uxWatch_safeAddIceCandidate } from '../utils/uxWatch_sync';

export type ScreenShareStatus = 'idle' | 'offering' | 'sharing' | 'viewing' | 'connecting';

interface IncomingOffer {
  from: string;
  sdp: RTCSessionDescriptionInit;
}

export const useUxScreenShare = (chatId: string, currentUserUid: string) => {
  const [status, setStatus] = useState<ScreenShareStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingOffer, setIncomingOffer] = useState<IncomingOffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number>(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);

  const getPeerConfig = () => {
    let iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ];
    if (process.env.NEXT_PUBLIC_TURN_SERVERS) {
      try {
        const turn = JSON.parse(process.env.NEXT_PUBLIC_TURN_SERVERS);
        iceServers = [...iceServers, ...turn];
      } catch (e) {
        console.error('Failed to parse TURN servers', e);
      }
    }
    return { iceServers };
  };

  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
    setStatus('idle');
    setIncomingOffer(null);
    iceQueueRef.current = [];
  }, [localStream]);

  // --- SIGNALING SETUP ---
  useEffect(() => {
    if (!chatId) return;

    const channel = uxWatchScreenSupabase.channel(`screen_share:${chatId}`)
      .on('broadcast', { event: 'signal' }, (payload) => {
        handleSignal(payload.payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug('[ScreenShare] Signaling Connected');
        }
      });

    channelRef.current = channel;

    return () => {
      uxWatchScreenSupabase.removeChannel(channel);
      cleanup();
    };
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendSignal = (type: string, payload: any) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { ...payload, type, from: currentUserUid, ts: Date.now() }
    });
  };

  const handleSignal = async (data: any) => {
    if (data.from === currentUserUid) return;

    try {
      if (data.type === 'offer') {
        console.log("[ScreenShare] Received Offer");
        setIncomingOffer({ from: data.from, sdp: data.sdp });
      } else if (data.type === 'answer') {
        console.log("[ScreenShare] Received Answer");
        if (pcRef.current && pcRef.current.signalingState !== 'stable') {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          setStatus('sharing');
        }
      } else if (data.type === 'ice') {
        if (pcRef.current) {
          await uxWatch_safeAddIceCandidate(pcRef.current, data.candidate);
        } else {
          iceQueueRef.current.push(data.candidate);
        }
      } else if (data.type === 'end') {
        console.log("[ScreenShare] Session Ended by peer");
        cleanup();
      }
    } catch (err) {
      console.error("[ScreenShare] Signaling Error:", err);
    }
  };

  // --- HOST: START SHARING ---
  const startSharing = async () => {
    // FIX: Feature detection for Mobile/Safari compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        const msg = "Screen sharing is not supported on this browser/device. Please use Chrome/Edge on Desktop.";
        console.error("[ScreenShare] " + msg);
        setError(msg);
        alert(msg);
        return;
    }

    try {
      cleanup();
      setStatus('offering');
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 15 }
        },
        audio: true // Request system audio
      });

      setLocalStream(stream);

      // Detect if user didn't share audio (Chrome specific check)
      if (stream.getAudioTracks().length === 0) {
        console.warn("[ScreenShare] No audio track shared. Ensure 'Share audio' is checked.");
      }

      const pc = new RTCPeerConnection(getPeerConfig());
      pcRef.current = pc;

      // Add tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        // Handle user clicking "Stop Sharing" via browser UI
        track.onended = () => stopSharing();
      });

      // ICE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('ice', { candidate: event.candidate });
        }
      };

      // Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal('offer', { sdp: offer });

    } catch (err: any) {
      console.error("[ScreenShare] Error starting:", err);
      if (err.name === 'NotAllowedError') {
          setError("Permission denied.");
      } else {
          setError("Failed to start screen share.");
      }
      setStatus('idle');
    }
  };

  // --- VIEWER: JOIN SESSION ---
  const acceptShare = async () => {
    if (!incomingOffer) return;
    try {
      cleanup();
      setStatus('connecting');

      const pc = new RTCPeerConnection(getPeerConfig());
      pcRef.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('ice', { candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        console.log("[ScreenShare] Remote Track Received", event.streams);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setStatus('viewing');
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer.sdp));
      
      // Process queued ICE
      while (iceQueueRef.current.length > 0) {
        const c = iceQueueRef.current.shift();
        if(c) await uxWatch_safeAddIceCandidate(pc, c);
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal('answer', { sdp: answer });
      
      setIncomingOffer(null); // Clear invite

    } catch (err) {
      console.error("[ScreenShare] Error accepting:", err);
      setError("Connection failed.");
      cleanup();
    }
  };

  const stopSharing = () => {
    sendSignal('end', {});
    cleanup();
  };

  const rejectShare = () => {
    setIncomingOffer(null);
  };

  return {
    status,
    localStream,
    remoteStream,
    incomingOffer,
    error,
    startSharing,
    stopSharing,
    acceptShare,
    rejectShare,
    latency
  };
};
