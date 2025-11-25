
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

interface Props {
  url: string;
  type: 'upload' | 'youtube' | 'web';
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  isHost: boolean; 
  onBack?: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  // Support v=, youtu.be, embed, shorts
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const UxWatch_VideoPlayer = forwardRef((props: Props, ref) => {
  const { url, type, onPlay, onPause, onSeek, isHost, onBack } = props;
  
  // Real Player Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  
  // Virtual Player State (For fallback mode)
  const [isRestricted, setIsRestricted] = useState(false);
  const [virtualTime, setVirtualTime] = useState(0);
  const [virtualPlaying, setVirtualPlaying] = useState(false);
  const virtualInterval = useRef<any>(null);
  
  const [ytError, setYtError] = useState<string | null>(null);
  const isRemoteUpdate = useRef(false);

  // --- VIRTUAL PLAYER LOGIC (For Restricted Videos) ---
  useEffect(() => {
    if (virtualPlaying) {
      virtualInterval.current = setInterval(() => {
        setVirtualTime(t => t + 1);
      }, 1000);
    } else {
      if (virtualInterval.current) clearInterval(virtualInterval.current);
    }
    return () => {
      if (virtualInterval.current) clearInterval(virtualInterval.current);
    };
  }, [virtualPlaying]);

  const handleVirtualPlay = () => {
    setVirtualPlaying(true);
    onPlay();
  };

  const handleVirtualPause = () => {
    setVirtualPlaying(false);
    onPause();
  };

  const handleVirtualSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    setVirtualTime(t);
    onSeek(t);
  };

  // --- EXPOSED METHODS (Unified for Real & Virtual) ---
  useImperativeHandle(ref, () => ({
    play: () => {
        isRemoteUpdate.current = true;
        if (isRestricted) {
            setVirtualPlaying(true);
        } else if (type === 'youtube' && playerRef.current?.playVideo) {
             playerRef.current.playVideo();
        } else {
             videoRef.current?.play();
        }
        setTimeout(() => isRemoteUpdate.current = false, 800);
    },
    pause: () => {
        isRemoteUpdate.current = true;
        if (isRestricted) {
            setVirtualPlaying(false);
        } else if (type === 'youtube' && playerRef.current?.pauseVideo) {
            playerRef.current.pauseVideo();
        } else {
            videoRef.current?.pause();
        }
        setTimeout(() => isRemoteUpdate.current = false, 800);
    },
    seekTo: (time: number) => {
        isRemoteUpdate.current = true;
        if (isRestricted) {
            setVirtualTime(time);
        } else if (type === 'youtube' && playerRef.current?.seekTo) {
            playerRef.current.seekTo(time, true);
        } else if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
        setTimeout(() => isRemoteUpdate.current = false, 800);
    },
    getCurrentTime: () => {
        if (isRestricted) return virtualTime;
        
        if (type === 'youtube' && playerRef.current?.getCurrentTime) {
            return playerRef.current.getCurrentTime();
        }
        return videoRef.current?.currentTime || 0;
    },
    isPaused: () => {
         if (isRestricted) return !virtualPlaying;

         if (type === 'youtube' && playerRef.current?.getPlayerState) {
             return playerRef.current.getPlayerState() !== 1;
         }
         return videoRef.current?.paused;
    }
  }));

  // HTML5 Handlers
  const handleHTML5Play = () => { if (!isRemoteUpdate.current) onPlay(); };
  const handleHTML5Pause = () => { if (!isRemoteUpdate.current) onPause(); };
  const handleHTML5Seek = () => { if (!isRemoteUpdate.current && videoRef.current) onSeek(videoRef.current.currentTime); };

  // YouTube Initialization
  useEffect(() => {
    if (type !== 'youtube') return;

    setYtError(null);
    setIsRestricted(false);
    
    const videoId = getYouTubeId(url);
    if (!videoId) {
        setYtError("Invalid YouTube URL");
        return;
    }

    const loadPlayer = () => {
        if (!window.YT || !window.YT.Player) return;
        
        if (playerRef.current) {
            try { playerRef.current.destroy(); } catch(e) {}
        }

        try {
            playerRef.current = new window.YT.Player('youtube-player', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'autoplay': 1,
                    'controls': 1,
                    'rel': 0,
                    'playsinline': 1,
                    'enablejsapi': 1,
                    'origin': window.location.origin,
                    'widget_referrer': window.location.origin
                },
                events: {
                    'onReady': (event: any) => {
                        // Player Ready
                    },
                    'onStateChange': (event: any) => {
                        if (isRemoteUpdate.current) return;
                        if (event.data === window.YT.PlayerState.PLAYING) onPlay();
                        if (event.data === window.YT.PlayerState.PAUSED) onPause();
                    },
                    'onError': (event: any) => {
                        console.warn("YouTube Player Error Code:", event.data);
                        // 150 = Restricted/Embedded disabled
                        // 101 = Restricted
                        // 153 = Origin/Permissions issue
                        if ([101, 150, 153].includes(event.data)) {
                            setIsRestricted(true); // Switch to Virtual Mode
                        } else {
                            setYtError(`Video Unavailable (Code ${event.data})`);
                        }
                    }
                }
            });
        } catch (e) {
            setYtError("Player initialization failed.");
        }
    };

    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = loadPlayer;
    } else {
        loadPlayer();
    }

