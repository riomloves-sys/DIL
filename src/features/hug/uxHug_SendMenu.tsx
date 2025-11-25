
import React from 'react';
import { HugType } from './hooks/useHug';

interface Props {
  onSend: (type: HugType) => void;
  onClose: () => void;
}

const HUG_OPTIONS: { type: HugType; label: string; icon: string; color: string }[] = [
  { type: 'soft', label: 'Soft Hug', icon: '🧸', color: 'bg-pink-100 text-pink-600 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300' },
  { type: 'tight', label: 'Tight Squeeze', icon: '🤗', color: 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300' },
  { type: 'missyou', label: 'Miss You', icon: '💜', color: 'bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300' },
  { type: 'sleep', label: 'Sleepy Hug', icon: '🌙', color: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300' },
];

const UxHug_SendMenu: React.FC<Props> = ({ onSend, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span className="text-2xl">🫂</span> Send a Virtual Hug
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {HUG_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => {
                onSend(opt.type);
                onClose();
              }}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition transform hover:scale-105 active:scale-95 ${opt.color}`}
            >
              <span className="text-4xl mb-2 filter drop-shadow-sm">{opt.icon}</span>
              <span className="font-bold text-sm">{opt.label}</span>
            </button>
          ))}
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-6 italic">
          Partner will feel a vibration and see the hug instantly.
        </p>
      </div>
    </div>
  );
};

export default UxHug_SendMenu;
