
import React, { useState, useEffect } from 'react';

interface Props {
  onReact: (emoji: string) => void;
  incomingReaction: { emoji: string; id: string } | null;
}

const EMOJIS = ['❤️', '😂', '😮', '😡', '👏', '🎉'];

const UxWatch_Reactions: React.FC<Props> = ({ onReact, incomingReaction }) => {
  const [floating, setFloating] = useState<{ id: string; emoji: string; x: number }[]>([]);

  useEffect(() => {
    if (incomingReaction) {
        addFloating(incomingReaction.emoji);
    }
  }, [incomingReaction]);

  const addFloating = (emoji: string) => {
    const id = Math.random().toString(36);
    const x = Math.random() * 80 + 10; // 10% to 90% width
    setFloating(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
        setFloating(prev => prev.filter(f => f.id !== id));
    }, 2000);
  };

  const handleClick = (emoji: string) => {
      onReact(emoji);
      addFloating(emoji);
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {/* Floating Emojis */}
        {floating.map(f => (
            <div 
                key={f.id}
                className="absolute bottom-0 text-4xl animate-float-up opacity-0"
                style={{ left: `${f.x}%`, animationDuration: '2s' }}
            >
                {f.emoji}
            </div>
        ))}

        {/* Controls Bar (Visible on Hover) */}
        <div className="absolute bottom-20 right-4 pointer-events-auto bg-black/50 backdrop-blur rounded-full p-2 flex flex-col gap-2 transition opacity-20 hover:opacity-100">
            {EMOJIS.map(e => (
                <button 
                    key={e} 
                    onClick={() => handleClick(e)}
                    className="text-2xl hover:scale-125 transition active:scale-95"
                >
                    {e}
                </button>
            ))}
        </div>
    </div>
  );
};

export default UxWatch_Reactions;
