
import React from 'react';

interface Props {
  onClick: () => void;
}

const UxGame_TTTButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick} 
      className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 rounded-2xl transition group w-full border border-blue-100 dark:border-gray-600 shadow-sm hover:shadow-md"
    >
      <div className="text-4xl mb-3 group-hover:scale-110 transition transform duration-300 drop-shadow-sm">⭕❌</div>
      <span className="font-bold text-gray-700 dark:text-gray-200">Tic Tac Toe</span>
      <span className="text-[10px] text-green-500 font-bold mt-1 uppercase tracking-wider">Supabase Live</span>
    </button>
  );
};

export default UxGame_TTTButton;
