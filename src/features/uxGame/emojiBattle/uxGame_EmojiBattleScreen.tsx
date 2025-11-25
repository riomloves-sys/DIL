
import React from 'react';
import { useUxGameEmojiBattle } from './useUxGameEmojiBattle';

interface Props {
  chatId: string;
  currentUserUid: string;
}

const FIGHT_EMOJIS = ['🔥', '⚡', '💣', '🐉', '🌪️', '🥊', '🦍', '🐅', '🦖', '🦈', '🦅', '🦄'];

const UxGame_EmojiBattleScreen: React.FC<Props> = ({ chatId, currentUserUid }) => {
  const { battle, chooseEmoji, nextRound, isP1, getLogicText } = useUxGameEmojiBattle(chatId, currentUserUid);

  const myChoice = isP1 ? battle.p1Choice : battle.p2Choice;
  const oppChoice = isP1 ? battle.p2Choice : battle.p1Choice;

  // UI Text Logic
  let headerText = 'CHOOSE YOUR FIGHTER';
  let subText = 'Tap an emoji below';
  let headerColor = 'text-gray-800 dark:text-white';
  
  if (battle.status === 'selecting') {
      if (!myChoice) {
          headerText = 'YOUR TURN';
          subText = 'Select an emoji to battle!';
          headerColor = 'text-blue-500 animate-pulse';
      } else {
          headerText = 'WAITING...';
          subText = 'Opponent is choosing...';
          headerColor = 'text-gray-500';
      }
  } else if (battle.status === 'revealed') {
      if (!battle.winner) {
          headerText = 'JUDGING...';
          subText = 'Comparing power levels...';
      } else {
          const iWon = (isP1 && battle.winner === 'p1') || (!isP1 && battle.winner === 'p2');
          
          if (battle.winner === 'draw') {
              headerText = 'IT\'S A DRAW!';
              headerColor = 'text-yellow-500';
          } else if (iWon) {
              headerText = 'VICTORY!';
              headerColor = 'text-green-500';
          } else {
              headerText = 'DEFEAT!';
              headerColor = 'text-red-500';
          }
          subText = getLogicText(battle.winner, battle.p1Choice, battle.p2Choice);
      }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full animate-fade-in bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      
      {/* Scoreboard */}
      <div className="flex justify-between w-full max-w-md mb-4 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
         <div className="text-center">
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">You</div>
             <div className="text-3xl font-black text-blue-500">{battle.p1Score}</div>
         </div>
         <div className="flex flex-col items-center justify-center">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Round</div>
             <div className="text-xl font-black text-gray-700 dark:text-gray-200">{battle.round}</div>
         </div>
         <div className="text-center">
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rival</div>
             <div className="text-3xl font-black text-red-500">{battle.p2Score}</div>
         </div>
      </div>

      {/* Battle Status Text */}
      <div className="text-center mb-6 h-16 flex flex-col justify-center">
          <h2 className={`text-3xl font-black italic tracking-tighter drop-shadow-sm transition-all duration-300 ${headerColor}`}>
              {headerText}
          </h2>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">
              {subText}
          </p>
      </div>

      {/* Main Arena */}
      <div className="relative w-full max-w-sm aspect-square bg-white dark:bg-gray-800 rounded-3xl mb-6 flex items-center justify-center overflow-hidden border-4 border-gray-100 dark:border-gray-700 shadow-inner">
          
          {/* VS Element */}
          <div className="absolute z-10 bg-black text-white font-black text-xl p-2 rounded-full border-4 border-white dark:border-gray-800 shadow-2xl">VS</div>

          {/* Left Fighter (You) */}
          <div className={`absolute left-0 w-1/2 h-full flex items-center justify-center transition-all duration-700 transform 
              ${battle.status === 'revealed' ? 'translate-x-4 scale-125' : 'scale-100'}
          `}>
              <div className={`text-7xl filter drop-shadow-xl transition-all ${battle.status === 'selecting' && !myChoice ? 'opacity-20 grayscale' : 'opacity-100'}`}>
                  {myChoice || '👤'}
              </div>
          </div>

          {/* Right Fighter (Enemy) */}
          <div className={`absolute right-0 w-1/2 h-full flex items-center justify-center transition-all duration-700 transform 
              ${battle.status === 'revealed' ? '-translate-x-4 scale-125' : 'scale-100'}
          `}>
               <div className="text-7xl filter drop-shadow-xl transition-all">
                   {battle.status === 'revealed' ? oppChoice : (oppChoice ? '🔒' : '👤')}
               </div>
          </div>
          
          {/* Winner Glow Effect */}
          {battle.status === 'revealed' && battle.winner && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <div className={`w-full h-full opacity-10 transition-colors duration-500 ${
                      battle.winner === 'draw' ? 'bg-yellow-500' :
                      ((isP1 && battle.winner === 'p1') || (!isP1 && battle.winner === 'p2')) ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
              </div>
          )}
      </div>

      {/* Controls */}
      {battle.status === 'selecting' ? (
          <div className="w-full max-w-sm animate-slide-up">
              <div className="grid grid-cols-4 gap-3">
                  {FIGHT_EMOJIS.map(e => (
                      <button 
                        key={e}
                        onClick={() => chooseEmoji(e)}
                        disabled={!!myChoice}
                        className={`aspect-square text-3xl bg-white dark:bg-gray-700 rounded-xl shadow-sm border-b-4 border-gray-200 dark:border-gray-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center
                            ${myChoice === e ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500 transform scale-105 z-10' : 'hover:scale-110'} 
                            ${myChoice && myChoice !== e ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                        `}
                      >
                          {e}
                      </button>
                  ))}
              </div>
              {!myChoice && <p className="text-center text-xs text-gray-400 mt-4 animate-pulse">Tap to lock in your fighter!</p>}
          </div>
      ) : (
          <div className="text-center animate-fade-in-up w-full max-w-sm">
              <button 
                onClick={nextRound} 
                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                  NEXT ROUND <i className="fas fa-forward"></i>
              </button>
          </div>
      )}
    </div>
  );
};

export default UxGame_EmojiBattleScreen;
