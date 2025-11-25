
import React, { useState } from 'react';
import { useUxPromise } from './hooks/useUxPromise';
import UxPromise_List from './uxPromise_List';
import UxPromise_AddForm from './uxPromise_AddForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentUserUid: string;
  initialAddText?: string; // For auto-detected promises
}

const UxPromise_Modal: React.FC<Props> = ({ isOpen, onClose, chatId, currentUserUid, initialAddText }) => {
  const { promises, addPromise, updateStatus } = useUxPromise(chatId, currentUserUid);
  const [view, setView] = useState<'list' | 'add'>(initialAddText ? 'add' : 'list');

  // If initial text is provided when opening, switch to add mode
  React.useEffect(() => {
    if (initialAddText) setView('add');
  }, [initialAddText]);

  const handleAdd = async (text: string, dueDate: string | null) => {
    // Assuming partner is the 'for_user'. In 1-on-1 chat, we don't have exact partner UID in props here easily
    // but typically promises are 'for the chat'. Logic: 'for_user' is whoever isn't me.
    // For simplicity, we'll store 'partner' as a placeholder or derived in UI. 
    // Ideally we pass partnerUID, but SQL logic works with chat_id.
    await addPromise(text, 'partner', dueDate);
    setView('list');
    // If it was an auto-detect popup flow, we might want to close, but let's stay in list to show it added.
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-gray-800 dark:to-gray-800 border-b dark:border-gray-700 flex justify-between items-center shrink-0">
           <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
             <i className="fas fa-handshake text-yellow-600"></i> Promise Tracker
           </h2>
           <div className="flex gap-3">
              {view === 'list' && (
                  <button onClick={() => setView('add')} className="text-sm bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 px-3 py-1 rounded-full font-bold transition">
                     + New
                  </button>
              )}
              {view === 'add' && !initialAddText && (
                  <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-black dark:text-gray-400">
                     Cancel
                  </button>
              )}
              <button onClick={onClose} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">
                 <i className="fas fa-times text-lg"></i>
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-800/50 p-4 flex flex-col">
            {view === 'add' ? (
                <UxPromise_AddForm 
                   initialText={initialAddText}
                   onAdd={handleAdd}
                   onCancel={() => { 
                       if (initialAddText) onClose(); 
                       else setView('list'); 
                   }}
                />
            ) : (
                <UxPromise_List 
                   promises={promises}
                   currentUserUid={currentUserUid}
                   onComplete={(id) => updateStatus(id, 'completed')}
                   onBreak={(id) => updateStatus(id, 'broken')}
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default UxPromise_Modal;
