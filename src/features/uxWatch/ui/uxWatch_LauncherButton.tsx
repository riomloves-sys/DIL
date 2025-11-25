
import React, { useState } from 'react';
import UxWatch_Modal from './uxWatch_Modal';

interface Props {
  chatId: string;
  currentUserUid: string;
}

const UxWatch_LauncherButton: React.FC<Props> = ({ chatId, currentUserUid }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-2xl transition group w-full border border-indigo-100 dark:border-gray-600 shadow-sm hover:shadow-md"
      >
        <div className="text-4xl mb-3 group-hover:scale-110 transition transform duration-300">🍿🎬</div>
        <span className="font-bold text-gray-700 dark:text-gray-200">Watch Party</span>
        <span className="text-[10px] text-indigo-500 font-bold mt-1 uppercase tracking-wider">Sync Video</span>
      </button>

      {isOpen && (
        <UxWatch_Modal 
            isOpen={isOpen} 
            onClose={() => setIsOpen(false)} 
            chatId={chatId} 
            currentUserUid={currentUserUid}
        />
      )}
    </>
  );
};

export default UxWatch_LauncherButton;
