import React from 'react';

interface Props {
  onClick: () => void;
}

const UxGame_EmojiBattleButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-2xl transition group w-full border border-orange-100 dark:border-gray-600 shadow-sm hover:shadow-md">
      <div className="text-4xl mb-3 group-hover:scale-110 transition transform duration-300">🥊🐉</div>
      <span className="font-bold text-gray-700 dark:text-gray-200">Emoji Battle</span>
      <span className="text-[10px] text-green-500 font-bold mt-1 uppercase tracking-wider">Supabase Live</span>
    </button>
  );
};

export default UxGame_EmojiBattleButton;
