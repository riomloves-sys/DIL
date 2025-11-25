
import React, { useState } from 'react';

interface Props {
  onSpin: (result: string) => void;
  disabled: boolean;
}

const SECTORS = [
  { id: 'truth', label: 'TRUTH', color: '#3b82f6' },
  { id: 'dare', label: 'DARE', color: '#ef4444' },
  { id: 'mystery', label: 'MYSTERY', color: '#8b5cf6' },
  { id: 'danger', label: 'DANGER', color: '#111827' },
  { id: 'truth', label: 'TRUTH', color: '#3b82f6' },
  { id: 'dare', label: 'DARE', color: '#ef4444' }
];

const UxTD_Wheel: React.FC<Props> = ({ onSpin, disabled }) => {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const handleSpin = () => {
    if (disabled || spinning) return;
    setSpinning(true);

    const randomDeg = Math.floor(Math.random() * 360);
    const totalRotation = rotation + 1800 + randomDeg; // 5 spins min
    setRotation(totalRotation);

    setTimeout(() => {
        setSpinning(false);
        const normalized = totalRotation % 360;
        const sectorSize = 360 / SECTORS.length;
        // Pointer is at top (0 deg). Rotation pushes wheel clockwise.
        // Index calculation:
        const index = Math.floor(((360 - normalized) % 360) / sectorSize);
        onSpin(SECTORS[index].id);
    }, 4000);
  };

  const gradient = `conic-gradient(${SECTORS.map((s, i) => {
      const start = i * (100 / SECTORS.length);
      const end = (i + 1) * (100 / SECTORS.length);
      return `${s.color} ${start}% ${end}%`;
  }).join(', ')})`;

  return (
    <div className="flex flex-col items-center">
        <div className="relative w-72 h-72">
            {/* Pointer */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-yellow-400 drop-shadow-lg"></div>

            {/* Wheel */}
            <div 
                className="w-full h-full rounded-full border-4 border-gray-800 shadow-2xl overflow-hidden relative"
                style={{ 
                    background: gradient,
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none'
                }}
            >
                {SECTORS.map((s, i) => {
                    const angle = (360 / SECTORS.length) * i + (360 / SECTORS.length) / 2;
                    return (
                        <div 
                            key={i} 
                            className="absolute top-0 left-1/2 w-0 h-1/2 origin-bottom flex justify-center pt-4"
                            style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
                        >
                            <span className="text-white font-black text-sm tracking-widest uppercase [writing-mode:vertical-rl] drop-shadow-md">
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Center Button */}
            <button 
                onClick={handleSpin}
                disabled={disabled || spinning}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-4 border-white shadow-xl flex items-center justify-center font-bold z-10 transition-transform ${
                    disabled ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-white text-gray-900 hover:scale-110 active:scale-95'
                }`}
            >
                {spinning ? '...' : 'SPIN'}
            </button>
        </div>
        <p className="mt-6 text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            {spinning ? 'Fate is deciding...' : (disabled ? 'Waiting for opponent...' : 'Tap center to spin')}
        </p>
    </div>
  );
};

export default UxTD_Wheel;
