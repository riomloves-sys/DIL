
import React, { useState, useEffect } from 'react';
import { SecretEnvelope } from '../hooks/useSecretEnvelope';

interface Props {
  envelope: SecretEnvelope;
  onReveal: (id: string) => void;
  onClose: () => void;
  currentUserUid: string;
}

const UxSecret_View: React.FC<Props> = ({ envelope, onReveal, onClose, currentUserUid }) => {
  const [revealed, setRevealed] = useState(envelope.revealed);
  const [animating, setAnimating] = useState(false);
  const isSender = envelope.sender_uid === currentUserUid;
  
  const unlockTime = new Date(envelope.unlock_at).getTime();
  const timeLeft = Math.max(0, unlockTime - Date.now());
  const isLocked = timeLeft > 0;

  const [timer, setTimer] = useState(timeLeft);

  useEffect(() => {
    if (timeLeft > 0) {
        const interval = setInterval(() => {
            setTimer(Math.max(0, unlockTime - Date.now()));
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [unlockTime]);

  const handleOpen = () => {
      if (isLocked && !isSender) return;
      setAnimating(true);
      setTimeout(() => {
          setRevealed(true);
          if (!envelope.revealed && !isSender) onReveal(envelope.id);
      }, 1500);
  };

  const formatDuration = (ms: number) => {
      const sec = Math.floor((ms / 1000) % 60);
      const min = Math.floor((ms / (1000 * 60)) % 60);
      const hr = Math.floor((ms / (1000 * 60 * 60)) % 24);
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      return `${days}d ${hr}h ${min}m ${sec}s`;
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-50">
            <i className="fas fa-times text-3xl"></i>
        </button>

        {revealed ? (
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg p-8 rounded-xl shadow-2xl animate-slide-up relative border-4 border-double border-purple-200 dark:border-purple-900">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    <i className="fas fa-quote-left"></i>
                </div>
                <p className="text-xs text-gray-400 text-center mb-6 uppercase tracking-widest">
                    Sealed on {new Date(envelope.created_at).toLocaleDateString()}
                </p>
                <div className="font-serif text-xl text-gray-800 dark:text-gray-100 leading-relaxed text-center italic mb-6">
                    "{envelope.message}"
                </div>
                
                {envelope.audio_url && (
                    <div className="flex justify-center mb-6">
                        <audio controls src={envelope.audio_url} className="w-full max-w-xs" />
                    </div>
                )}

                <div className="text-center">
                    <button onClick={onClose} className="text-purple-500 hover:text-purple-700 font-bold text-sm uppercase tracking-wide">Close Letter</button>
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center">
                {/* ENVELOPE GRAPHIC */}
                <div 
                    onClick={handleOpen}
                    className={`relative w-64 h-48 bg-gradient-to-b from-purple-100 to-purple-200 shadow-2xl flex items-center justify-center cursor-pointer transition-transform duration-700 ${animating ? 'scale-150 opacity-0' : 'hover:scale-105'} ${isLocked ? 'cursor-not-allowed grayscale opacity-80' : ''}`}
                    style={{ clipPath: 'polygon(0% 0%, 50% 50%, 100% 0%, 100% 100%, 0% 100%)' }}
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/30" style={{ clipPath: 'polygon(0% 0%, 50% 50%, 100% 0%)' }}></div>
                    <div className="z-10 bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <i className={`fas ${isLocked ? 'fa-lock' : 'fa-heart'} text-xl`}></i>
                    </div>
                </div>
                
                {/* INFO */}
                <div className="mt-8 text-center text-white">
                    <h3 className="text-2xl font-bold mb-2">{isSender ? "Your Secret Message" : "A Secret Awaits"}</h3>
                    {isLocked ? (
                        <div className="bg-gray-800/50 px-6 py-3 rounded-full border border-white/10 backdrop-blur">
                            <p className="text-sm text-gray-300 mb-1 uppercase tracking-widest font-bold">Unlocks In</p>
                            <p className="text-2xl font-mono text-yellow-400">{formatDuration(timer)}</p>
                        </div>
                    ) : (
                        <p className="animate-pulse text-purple-300 font-bold uppercase tracking-widest">Tap Envelope to Open</p>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default UxSecret_View;
