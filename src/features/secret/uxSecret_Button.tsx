
import React, { useState } from 'react';
import UxSecret_List from './uxSecret_List';

interface Props {
  chatId?: string;
  currentUserUid?: string;
}

const UxSecret_Button: React.FC<Props> = ({ chatId, currentUserUid }) => {
  const [show, setShow] = useState(false);

  if (!chatId || !currentUserUid) return null;

  return (
    <>
      <button 
        onClick={() => setShow(true)}
        className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-2xl transition group w-full border border-purple-100 dark:border-gray-600 shadow-sm hover:shadow-md"
      >
        <div className="text-4xl mb-3 group-hover:scale-110 transition transform duration-300 drop-shadow-sm">🤐✉️</div>
        <span className="font-bold text-gray-700 dark:text-gray-200">Secrets</span>
        <span className="text-[10px] text-purple-500 font-bold mt-1 uppercase tracking-wider">Time Lock</span>
      </button>

      {show && (
        <UxSecret_List 
           isOpen={show} 
           onClose={() => setShow(false)} 
           chatId={chatId}
           currentUserUid={currentUserUid}
        />
      )}
    </>
  );
};

export default UxSecret_Button;
