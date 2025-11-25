
import React from 'react';
import { useUxGameTicTacToe } from './useUxGameTicTacToe';

interface Props {
  chatId: string;
  currentUserUid: string;
}

const UxGame_TTTBoard: React.FC<Props> = ({ chatId, currentUserUid }) => {
  const { gameState, makeMove, resetGame, mySymbol, isMyTurn, loading } = useUxGameTicTacToe(chatId, currentUserUid);
  
  if (loading) {
    return <div className="p-8 text-center text-gray-500"><i className="fas fa-circle-notch fa-spin mr-2"></i>Loading Supabase Game...</div>;
  }

  const getStatusText = () => {
    if (gameState.winner) {
      if (gameState.winner === 'draw') return "It's a Draw!";
      return gameState.winner === mySymbol ? '🎉 You Won!' : '😞 You Lost';
    }
    return isMyTurn ? `Your Turn (${mySymbol})` : `Opponent's Turn (${mySymbol === 'X' ? 'O' : 'X'})`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full animate-fade-in">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">Tic Tac Toe</h2>
        <div className={`text-sm font-bold px-4 py-2 rounded-full shadow-sm transition-colors ${
          gameState.winner ? 'bg-yellow-100 text-yellow-700' : 
          isMyTurn ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
        }`}>
          {getStatusText()}
        </div>
      </div>

      <div className="relative">
        {/* Board Grid */}
        <div className="grid grid-cols-3 gap-3 bg-gray-200 dark:bg-gray-700 p-3 rounded-2xl shadow-inner">
          {gameState.board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => makeMove(idx)}
              disabled={!!cell || !!gameState.winner || !isMyTurn}
              className={`w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-gray-800 rounded-xl text-5xl font-black flex items-center justify-center transition-all duration-200 shadow-sm
                ${!cell && isMyTurn && !gameState.winner ? 'hover:bg-blue-50 dark:hover:bg-gray-600 hover:scale-105 cursor-pointer ring-2 ring-transparent hover:ring-blue-300' : 'cursor-default'}
                ${cell === 'X' ? 'text-blue-500' : 'text-red-500'}
              `}
            >
              <span className={cell ? 'animate-pop-in' : ''}>{cell}</span>
            </button>
          ))}
        </div>

        {/* Winner Overlay Line (Simplified as CSS effect via board above) */}
      </div>

      {gameState.winner && (
        <button 
          onClick={resetGame}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-full shadow-lg transition transform hover:scale-105 flex items-center gap-2"
        >
          <i className="fas fa-redo"></i> Play Again
        </button>
      )}

      <div className="mt-8 flex gap-8 text-sm text-gray-400 font-medium">
        <div className={`flex items-center gap-2 ${mySymbol === 'X' ? 'text-blue-500 font-bold' : ''}`}>
           <span className="bg-white dark:bg-gray-800 w-8 h-8 rounded flex items-center justify-center shadow text-blue-500 font-black">X</span> 
           {mySymbol === 'X' ? 'You' : 'Opponent'}
        </div>
        <div className={`flex items-center gap-2 ${mySymbol === 'O' ? 'text-red-500 font-bold' : ''}`}>
           <span className="bg-white dark:bg-gray-800 w-8 h-8 rounded flex items-center justify-center shadow text-red-500 font-black">O</span> 
           {mySymbol === 'O' ? 'You' : 'Opponent'}
        </div>
      </div>
    </div>
  );
};

export default UxGame_TTTBoard;
