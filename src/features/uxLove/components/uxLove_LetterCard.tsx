
import React from 'react';
import { LoveLetter } from '../hooks/useUxLoveLetters';

interface Props {
  letter: LoveLetter;
  currentUserUid: string;
  onClick: () => void;
}

const UxLove_LetterCard: React.FC<Props> = ({ letter, currentUserUid, onClick }) => {
  const isSender = letter.sender_uid === currentUserUid;
  const date = new Date(letter.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div 
      onClick={onClick}
      className={`relative p-4 rounded-xl border cursor-pointer transition transform hover:-translate-y-1 hover:shadow-lg
        ${isSender 
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
          : (letter.is_read 
              ? 'bg-pink-50 dark:bg-pink-900/10 border-pink-100 dark:border-pink-900/30' 
              : 'bg-pink-100 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800 shadow-md')
        }
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className={`font-serif font-bold text-lg truncate pr-2 ${isSender ? 'text-gray-800 dark:text-gray-200' : 'text-pink-900 dark:text-pink-100'}`}>
          {letter.title}
        </h4>
        {letter.is_locked && (
          <span className="text-yellow-500" title="Locked with PIN"><i className="fas fa-lock"></i></span>
        )}
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 font-serif italic mb-3">
        {letter.is_encrypted ? "🔒 Encrypted Content..." : (letter.is_locked ? "🔑 Locked Content..." : letter.body)}
      </p>

      <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-wider">
        <span>{isSender ? 'Sent' : 'From Partner'} • {date}</span>
        {letter.is_read && isSender && <span className="text-green-500"><i className="fas fa-check-double"></i> Read</span>}
        {!letter.is_read && !isSender && <span className="bg-pink-500 text-white px-2 py-0.5 rounded-full">New</span>}
      </div>
    </div>
  );
};

export default UxLove_LetterCard;
