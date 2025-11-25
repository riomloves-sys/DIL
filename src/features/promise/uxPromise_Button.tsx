
import React from 'react';

interface Props {
  onClick: () => void;
}

const UxPromise_Button: React.FC<Props> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-gray-700 rounded-full transition relative group"
      title="Promise Tracker"
    >
      <i className="fas fa-hand-holding-heart"></i>
      {/* Tooltip for desktop */}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
         Promises
      </span>
    </button>
  );
};

export default UxPromise_Button;
