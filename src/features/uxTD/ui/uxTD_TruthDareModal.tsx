
import React, { useState, useEffect } from 'react';
import { useUxTD_Game } from '../hooks/useUxTD_Game';
import UxTD_Wheel from '../components/uxTD_Wheel';
import UxTD_SuggestionsPanel from '../components/uxTD_SuggestionsPanel';
import UxTD_ReactionsPanel from '../components/uxTD_ReactionsPanel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentUserUid: string;
}

const UxTD_TruthDareModal: React.FC<Props> = ({ isOpen, onClose, chatId, currentUserUid }) => {
  const { 
      game, isSpinner, isOpponent, canSkip, mySkipCount, loading,
      spinWheel, sendQuestion, sendAnswer, skipTurn, sendReaction, nextTurn, p1 
  } = useUxTD_Game(chatId, currentUserUid);

  const [input, setInput] = useState('');

  // Auto-fill input if needed
  useEffect(() => { setInput(''); }, [game?.task_status]);

  if (!isOpen) return null;
  if (loading || !game) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading...</div>;

  // --- RENDER LOGIC ---
  const isPending = game.task_status === 'pending';
  const isAccepted = game.task_status === 'accepted';
  const isCompleted = game.task_status === 'completed';

  return (
    <div className="fixed inset-0 z-[60] bg-gray-900/95 flex flex-col overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center shadow-md">
            <button onClick={onClose} className="text-gray-400 hover:text-white"><i className="fas fa-arrow-left"></i> Exit</button>
            <div className="flex gap-6 text-sm font-bold">
                <div className={`text-center ${game.turn === p1 ? 'text-blue-400' : 'text-gray-500'}`}>
                    P1: {game.score_user1}
                </div>
                <div className="text-gray-600">VS</div>
                <div className={`text-center ${game.turn !== p1 ? 'text-red-400' : 'text-gray-500'}`}>
                    P2: {game.score_user2}
                </div>
            </div>
            <div className="text-xs text-gray-500">
                Skips Left: <span className={canSkip ? 'text-green-500' : 'text-red-500'}>{3 - mySkipCount}</span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center max-w-lg mx-auto w-full relative">
            
            {/* 1. WHEEL STAGE (Idle) */}
            {game.task_status === 'idle' && (
                <div className="mt-10">
                    <div className={`mb-8 text-center text-sm font-bold uppercase tracking-widest px-4 py-1 rounded-full ${isSpinner ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        {isSpinner ? "Your Turn" : "Opponent's Turn"}
                    </div>
                    <UxTD_Wheel onSpin={spinWheel} disabled={!isSpinner} />
                </div>
            )}

            {/* 2. PENDING STAGE (Opponent Choosing Question) */}
            {isPending && game.task_type !== 'mystery' && (
                <div className="w-full mt-10">
                    <h2 className="text-3xl font-black text-center text-white mb-2 uppercase">{game.task_type}</h2>
                    <p className="text-center text-gray-400 mb-6 text-sm">
                        {isOpponent ? "Choose a challenge for them..." : "Waiting for opponent to choose..."}
                    </p>

                    {isOpponent ? (
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-xl">
                             <UxTD_SuggestionsPanel type={game.task_type as any} onSelect={sendQuestion} />
                             <textarea 
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Or type your own..."
                                className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 outline-none mb-3 min-h-[100px]"
                             />
                             <button 
                                onClick={() => sendQuestion(input)}
                                disabled={!input.trim()}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50"
                             >
                                 SEND CHALLENGE
                             </button>
                        </div>
                    ) : (
                        <div className="flex justify-center my-12">
                            <i className="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
                        </div>
                    )}
                </div>
            )}

            {/* 3. ACCEPTED STAGE (Spinner Answering) */}
            {isAccepted && (
                <div className="w-full mt-8 animate-slide-up">
                     <div className="bg-gray-800 p-6 rounded-2xl border-2 border-yellow-500 shadow-lg text-center mb-6 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
                         <span className="text-xs font-bold bg-yellow-500 text-black px-2 py-0.5 rounded uppercase mb-2 inline-block">
                             {game.task_type}
                         </span>
                         <h3 className="text-xl text-white font-bold mt-2">"{game.task_text}"</h3>
                     </div>

                     {isSpinner ? (
                         <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                             {game.task_type === 'dare' ? (
                                 <div className="text-center">
                                     <p className="text-gray-300 mb-4 text-sm">Perform the dare, then click below.</p>
                                     <button 
                                        onClick={() => sendAnswer("I Completed the Dare!")}
                                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg mb-3"
                                     >
                                         <i className="fas fa-check-circle mr-2"></i> I DID IT
                                     </button>
                                 </div>
                             ) : (
                                 <div>
                                     <p className="text-gray-400 mb-2 text-xs uppercase font-bold">Your Answer:</p>
                                     <textarea 
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 mb-3 min-h-[120px]"
                                        placeholder="Type honestly..."
                                     />
                                     <button 
                                        onClick={() => sendAnswer(input)}
                                        disabled={!input.trim()}
                                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:opacity-50"
                                     >
                                         SUBMIT ANSWER
                                     </button>
                                 </div>
                             )}

                             {/* SKIP BUTTON */}
                             <button 
                                onClick={skipTurn}
                                disabled={!canSkip}
                                className="w-full mt-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 SKIP TURN (-10 PTS) {3 - mySkipCount} LEFT
                             </button>
                         </div>
                     ) : (
                         <div className="text-center text-gray-400 py-8 italic">
                             Waiting for answer...
                         </div>
                     )}
                </div>
            )}

            {/* 4. COMPLETED STAGE (Reactions & Next Turn) */}
            {isCompleted && (
                <div className="w-full mt-8 animate-fade-in text-center">
                    <div className="bg-gray-800/80 p-6 rounded-2xl border border-gray-600 mb-6 backdrop-blur">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Challenge</div>
                        <h3 className="text-white font-bold mb-4 opacity-80">{game.task_text}</h3>
                        
                        <div className="w-full h-px bg-gray-700 mb-4"></div>
                        
                        <div className="text-xs text-green-500 uppercase font-bold mb-1">Answer</div>
                        <h2 className="text-2xl text-white font-black italic">"{game.task_answer}"</h2>
                    </div>

                    {/* Floating Reaction Effect */}
                    {game.last_reaction && (
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl animate-ping opacity-50 pointer-events-none">
                            {game.last_reaction}
                        </div>
                    )}

                    {isOpponent && <UxTD_ReactionsPanel onReact={sendReaction} />}

                    {isOpponent && (
                        <button 
                            onClick={nextTurn}
                            className="mt-8 px-10 py-4 bg-white text-black font-black rounded-full shadow-2xl hover:scale-105 transition animate-bounce"
                        >
                            NEXT TURN <i className="fas fa-arrow-right ml-2"></i>
                        </button>
                    )}
                    
                    {isSpinner && (
                        <p className="text-gray-500 text-sm mt-8 animate-pulse">Partner is reacting...</p>
                    )}
                </div>
            )}

        </div>
    </div>
  );
};

export default UxTD_TruthDareModal;
