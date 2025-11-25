
import React, { useState } from 'react';
import UxTD_TruthDareModal from './uxTD_TruthDareModal';

interface Props {
  chatId?: string;
  currentUserUid?: string;
}

const UxTD_TruthDareButton: React.FC<Props> = ({ chatId, currentUserUid }) => {
  const [show, setShow] = useState(false);

  if (!chatId || !currentUserUid) return null;

  return (
    <>
      <button 
        onClick={() => setShow(true)}
        className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-black rounded-2xl transition group w-full border border-red-900 shadow-md hover:shadow-red-900/50 cursor-pointer"
      >
        <div className="text-4xl mb-3 group-hover:scale-110 transition transform duration-300">😈</div>
        <span className="font-bold text-red-500">Truth or Dare</span>
        <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">Danger Mode</span>
      </button>

      {show && (
        <UxTD_TruthDareModal 
           isOpen={show} 
           onClose={() => setShow(false)} 
           chatId={chatId}
           currentUserUid={currentUserUid}
        />
      )}
    </>
  );
};

export default UxTD_TruthDareButton;
