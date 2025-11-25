
import React, { useState, useEffect } from 'react';
import { LoveLetter } from '../hooks/useUxLoveLetters';
import { uxLove_decryptText, uxLove_hashPin } from '../utils/uxLove_crypto';

interface Props {
  letter: LoveLetter;
  currentUserUid: string;
  onClose: () => void;
  onReaction: (id: string, emoji: string) => void;
  onMarkRead: (id: string) => void;
}

const UxLove_LetterView: React.FC<Props> = ({ letter, currentUserUid, onClose, onReaction, onMarkRead }) => {
  const isSender = letter.sender_uid === currentUserUid;
  
  // Steps: 'locked' -> 'encrypted' -> 'view'
  const [step, setStep] = useState<'locked' | 'encrypted' | 'view'>('view');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [content, setContent] = useState(letter.body);
  const [typewriterText, setTypewriterText] = useState('');

  // Initialize Step
  useEffect(() => {
    if (isSender) {
        // Sender bypasses lock/encrypt for simplicity (or you could force them to unlock too)
        setStep('view');
        if(letter.is_encrypted) setContent("[Encrypted content hidden for security]"); 
    } else {
        if (letter.is_locked) setStep('locked');
        else if (letter.is_encrypted) setStep('encrypted');
        else setStep('view');
    }
  }, [letter, isSender]);

  // Typewriter Effect
  useEffect(() => {
    if (step === 'view' && !isSender) {
        let i = 0;
        setTypewriterText('');
        const timer = setInterval(() => {
            setTypewriterText(content.slice(0, i + 1));
            i++;
            if (i >= content.length) clearInterval(timer);
        }, 30); // Speed
        
        if (!letter.is_read) onMarkRead(letter.id);
        return () => clearInterval(timer);
    } else if (step === 'view') {
        setTypewriterText(content);
    }
  }, [step, content]);

  const handleUnlock = async () => {
    const hash = await uxLove_hashPin(input);
    if (hash === letter.pin_hash) {
      setInput('');
      setError('');
      if (letter.is_encrypted) setStep('encrypted');
      else setStep('view');
    } else {
      setError('Incorrect PIN');
    }
  };

  const handleDecrypt = async () => {
    try {
      const decrypted = await uxLove_decryptText(letter.body, input, letter.encryption_meta);
      setContent(decrypted);
      setStep('view');
    } catch (e) {
      setError('Incorrect passphrase');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col animate-fade-in">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <button onClick={onClose} className="text-gray-500"><i className="fas fa-arrow-left"></i> Back</button>
        <span className="font-serif italic text-gray-400">Love Letter</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto bg-paper-pattern relative">
        {/* Background decorative */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

        {step === 'locked' && (
          <div className="text-center max-w-xs w-full animate-slide-up">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lock text-4xl text-yellow-500"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">This letter is locked</h3>
            <p className="text-gray-500 mb-4 text-sm">Enter the 4-digit PIN to open.</p>
            <input 
              type="password" 
              value={input}
              onChange={e => setInput(e.target.value)}
              maxLength={6}
              className="w-full text-center text-2xl tracking-widest py-2 border-b-2 border-gray-300 focus:border-yellow-500 outline-none bg-transparent dark:text-white mb-4"
              placeholder="• • • •"
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button onClick={handleUnlock} className="w-full bg-yellow-500 text-white py-3 rounded-xl font-bold shadow-lg">Unlock</button>
          </div>
        )}

        {step === 'encrypted' && (
          <div className="text-center max-w-xs w-full animate-slide-up">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-shield-alt text-4xl text-purple-500"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Encrypted Content</h3>
            <p className="text-gray-500 mb-4 text-sm">Enter the passphrase to decrypt.</p>
            <input 
              type="password" 
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full p-3 border rounded-lg outline-none bg-gray-50 dark:bg-gray-800 dark:text-white mb-4"
              placeholder="Passphrase"
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button onClick={handleDecrypt} className="w-full bg-purple-500 text-white py-3 rounded-xl font-bold shadow-lg">Decrypt</button>
          </div>
        )}

        {step === 'view' && (
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 animate-fade-in relative">
             <h1 className="text-2xl font-serif font-bold text-gray-800 dark:text-white mb-2">{letter.title}</h1>
             <p className="text-xs text-gray-400 mb-6 border-b pb-4">{new Date(letter.created_at).toLocaleString()}</p>
             
             <div className="font-serif text-lg leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap min-h-[200px]">
               {typewriterText}
               <span className="animate-pulse text-pink-500">|</span>
             </div>

             {!isSender && (
               <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                 <p className="text-center text-xs text-gray-400 uppercase tracking-widest mb-4">React to this letter</p>
                 <div className="flex justify-center gap-4">
                   {['❤️', '😭', '🥰', '🔥', '🥺'].map(emoji => (
                     <button 
                       key={emoji} 
                       onClick={() => onReaction(letter.id, emoji)}
                       className="text-3xl hover:scale-125 transition transform active:scale-90"
                     >
                       {emoji}
                     </button>
                   ))}
                 </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UxLove_LetterView;
