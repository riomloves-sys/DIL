
import React, { useState } from 'react';
import UxLove_Modal from './uxLove_Modal';

interface Props {
  chatId?: string;
  currentUserUid?: string;
}

const UxLove_Button: React.FC<Props> = ({ chatId, currentUserUid }) => {
  const [show, setShow] = useState(false);

  if (!chatId || !currentUserUid) return null;

  // Helper to find partner UID (simple logic: split chatID, find not me)
  const partnerUid = chatId.split('_').find(id => id !== currentUserUid) || 'unknown';

  return (
    <>
      <button 
        onClick={() => setShow(true)}
        className="flex flex-col items-center justify-center p-4 bg-pink-50 hover:bg-pink-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-2xl transition group w-full border border-pink-100 dark:border-gray-600 shadow-sm hover:shadow-md"
      >
        <div className="text-4xl mb-3 group-hover:scale-110 transition transform duration-300">💌</div>
        <span className="font-bold text-gray-700 dark:text-gray-200">Love Letters</span>
        <span className="text-[10px] text-pink-500 font-bold mt-1 uppercase tracking-wider">Encrypted</span>
      </button>

      {show && (
        <UxLove_Modal 
           isOpen={show} 
           onClose={() => setShow(false)} 
           chatId={chatId}
           currentUserUid={currentUserUid}
        />
      )}
    </>
  );
};

export default UxLove_Button;
