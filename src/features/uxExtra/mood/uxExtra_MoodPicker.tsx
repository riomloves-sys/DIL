import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string, label: string, color: string) => void;
}

const MOODS = [
  { emoji: '😍', label: 'Romantic', color: 'pink-500' },
  { emoji: '😘', label: 'Missing You', color: 'purple-500' },
  { emoji: '🤗', label: 'Want Hug', color: 'orange-400' },
  { emoji: '🔥', label: 'Hot', color: 'red-600' },
  { emoji: '😞', label: 'Upset', color: 'blue-800' },
  { emoji: '😡', label: 'Angry', color: 'red-500' },
  { emoji: '😴', label: 'Sleepy', color: 'slate-400' },
  { emoji: '🤒', label: 'Unwell', color: 'green-600' },
  { emoji: '🥳', label: 'Party', color: 'yellow-500' },
  { emoji: '🤫', label: 'Secret', color: 'indigo-500' },
  { emoji: '🥺', label: 'Pleading', color: 'cyan-500' },
  { emoji: '👻', label: 'Ghosting', color: 'gray-300' },
];

const UxExtra_MoodPicker: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-in transform scale-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Set Your Mood</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          {MOODS.map((m) => (
            <button
              key={m.label}
              onClick={() => {
                onSelect(m.emoji, m.label, m.color);
                onClose();
              }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="text-3xl p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition transform group-hover:scale-110">
                {m.emoji}
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium text-center leading-tight">
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UxExtra_MoodPicker;
