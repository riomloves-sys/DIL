
import React from 'react';

interface Props {
  onReact: (emoji: string) => void;
}

const REACTIONS = ['❤️', '😂', '😢', '😳', '😍', '👍', '😡', '🔥'];

const UxTD_ReactionsPanel: React.FC<Props> = ({ onReact }) => {
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex gap-2 animate-bounce-in shadow-2xl z-50">
        {REACTIONS.map(emoji => (
            <button
                key={emoji}
                onClick={() => onReact(emoji)}
                className="text-2xl hover:scale-125 transition transform active:scale-90"
            >
                {emoji}
            </button>
        ))}
    </div>
  );
};

export default UxTD_ReactionsPanel;
