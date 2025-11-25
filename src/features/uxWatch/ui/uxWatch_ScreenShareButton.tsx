
import React from 'react';

interface Props {
  onClick: () => void;
}

const UxWatch_ScreenShareButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-teal-50 hover:bg-teal-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-2xl transition group w-full border border-teal-200 dark:border-gray-600 shadow-sm hover:shadow-md"
    >
      <div className="text-4xl mb-3 group-hover:scale-110 transition transform duration-300">🖥️✨</div>
      <span className="font-bold text-gray-700 dark:text-gray-200">Screen Share</span>
      <span className="text-[10px] text-teal-600 font-bold mt-1 uppercase tracking-wider">Watch Together</span>
    </button>
  );
};

export default UxWatch_ScreenShareButton;
