
import React, { useState, useEffect } from 'react';

interface Props {
  initialText?: string;
  onAdd: (text: string, dueDate: string | null) => void;
  onCancel: () => void;
}

const UxPromise_AddForm: React.FC<Props> = ({ initialText = '', onAdd, onCancel }) => {
  const [text, setText] = useState(initialText);
  const [useDueDate, setUseDueDate] = useState(false);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text, useDueDate ? dueDate : null);
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl border border-yellow-200 dark:border-gray-700 shadow-inner">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">🤞</span> Make a Promise
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">I Promise To...</label>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 rounded-xl border border-yellow-300 dark:border-gray-600 focus:ring-2 focus:ring-yellow-400 bg-white dark:bg-gray-800 dark:text-white outline-none min-h-[80px]"
            placeholder="e.g. Call you every night at 9 PM"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-2">
           <input 
             type="checkbox" 
             id="useDate" 
             checked={useDueDate} 
             onChange={(e) => setUseDueDate(e.target.checked)}
             className="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500 border-gray-300"
           />
           <label htmlFor="useDate" className="text-sm text-gray-700 dark:text-gray-300">Set a Due Date?</label>
        </div>

        {useDueDate && (
          <input 
            type="date" 
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            min={new Date().toISOString().split('T')[0]}
          />
        )}

        <div className="flex gap-3 pt-2">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 py-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition font-semibold"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={!text.trim()}
            className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl shadow-lg hover:shadow-yellow-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
             <i className="fas fa-hand-holding-heart"></i> Promise
          </button>
        </div>
      </form>
    </div>
  );
};

export default UxPromise_AddForm;
