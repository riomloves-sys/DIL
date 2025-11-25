
import React from 'react';
import { useUxGameMemoryMatch } from './useUxGameMemoryMatch';

interface Props {
  chatId: string;
  currentUserUid: string;
}

const UxGame_MemoryMatchBoard: React.FC<Props> = ({ chatId, currentUserUid }) => {
  const { game, flipCard, resetGame, isMyTurn, p1 } = useUxGameMemoryMatch(chatId, currentUserUid);
  
  // Loading state
  if (!game || !game.cards || game.cards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
            <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
            <p className="text-gray-500">Shuffling Deck...</p>
        </div>
      );
  }

  const isGameOver = game.winner !== null;
  const isP1 = currentUserUid === p1;
  const winnerText = game.winner === 'draw' ? 'Game Drawn!' : (
      (game.winner === 'p1' && isP1) || (game.winner === 'p2' && !isP1) ? '🎉 You Won!' : '💀 You Lost!'
  );

  return (
    <div className="flex flex-col items-center justify-center p-4 h-full w-full animate-fade-in bg-gray-50 dark:bg-gray-900 relative">
      
      {/* Feedback Popup */}
      {game.lastMoveResult && (
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-3 rounded-full shadow-2xl animate-bounce-in font-bold text-white text-xl
              ${game.lastMoveResult === 'match' ? 'bg-green-500' : 'bg-red-500'}
          `}>
              {game.lastMoveResult === 'match' ? 'MATCH FOUND! 🎉' : 'TRY AGAIN ❌'}
          </div>
      )}

      {/* Header & Instructions */}
      <div className="w-full max-w-sm mb-4 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Memory Match</h2>
              <p className="text-xs text-gray-600 dark:text-gray-300">Find matching pairs. Each match = 1 point + extra turn.</p>
          </div>
      </div>

      {/* Scoreboard */}
      <div className="flex justify-between w-full max-w-sm mb-6 px-2 items-center">
          <div className={`flex flex-col items-center p-3 rounded-2xl min-w-[90px] transition-all duration-300 ${game.p1Turn ? 'bg-blue-100 ring-4 ring-blue-500/30 scale-110 z-10' : 'bg-gray-100 opacity-60 scale-90'}`}>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Player 1</div>
              <div className="text-3xl font-black text-blue-600">{game.p1Score}</div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
               {!isGameOver && (
                   <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm transition-colors ${isMyTurn ? 'bg-green-500 text-white animate-pulse' : 'bg-gray-200 text-gray-500'}`}>
                       {isMyTurn ? 'Your Turn' : "Partner's Turn"}
                   </div>
               )}
          </div>
          
          <div className={`flex flex-col items-center p-3 rounded-2xl min-w-[90px] transition-all duration-300 ${!game.p1Turn ? 'bg-red-100 ring-4 ring-red-500/30 scale-110 z-10' : 'bg-gray-100 opacity-60 scale-90'}`}>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Player 2</div>
              <div className="text-3xl font-black text-red-600">{game.p2Score}</div>
          </div>
      </div>

      {isGameOver ? (
          <div className="text-center animate-bounce-in mb-8 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl w-full max-w-sm">
              <div className="text-5xl mb-4">{game.winner === 'draw' ? '🤝' : (winnerText.includes('Won') ? '🏆' : '🤡')}</div>
              <h3 className={`text-3xl font-black mb-6 ${winnerText.includes('Won') ? 'text-green-500' : 'text-gray-700 dark:text-white'}`}>{winnerText}</h3>
              <p className="text-gray-400 mb-6 text-sm">Final Score: {game.p1Score} - {game.p2Score}</p>
              <button 
                onClick={resetGame} 
                className="w-full px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:scale-105 transition shadow-lg"
              >
                Play Again
              </button>
          </div>
      ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full max-w-sm">
              {game.cards.map((card) => (
                  <div 
                    key={card.id}
                    onClick={() => flipCard(card.id)}
                    className={`aspect-[3/4] rounded-xl cursor-pointer transition-all duration-500 transform relative 
                        ${card.isMatched ? 'opacity-40 scale-95' : 'hover:scale-105'}
                        ${!card.isFlipped && !isMyTurn ? 'cursor-not-allowed opacity-80' : ''}
                    `}
                    style={{ perspective: '1000px' }}
                  >
                      <div className={`w-full h-full absolute inset-0 rounded-xl flex items-center justify-center text-4xl shadow-[0_3px_10px_rgb(0,0,0,0.2)] transition-all duration-300 backface-hidden
                          ${card.isFlipped 
                            ? 'bg-white dark:bg-gray-700 rotate-y-0' 
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 rotate-y-180'
                          }
                          ${card.isMatched ? 'ring-4 ring-green-400' : ''}
                      `}>
                          <div className={card.isFlipped ? 'animate-pop-in' : 'hidden'}>
                            {card.emoji}
                          </div>
                          {!card.isFlipped && (
                              <span className="text-2xl opacity-20 text-white font-bold">?</span>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default UxGame_MemoryMatchBoard;
