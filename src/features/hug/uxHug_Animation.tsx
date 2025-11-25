
import React, { useEffect } from 'react';
import { HugEvent, HugType } from './hooks/useHug';

interface Props {
  hug: HugEvent | null;
  onDismiss: () => void;
  onHugBack: (type: HugType) => void;
}

const UxHug_Animation: React.FC<Props> = ({ hug, onDismiss, onHugBack }) => {
  
  useEffect(() => {
    if (hug) {
      // Haptic Feedback Logic
      if (navigator.vibrate) {
        switch (hug.hug_type) {
          case 'soft':
            navigator.vibrate([50, 50, 50]); // Gentle pulses
            break;
          case 'tight':
            navigator.vibrate([200, 50, 500]); // Strong squeeze
            break;
          case 'missyou':
            navigator.vibrate([100, 100, 100, 100, 200]); // Heartbeat pattern
            break;
          case 'sleep':
            navigator.vibrate(100); // Short buzz
            break;
        }
      }

      // Auto dismiss after animation duration
      const timer = setTimeout(() => {
        onDismiss();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [hug, onDismiss]);

  if (!hug) return null;

  const renderContent = () => {
    switch (hug.hug_type) {
      case 'soft':
        return (
          <div className="flex flex-col items-center justify-center animate-fade-in-up">
            <div className="text-9xl filter drop-shadow-xl animate-bounce-slow">🧸</div>
            <h2 className="text-3xl font-serif text-pink-600 dark:text-pink-300 mt-4 font-bold">Soft Hug...</h2>
            <div className="absolute inset-0 bg-pink-200/20 pointer-events-none rounded-full blur-3xl animate-pulse"></div>
          </div>
        );
      case 'tight':
        return (
          <div className="flex flex-col items-center justify-center animate-scale-in">
            <div className="relative">
              <div className="text-9xl animate-squeeze">🤗</div>
              <div className="absolute top-0 left-0 text-9xl animate-ping opacity-50">❤️</div>
            </div>
            <h2 className="text-4xl font-black text-red-500 dark:text-red-400 mt-8 uppercase tracking-widest">Tight Squeeze!</h2>
            <div className="absolute inset-0 border-[20px] border-red-500/30 animate-pulse-fast pointer-events-none"></div>
          </div>
        );
      case 'missyou':
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="text-8xl animate-heartbeat text-purple-500">💜</div>
            <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-300 mt-6 animate-pulse">Missing You...</h2>
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="absolute text-4xl animate-float-up opacity-50" style={{ left: `${20 * i}%`, animationDelay: `${i * 0.5}s` }}>💭</div>
               ))}
            </div>
          </div>
        );
      case 'sleep':
        return (
          <div className="flex flex-col items-center justify-center z-20">
            <div className="text-9xl animate-sway">🌙</div>
            <h2 className="text-2xl font-serif italic text-yellow-200 mt-4">Warm Sleepy Hug</h2>
            <div className="absolute inset-0 bg-orange-900/40 backdrop-blur-sm z-[-1]"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/30 dark:bg-black/40 backdrop-blur-sm animate-fade-in">
      {renderContent()}
      
      <div className="absolute bottom-20 animate-slide-up">
        <button 
          onClick={() => {
            onHugBack(hug.hug_type);
            onDismiss();
          }}
          className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-bold rounded-full shadow-2xl hover:scale-105 transition transform flex items-center gap-2 border border-gray-200 dark:border-gray-700"
        >
          <i className="fas fa-reply"></i> Hug Back
        </button>
      </div>
    </div>
  );
};

export default UxHug_Animation;
