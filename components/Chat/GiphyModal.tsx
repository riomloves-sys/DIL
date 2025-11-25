import React, { useState } from 'react';
import { GIPHY_API_KEY } from '../../constants';

interface GiphyModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const GiphyModal: React.FC<GiphyModalProps> = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchGifs = async (query: string) => {
    if (!GIPHY_API_KEY) return;
    setLoading(true);
    const url = query 
      ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      setGifs(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    searchGifs('');
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl p-4 shadow-2xl h-[70vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Select a GIF</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400"><i className="fas fa-times text-xl"></i></button>
        </div>
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Giphy..."
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && searchGifs(search)}
          />
          <button onClick={() => searchGifs(search)} className="bg-blue-500 text-white px-4 rounded-lg">Search</button>
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
            {loading && <p className="col-span-3 text-center text-gray-500">Loading...</p>}
            {gifs.map(gif => (
                <img 
                    key={gif.id}
                    src={gif.images.fixed_height.url} 
                    alt={gif.title}
                    className="w-full h-32 object-cover rounded-md cursor-pointer hover:scale-105 transition"
                    onClick={() => onSelect(gif.images.original.url)}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export default GiphyModal;
