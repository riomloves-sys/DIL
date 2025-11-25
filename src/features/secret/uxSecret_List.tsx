
import React, { useState } from 'react';
import { useSecretEnvelope, SecretEnvelope } from './hooks/useSecretEnvelope';
import UxSecret_CreateModal from './uxSecret_CreateModal';
import UxSecret_View from './uxSecret_View';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentUserUid: string;
}

const UxSecret_List: React.FC<Props> = ({ isOpen, onClose, chatId, currentUserUid }) => {
  const { envelopes, loading, createEnvelope, revealEnvelope } = useSecretEnvelope(chatId, currentUserUid);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [selectedEnvelope, setSelectedEnvelope] = useState<SecretEnvelope | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        
        {selectedEnvelope && (
            <UxSecret_View 
                envelope={selectedEnvelope} 
                onClose={() => setSelectedEnvelope(null)}
                onReveal={revealEnvelope}
                currentUserUid={currentUserUid}
            />
        )}

        {view === 'create' ? (
            <UxSecret_CreateModal 
                onClose={() => setView('list')} 
                onCreate={createEnvelope} 
            />
        ) : (
            <div className="bg-white dark:bg-gray-900 w-full max-w-md h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 flex justify-between items-center shrink-0 shadow-lg">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <i className="fas fa-key"></i> Secret Envelopes
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white"><i className="fas fa-times"></i></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800">
                    <button 
                        onClick={() => setView('create')}
                        className="w-full py-3 mb-4 bg-white dark:bg-gray-700 border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-500 dark:text-purple-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-50 dark:hover:bg-gray-600 transition"
                    >
                        <i className="fas fa-plus"></i> New Time-Locked Message
                    </button>

                    {loading ? (
                        <div className="text-center py-8 text-gray-400"><i className="fas fa-spinner fa-spin"></i> Loading...</div>
                    ) : envelopes.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 opacity-60">
                            <i className="fas fa-envelope-open-text text-4xl mb-2"></i>
                            <p>No secrets yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {envelopes.map(env => {
                                const isMine = env.sender_uid === currentUserUid;
                                const isLocked = new Date(env.unlock_at).getTime() > Date.now();
                                return (
                                    <div 
                                        key={env.id} 
                                        onClick={() => setSelectedEnvelope(env)}
                                        className={`p-4 rounded-xl border transition cursor-pointer flex items-center gap-4 relative overflow-hidden
                                            ${isLocked 
                                                ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-80' 
                                                : 'bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-900 shadow-sm hover:shadow-md'
                                            }
                                        `}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${isLocked ? 'bg-gray-300 dark:bg-gray-700 text-gray-500' : 'bg-purple-100 dark:bg-purple-900 text-purple-600'}`}>
                                            <i className={`fas ${isLocked ? 'fa-lock' : (env.revealed ? 'fa-envelope-open' : 'fa-envelope')}`}></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    {isMine ? 'Sent by You' : 'From Partner'}
                                                </span>
                                                {isLocked && <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">Locked</span>}
                                            </div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                                                {isLocked ? "Message Hidden" : (env.message || "Audio Message")}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                Unlocks: {new Date(env.unlock_at).toLocaleString()}
                                            </p>
                                        </div>
                                        {!isLocked && !env.revealed && !isMine && (
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default UxSecret_List;
