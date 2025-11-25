
export const uxWatch_normalizeTime = (time: number): number => {
  return Math.max(0, parseFloat(time.toFixed(3)));
};

export const uxWatch_parseYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const uxWatch_isEmbedAllowed = (url: string): boolean => {
  // Basic check for secure protocols
  return url.startsWith('https://') || url.startsWith('http://localhost');
};

export const uxWatch_detectDrift = (localTime: number, remoteTime: number, threshold = 1.0): boolean => {
  return Math.abs(localTime - remoteTime) > threshold;
};

// --- New WebRTC Helpers ---

export const uxWatch_safeAddIceCandidate = async (
  pc: RTCPeerConnection | null,
  candidate: RTCIceCandidateInit
) => {
  if (!pc) return;
  try {
    // Only add if remote description is set
    if (pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (e) {
    console.error("Error adding ICE candidate", e);
  }
};
