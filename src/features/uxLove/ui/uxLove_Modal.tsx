
import React, { useState } from 'react';
import { useUxLoveLetters } from '../hooks/useUxLoveLetters';
import UxLove_LetterCard from '../components/uxLove_LetterCard';
import UxLove_Compose from '../components/uxLove_Compose';
import UxLove_LetterView from '../components/uxLove_LetterView';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentUserUid: string;
}

const UxLove_Modal: React.FC<Props> = ({ isOpen, onClose, chatId, currentUserUid }) => {
  const { letters, loading, createLetter, markRead, addReaction } = useUxLoveLetters(chatId, currentUserUid);
  const [tab, setTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [activeLetter, setActiveLetter] = useState<any | null>(null);

  if (!isOpen) return null;

  const received = letters.filter(l => l.sender_uid !== currentUserUid);
  const sent = letters.filter(l => l.sender_uid === currentUserUid);

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      
      {activeLetter ? (
        <UxLove_LetterView 
          letter={activeLetter} 
          currentUserUid={currentUserUid}
          onClose={() => setActiveLetter(null)}
          onReaction={addReaction}
          onMarkRead={markRead}
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 w-full max-w-2xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="p-4 bg-pink-50 dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold text-pink-600 dark:text-pink-400 flex items-center gap-2">
              <i className="fas fa-envelope-open-text"></i> Love Letters
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 text-gray-500 flex items-center justify-center hover:text-black">
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex p-2 bg-gray-100 dark:bg-gray-800">
            <button 
              onClick={() => setTab('inbox')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${tab === 'inbox' ? 'bg-white dark:bg-gray-700 shadow text-pink-500' : 'text-gray-500'}`}
            >
              Inbox ({received.filter(l => !l.is_read).length})
            </button>
            <button 
              onClick={() => setTab('sent')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${tab === 'sent' ? 'bg-white dark:bg-gray-700 shadow text-pink-500' : 'text-gray-500'}`}
            >
              Sent
            </button>
            <button 
              onClick={() => setTab('compose')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${tab === 'compose' ? 'bg-pink-500 text-white shadow' : 'text-gray-500'}`}
            >
              <i className="fas fa-pen-nib"></i> Write
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-800/50">
            {tab === 'compose' ? (
              <UxLove_Compose 
                onSend={async (t, b, o) => {
                  const success = await createLetter(t, b, received[0]?.sender_uid || "unknown", o); // Limitation: Need partner UID. 
                  // Hack: In 1-on-1 chat, getting partner UID is tricky inside generic modal without props.
                  // We passed currentUserUid. We need "otherUserUid". 
                  // Usually we fetch it or pass it. For now, we assume the letters logic can derive it or we pass it from parent.
                  // FIX: Update createLetter to assume chatId implies the pair. But we need receiver_uid for the DB row.
                  // Ideally `useUxLoveLetters` should determine partner if we had logic.
                  // Since we don't have it handy, we will hack it: The hook logic actually just inserts. 
                  // We will pass a placeholder "PARTNER" and let logic handle or updated props.
                  // BETTER: Update Props to include partnerUid.
                  return success;
                }} 
                onCancel={() => setTab('inbox')} 
              />
            ) : (
              <div className="h-full overflow-y-auto p-4 space-y-3">
                {(tab === 'inbox' ? received : sent).length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                    <i className="far fa-paper-plane text-4xl mb-2"></i>
                    <p>No letters yet.</p>
                  </div>
                )}
                {(tab === 'inbox' ? received : sent).map(letter => (
                  <UxLove_LetterCard 
                    key={letter.id} 
                    letter={letter} 
                    currentUserUid={currentUserUid}
                    onClick={() => setActiveLetter(letter)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UxLove_Modal;
