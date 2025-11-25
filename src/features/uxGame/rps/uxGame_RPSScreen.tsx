
import React from 'react';
import { useUxGameRPS } from './useUxGameRPS';

interface Props {
  chatId: string;
  currentUserUid: string;
}

const OPTIONS = [
    { id: 'rock', emoji: '👊', label: 'Rock' },
    { id: 'paper', emoji: '🖐', label: 'Paper' },
    { id: 'scissors', emoji: '✌️', label: 'Scissors' },
];

const UxGame_RPSScreen: React.FC<Props> = ({ chatId, currentUserUid }) => {
  const { game, chooseOption, resetGame, isP1 } = useUxGameRPS(chatId, currentUserUid);

  const myChoice = isP1 ? game.p1Choice : game.p2Choice;
  const oppChoice = isP1 ? game.p2Choice : game.p1Choice;
  const isRevealed = !!game.result;

  const getResultHeader = () => {
      if (!game.result) return "WAITING FOR PARTNER...";
      if (game.result === 'draw') return "IT'S A DRAW!";
      const iWon = (isP1 && game.result === 'p1') || (!isP1 && game.result === 'p2');
      return iWon ? "🎉 YOU WON!" : "💀 YOU LOST";
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full animate-fade-in bg-gray-50 dark:bg-gray-900 relative">
        
        {/* Permanent Restart Button */}
        <button 
            onClick={resetGame}
            className="absolute top-2 right-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
            <i className="fas fa-redo mr-1"></i> Restart
        </button>

        <div className="text-center mb-8 mt-4">
            <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Rock Paper Scissors</h2>
            <div className="h-6">
                {isRevealed ? (
                    <span className="text-sm font-bold text-blue-500 uppercase tracking-widest animate-pulse">{game.reason}</span>
                ) : (
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Arena</span>
                )}
            </div>
        </div>

        {/* Hand Area */}
        <div className="flex justify-center items-center gap-4 sm:gap-12 mb-12 w-full max-w-md">
            {/* My Hand */}
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">You</span>
                <div className={`w-28 h-28 flex items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-4 transition-all duration-500 
                    ${isRevealed ? (game.result === 'draw' ? 'border-yellow-400' : (game.result === (isP1 ? 'p1' : 'p2') ? 'border-green-500 scale-110 z-10' : 'border-red-500 opacity-80')) : 'border-gray-100 dark:border-gray-700'}
                `}>
                    <div className="text-6xl filter drop-shadow-md">
                        {myChoice ? (OPTIONS.find(o => o.id === myChoice)?.emoji) : '🤔'}
                    </div>
                </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center justify-center">
                 <span className="text-3xl font-black text-gray-200 dark:text-gray-700 italic">VS</span>
            </div>

            {/* Opponent Hand */}
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">Partner</span>
                <div className={`w-28 h-28 flex items-center justify-center bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-4 transition-all duration-500 
                    ${isRevealed ? (game.result === 'draw' ? 'border-yellow-400' : (game.result === (isP1 ? 'p2' : 'p1') ? 'border-green-500 scale-110 z-10' : 'border-red-500 opacity-80')) : 'border-gray-100 dark:border-gray-700'}
                `}>
                    <div className="text-6xl filter drop-shadow-md">
                        {isRevealed 
                            ? (OPTIONS.find(o => o.id === oppChoice)?.emoji || '🤔') 
                            : (oppChoice ? '🔒' : '🤔')}
                    </div>
                </div>
            </div>
        </div>

        {/* Result & Controls */}
        {isRevealed ? (
            <div className="text-center animate-bounce-in w-full max-w-xs">
                <h3 className={`text-4xl font-black mb-6 ${game.result === 'draw' ? 'text-yellow-500' : (getResultHeader().includes('WON') ? 'text-green-500' : 'text-red-500')}`}>
                    {getResultHeader()}
                </h3>
                <button 
                    onClick={resetGame}
                    className="w-full px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl shadow-2xl hover:scale-[1.02] transition flex items-center justify-center gap-2"
                >
                    <i className="fas fa-redo"></i> Play Again
                </button>
            </div>
        ) : (
            <div className="w-full max-w-sm animate-fade-in-up">
                <p className="text-center text-gray-500 font-bold text-sm mb-6 uppercase tracking-wide">
                    {myChoice ? "Waiting for partner..." : "Choose your weapon!"}
                </p>
                <div className="flex justify-between gap-3">
                    {OPTIONS.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => chooseOption(opt.id)}
                            disabled={!!myChoice}
                            className={`flex flex-col items-center p-4 rounded-2xl transition flex-1 border-b-4 active:border-b-0 active:translate-y-1 shadow-sm
                                ${myChoice === opt.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 ring-2 ring-blue-500 transform scale-105' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
                                ${myChoice && myChoice !== opt.id ? 'opacity-40 grayscale cursor-not-allowed' : ''}
                            `}
                        >
                            <span className="text-4xl mb-2 filter drop-shadow-md">{opt.emoji}</span>
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default UxGame_RPSScreen;
