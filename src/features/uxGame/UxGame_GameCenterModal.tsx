
import React, { useState } from 'react';
import UxGame_TTTButton from './ticTacToe/uxGame_TTTButton';
import UxGame_TTTBoard from './ticTacToe/uxGame_TTTBoard';
import UxGame_EmojiBattleButton from './emojiBattle/uxGame_EmojiBattleButton';
import UxGame_EmojiBattleScreen from './emojiBattle/uxGame_EmojiBattleScreen';
import UxGame_RPSButton from './rps/uxGame_RPSButton';
import UxGame_RPSScreen from './rps/uxGame_RPSScreen';
import UxGame_MemoryMatchButton from './memoryMatch/uxGame_MemoryMatchButton';
import UxGame_MemoryMatchBoard from './memoryMatch/uxGame_MemoryMatchBoard';
import UxTD_TruthDareButton from '../uxTD/ui/uxTD_TruthDareButton';
import UxLove_Button from '../uxLove/ui/uxLove_Button'; 
import UxWatch_LauncherButton from '../uxWatch/ui/uxWatch_LauncherButton'; 
import UxWatch_ScreenShareButton from '../uxWatch/ui/uxWatch_ScreenShareButton';
import UxSecret_Button from '../secret/uxSecret_Button'; 
import UxHug_Button from '../hug/uxHug_Button'; 
import UxLoveReport_Button from '../loveReport/uxLoveReport_Button'; // ADDED

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentUserUid: string;
  onStartScreenShare?: () => void; 
}

type GameType = 'menu' | 'ticTacToe' | 'emojiBattle' | 'rps' | 'memoryMatch';

const UxGame_GameCenterModal: React.FC<Props> = ({ isOpen, onClose, chatId, currentUserUid, onStartScreenShare }) => {
  const [activeGame, setActiveGame] = useState<GameType>('menu');

  if (!isOpen) return null;

  const renderGame = () => {
    switch (activeGame) {
      case 'ticTacToe':
        return <UxGame_TTTBoard chatId={chatId} currentUserUid={currentUserUid} />;
      case 'emojiBattle':
        return <UxGame_EmojiBattleScreen chatId={chatId} currentUserUid={currentUserUid} />;
      case 'rps':
        return <UxGame_RPSScreen chatId={chatId} currentUserUid={currentUserUid} />;
      case 'memoryMatch':
        return <UxGame_MemoryMatchBoard chatId={chatId} currentUserUid={currentUserUid} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden h-[80vh] flex flex-col relative">
        
        {/* Header */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            {activeGame !== 'menu' && (
              <button onClick={() => setActiveGame('menu')} className="mr-2 text-gray-500 hover:text-blue-500 transition">
                <i className="fas fa-arrow-left text-xl"></i>
              </button>
            )}
            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <i className="fas fa-gamepad text-purple-500"></i>
              {activeGame === 'menu' ? 'Apps & Games' : 'Playing Game'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-black/20 rounded-full w-8 h-8 flex items-center justify-center transition">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 relative">
          
          {activeGame === 'menu' ? (
            <div className="p-6 grid grid-cols-2 gap-4">
               {/* Screen Share Button */}
               {onStartScreenShare && (
                 <UxWatch_ScreenShareButton onClick={() => { onClose(); onStartScreenShare(); }} />
               )}

               {/* Love Report (Added) */}
               <UxLoveReport_Button chatId={chatId} currentUserUid={currentUserUid} />

               {/* Existing Apps */}
               <UxHug_Button chatId={chatId} currentUserUid={currentUserUid} />
               <UxWatch_LauncherButton chatId={chatId} currentUserUid={currentUserUid} />
               <UxSecret_Button chatId={chatId} currentUserUid={currentUserUid} />

               {/* Games */}
               <UxGame_TTTButton onClick={() => setActiveGame('ticTacToe')} />
               <UxGame_EmojiBattleButton onClick={() => setActiveGame('emojiBattle')} />
               <UxGame_RPSButton onClick={() => setActiveGame('rps')} />
               <UxGame_MemoryMatchButton onClick={() => setActiveGame('memoryMatch')} />
               
               <UxTD_TruthDareButton chatId={chatId} currentUserUid={currentUserUid} />
               <UxLove_Button chatId={chatId} currentUserUid={currentUserUid} />
            </div>
          ) : (
            <div className="h-full w-full">
               {renderGame()}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default UxGame_GameCenterModal;
