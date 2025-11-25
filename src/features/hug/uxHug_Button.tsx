
import React, { useState } from 'react';
import UxHug_SendMenu from './uxHug_SendMenu';
import { HugType } from './hooks/useHug';
import { useHug } from './hooks/useHug'; // Import purely for type safety if needed, but context usually handles actual sending

interface Props {
  chatId: string;
  currentUserUid: string;
  // We pass a send handler or use the hook directly? 
  // Ideally use the hook inside, but the hook also listens for incoming.
  // We'll instantiate the hook here just for sending.
}

const UxHug_Button: React.FC<Props> = ({ chatId, currentUserUid }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { sendHug } = useHug(chatId, currentUserUid);

  return (
    <>
      <button 
        onClick={() => setShowMenu(true)}
        className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-2xl transition group w-full border border-orange-200 dark:border-gray-600 shadow-sm hover:shadow-md"
      >
        <div className="text-4xl mb-3 group-hover:scale-110 transition transform duration-300 drop-shadow-sm">🫂✨</div>
        <span className="font-bold text-gray-700 dark:text-gray-200">Send Hug</span>
        <span className="text-[10px] text-orange-500 font-bold mt-1 uppercase tracking-wider">Haptic Touch</span>
      </button>

      {showMenu && (
        <UxHug_SendMenu 
          onSend={(type) => sendHug(type)}
          onClose={() => setShowMenu(false)}
        />
      )}
    </>
  );
};

export default UxHug_Button;
