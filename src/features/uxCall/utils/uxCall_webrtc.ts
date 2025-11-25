
export const uxCall_DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

export const uxCall_getPeerConfig = () => {
  let iceServers = [...uxCall_DEFAULT_ICE_SERVERS];

  // Parse TURN servers from env if available
  // Format: JSON string -> [{ urls: '...', username: '...', credential: '...' }]
  const envTurn = process.env.NEXT_PUBLIC_TURN_SERVERS;
  if (envTurn) {
    try {
      const turnServers = JSON.parse(envTurn);
      iceServers = [...iceServers, ...turnServers];
    } catch (e) {
      console.error('Failed to parse NEXT_PUBLIC_TURN_SERVERS', e);
    }
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
  } as RTCConfiguration;
};

export const uxCall_playRingtone = (type: 'outgoing' | 'incoming') => {
  // Simple oscillator ringtone to avoid asset dependency
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'incoming') {
      // High pitched ringing
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } else {
      // Lower pitched calling tone
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch (e) {
    // Audio context not allowed or failed
  }
};
