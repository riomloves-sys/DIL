
import React, { useState } from 'react';

interface Props {
  onSend: (title: string, body: string, options: any) => Promise<boolean>;
  onCancel: () => void;
}

const UxLove_Compose: React.FC<Props> = ({ onSend, onCancel }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [sending, setSending] = useState(false);

  // Safety Filter
  const isSafe = (text: string) => {
    const denyList = ['hate', 'kill', 'die', 'abuse', 'murder'];
    return !denyList.some(word => text.toLowerCase().includes(word));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;
    if (!isSafe(body)) {
      alert("This content contains prohibited words. Please keep it positive.");
      return;
    }
    if (isLocked && pin.length < 4) {
      alert("PIN must be at least 4 digits.");
      return;
    }
    if (isEncrypted && passphrase.length < 6) {
      alert("Encryption passphrase must be at least 6 characters.");
      return;
    }

    setSending(true);
    const success = await onSend(title, body, {
      pin: isLocked ? pin : undefined,
      passphrase: isEncrypted ? passphrase : undefined
    });
    if (success) onCancel();
    setSending(false);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 p-6 animate-slide-up">
      <h3 className="text-2xl font-serif font-bold text-gray-800 dark:text-white mb-6 text-center">Write a Letter</h3>
      
      <input 
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Subject / Title"
        className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 py-2 text-lg font-bold text-gray-800 dark:text-white focus:border-pink-500 outline-none mb-4"
      />

      <textarea 
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Dearest..."
        className="flex-1 w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-gray-700 dark:text-gray-300 font-serif text-lg leading-relaxed resize-none outline-none focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-900 mb-6"
      />

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={isLocked} onChange={e => setIsLocked(e.target.checked)} className="w-4 h-4 accent-pink-500" />
            <label className="text-sm text-gray-700 dark:text-gray-300"><i className="fas fa-lock mr-1 text-yellow-500"></i> Lock with PIN</label>
          </div>
          {isLocked && (
            <input 
              type="password" 
              placeholder="Enter PIN (4+ digits)" 
              value={pin} 
              onChange={e => setPin(e.target.value)}
              maxLength={6}
              className="w-32 bg-white dark:bg-gray-700 border rounded px-2 py-1 text-sm"
            />
          )}
        </div>

        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={isEncrypted} onChange={e => setIsEncrypted(e.target.checked)} className="w-4 h-4 accent-purple-500" />
            <label className="text-sm text-gray-700 dark:text-gray-300"><i className="fas fa-shield-alt mr-1 text-purple-500"></i> Encrypt (Client-Side)</label>
          </div>
          {isEncrypted && (
            <input 
              type="password" 
              placeholder="Passphrase (6+ chars)" 
              value={passphrase} 
              onChange={e => setPassphrase(e.target.value)}
              className="w-40 bg-white dark:bg-gray-700 border rounded px-2 py-1 text-sm"
            />
          )}
        </div>
        {isEncrypted && <p className="text-[10px] text-red-400 px-2">Warning: If you forget the passphrase, this letter cannot be recovered.</p>}
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">Cancel</button>
        <button 
          onClick={handleSubmit}
          disabled={!title || !body || sending}
          className="flex-1 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? 'Sending...' : <><i className="fas fa-paper-plane"></i> Send Letter</>}
        </button>
      </div>
    </div>
  );
};

export default UxLove_Compose;
