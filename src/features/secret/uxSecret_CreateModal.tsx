
import React, { useState } from 'react';
import { useUxWatchMediaUpload } from '../uxWatch/hooks/useUxWatchMediaUpload'; // Reusing upload hook

interface Props {
  onClose: () => void;
  onCreate: (msg: string, date: Date, audio: string | null) => Promise<boolean>;
}

const PRESET_TIMES = [
  { label: '1 Minute', val: 1 * 60 * 1000 },
  { label: '1 Hour', val: 60 * 60 * 1000 },
  { label: 'Tomorrow', val: 24 * 60 * 60 * 1000 },
  { label: '1 Week', val: 7 * 24 * 60 * 60 * 1000 },
  { label: '1 Year', val: 365 * 24 * 60 * 60 * 1000 },
];

const UxSecret_CreateModal: React.FC<Props> = ({ onClose, onCreate }) => {
  const [message, setMessage] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  const { uploadMedia, uploading } = useUxWatchMediaUpload(); // Reusing existing upload logic

  const handleSubmit = async () => {
    let targetDate: Date;

    if (selectedPreset) {
        targetDate = new Date(Date.now() + selectedPreset);
    } else if (customDate) {
        targetDate = new Date(customDate);
    } else {
        alert("Please select an unlock time.");
        return;
    }

    if (targetDate.getTime() <= Date.now()) {
        alert("Unlock time must be in the future.");
        return;
    }

    if (!message.trim() && !audioFile) {
        alert("Write a message or add audio.");
        return;
    }

    setSending(true);
    let audioUrl = null;
    if (audioFile) {
        audioUrl = await uploadMedia(audioFile);
    }

    await onCreate(message, targetDate, audioUrl);
    setSending(false);
    onClose();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-purple-100 dark:border-purple-900 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-serif font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <i className="fas fa-hourglass-half"></i> Time Capsule
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
        </div>

        <textarea 
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write a message for the future..."
            className="w-full h-32 p-4 bg-purple-50 dark:bg-gray-900 rounded-lg border-none focus:ring-2 focus:ring-purple-400 outline-none resize-none mb-4 dark:text-white font-serif italic"
        />

        <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Unlock In:</p>
            <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_TIMES.map((t, i) => (
                    <button 
                        key={i}
                        onClick={() => { setSelectedPreset(t.val); setCustomDate(''); }}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition ${selectedPreset === t.val ? 'bg-purple-600 text-white border-purple-600' : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <input 
                type="datetime-local" 
                value={customDate}
                onChange={e => { setCustomDate(e.target.value); setSelectedPreset(null); }}
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
            />
        </div>

        <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-purple-600 dark:text-purple-400 hover:underline">
                <i className="fas fa-microphone"></i> 
                {audioFile ? 'Audio Attached' : 'Attach Audio (Optional)'}
                <input type="file" accept="audio/*" className="hidden" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
            </label>
        </div>

        <button 
            onClick={handleSubmit}
            disabled={sending || uploading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
            {(sending || uploading) ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-history"></i>}
            Seal Envelope
        </button>
    </div>
  );
};

export default UxSecret_CreateModal;
