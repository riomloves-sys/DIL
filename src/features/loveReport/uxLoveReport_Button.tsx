
import React, { useState } from 'react';
import UxLoveReport_Dashboard from './uxLoveReport_Dashboard';

interface Props {
  chatId: string;
  currentUserUid: string;
}

const UxLoveReport_Button: React.FC<Props> = ({ chatId, currentUserUid }) => {
  const [show, setShow] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShow(true)}
        className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-red-50 hover:from-pink-100 hover:to-red-100 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 rounded-2xl transition group w-full border border-pink-200 dark:border-gray-600 shadow-sm hover:shadow-md"
      >
        <div className="text-4xl mb-3 group-hover:scale-110 transition transform duration-300 drop-shadow-sm">📊❤️</div>
        <span className="font-bold text-gray-700 dark:text-gray-200">Love Report</span>
        <span className="text-[10px] text-pink-500 font-bold mt-1 uppercase tracking-wider">Weekly AI</span>
      </button>

      {show && (
        <UxLoveReport_Dashboard 
           isOpen={show} 
           onClose={() => setShow(false)} 
           chatId={chatId}
           currentUserUid={currentUserUid}
        />
      )}
    </>
  );
};

export default UxLoveReport_Button;
