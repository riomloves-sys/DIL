import React, { useState } from 'react';

interface Props {
  onSend: (text: string) => void;
  onCancel: () => void;
}

const UxTD_Confession: React.FC<Props> = ({ onSend, onCancel }) => {
  const [text, setText] = useState('');

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 animate-fade-in">
      <h2 className="text-3xl font-serif text-red-600 mb-6 tracking-widest uppercase animate-pulse">Confession</h2>
      
      <p className="text-gray-400 mb-8 text-center max-w-md italic font-serif">
        "What is said in the dark, remains in the dark... until now."
      </p>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full max-w-lg h-40 bg-gray-900 border border-red-900 rounded-lg p-4 text-white font-mono text-lg focus:outline-none focus:border-red-600 mb-8 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
        placeholder="Type your deepest secret..."
      />
      
      <div className="flex gap-4">
        <button 
          onClick={onCancel}
          className="px-8 py-3 text-gray-500 hover:text-white transition"
        >
          Nevermind
        </button>
        <button 
          onClick={() => onSend(text)}
          disabled={!text.trim()}
          className="px-8 py-3 bg-red-700 hover:bg-red-600 text-white font-serif tracking-widest rounded shadow-lg disabled:opacity-50"
        >
          CONFESS
        </button>
      </div>
    </div>
  );
};

export default UxTD_Confession;