    return () => {
        if (playerRef.current) {
            try { playerRef.current.destroy(); } catch(e) {}
        }
    };
  }, [url, type]);

  // --- RENDER ---

  if (type === 'upload') {
      return (
          <video
            ref={videoRef}
            src={url}
            className="w-full h-full bg-black object-contain"
            controls
            playsInline
            onPlay={handleHTML5Play}
            onPause={handleHTML5Pause}
            onSeeked={handleHTML5Seek}
          />
      );
  }

  if (type === 'youtube') {
      const videoId = getYouTubeId(url);

      // --- FALLBACK / VIRTUAL MODE ---
      if (isRestricted) {
          return (
              <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-6 relative">
                  <div className="text-center max-w-md space-y-4">
                      <img 
                        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                        className="w-full h-48 object-cover rounded-xl opacity-50 mb-2" 
                        alt="Thumbnail"
                      />
                      <h3 className="text-xl font-bold text-white"><i className="fab fa-youtube text-red-500 mr-2"></i> External Playback Mode</h3>
                      <p className="text-sm text-gray-400">
                          This video cannot be embedded here (owner restricted). 
                          <br/>
                          Open it in YouTube, but use the controls below to keep sync active!
                      </p>
                      
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg mb-4"
                      >
                         Open on YouTube <i className="fas fa-external-link-alt ml-1"></i>
                      </a>

                      {/* Virtual Controls */}
                      <div className="bg-gray-800 p-4 rounded-xl w-full border border-gray-700">
                          <div className="flex justify-between text-xs text-gray-400 mb-2">
                              <span>{Math.floor(virtualTime / 60)}:{String(virtualTime % 60).padStart(2,'0')}</span>
                              <span>Sync Active</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="600" // Arbitrary max for virtual since we can't know duration easily without API
                            value={virtualTime}
                            onChange={handleVirtualSeek}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-4"
                          />
                          <div className="flex justify-center gap-4">
                              <button 
                                onClick={virtualPlaying ? handleVirtualPause : handleVirtualPlay}
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition ${virtualPlaying ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'}`}
                              >
                                  <i className={`fas ${virtualPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                              </button>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-2 text-center">
                              Use this Play button to sync with your partner while watching externally.
                          </p>
                      </div>

                      <button onClick={onBack} className="text-gray-500 hover:text-white text-sm mt-4 underline">
                          Choose Different Video
                      </button>
                  </div>
              </div>
          );
      }

      return (
          <div className="w-full h-full bg-black relative flex items-center justify-center">
              {ytError ? (
                  <div className="text-center p-6 bg-gray-900 rounded-xl border border-red-900/50 max-w-md mx-4 relative z-20">
                      <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                      <h3 className="text-white font-bold text-lg mb-2">Video Error</h3>
                      <p className="text-gray-400 text-sm mb-6">{ytError}</p>
                      <button 
                         onClick={onBack}
                         className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-sm transition"
                      >
                         Back to Menu
                      </button>
                  </div>
              ) : (
                  <div id="youtube-player" className="w-full h-full"></div>
              )}
          </div>
      );
  }

  return null;
});

export default UxWatch_VideoPlayer;
