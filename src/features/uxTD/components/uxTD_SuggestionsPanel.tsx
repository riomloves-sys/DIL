
import React from 'react';
import { TD_TRUTH_LIST, TD_DARE_LIST, TD_DANGER_LIST } from '../utils/uxTD_Lists';

interface Props {
  type: 'truth' | 'dare' | 'danger';
  onSelect: (text: string) => void;
}

const UxTD_SuggestionsPanel: React.FC<Props> = ({ type, onSelect }) => {
  const list = type === 'truth' ? TD_TRUTH_LIST : (type === 'dare' ? TD_DARE_LIST : TD_DANGER_LIST);
  
  // Shuffle and pick 10
  const suggestions = React.useMemo(() => {
      return [...list].sort(() => 0.5 - Math.random()).slice(0, 10);
  }, [type]);

  return (
    <div className="mb-4">
        <p className="text-xs text-blue-400 font-bold mb-2 uppercase">Or pick a suggestion:</p>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-thin">
            {suggestions.map((s, i) => (
                <button 
                    key={i}
                    onClick={() => onSelect(s)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-3 py-2 rounded-lg text-left transition active:scale-95 border border-gray-600"
                >
                    {s}
                </button>
            ))}
        </div>
    </div>
  );
};

export default UxTD_SuggestionsPanel;
