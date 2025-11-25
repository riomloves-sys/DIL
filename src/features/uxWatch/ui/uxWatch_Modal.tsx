
import React, { useState } from 'react';
import { useUxWatchSession } from '../hooks/useUxWatchSession';
import { useUxWatchMediaUpload } from '../hooks/useUxWatchMediaUpload';
import UxWatch_VideoPlayer from '../components/uxWatch_VideoPlayer';
import UxWatch_WebViewer from '../components/uxWatch_WebViewer';
import UxWatch_Reactions from '../components/uxWatch_Reactions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentUserUid: string;
}

const UxWatch_Modal: React.FC<Props> = ({ isOpen, onClose, chatId, currentUserUid }) => {
  const { 
    session, createSession, publishEvent, videoRef, driftWarning, isHost 
  } = useUxWatchSession(chatId, currentUserUid);
  
  const { uploadMedia, uploading } = useUxWatchMediaUpload();

  const [menu, setMenu] = useState<'main' | 'youtube' | 'web'>('main');
  const [typedUrl, setTypedUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [reactionTrigger, setReactionTrigger] = useState<any>(null);

  if (!isOpen) return null;

  // STRICT VALIDATION BEFORE STARTING
  const startYouTube = () => {
      setErrorMsg('');
      if (!typedUrl) return;
      
      // Strict regex for ID extraction
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
      const match = typedUrl.match(regExp);
      const id = (match && match[2].length === 11) ? match[2] : null;

      if (!id) {
          setErrorMsg('Invalid YouTube URL format. Try: https://www.youtube.com/watch?v=...');
          return;
      }
      
      // Normalize URL to standard format to avoid player redirect issues
      const cleanUrl = `https://www.youtube.com/watch?v=${id}`;
      createSession('youtube', cleanUrl);
  };

  const startWeb = () => {
      setErrorMsg('');
      if (!typedUrl) return;
      let url = typedUrl.trim();
      if (!url.startsWith('http')) url = 'https://' + url;
      createSession('web', url);
  };

  const handleStop = async () => {
      await createSession('idle', '');
      setMenu('main');
      setTypedUrl('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const url = await uploadMedia(e.target.files[0]);
          if (url) createSession('upload', url);
      }
  };

  const isWatching = session && session.content_type && session.content_type !== 'idle';

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
        
        {/* Top Bar */}
        <div className="h-14 bg-gray-900 border-b border-gray-800 flex justify-between items-center px-4 shrink-0 shadow-xl z-50">
            <div className="flex items-center gap-3">
                <span className="text-pink-500 font-black italic tracking-tighter text-xl">WATCH<span className="text-white">TOGETHER</span></span>
                {session && (
                   <span className="text-xs text-green-500 font-bold px-2 py-0.5 bg-green-900/30 rounded border border-green-800">
                       Connected
                   </span>
                )}
                {driftWarning && <span className="text-xs text-yellow-500 animate-pulse">{driftWarning}</span>}
            </div>

            <div className="flex items-center gap-3">
                {isWatching && (
                    <button 
                        onClick={handleStop}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition shadow-md flex items-center gap-2"
                    >
                        <i className="fas fa-stop"></i> STOP / CHANGE
                    </button>
                )}
                <button onClick={onClose} className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center">
                    <i className="fas fa-times text-lg"></i>
                </button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative flex bg-black w-full overflow-hidden">
            {isWatching ? (
                <div className="flex-1 bg-black relative flex items-center justify-center w-full h-full">
                    {session.content_type === 'web' ? (
                        <UxWatch_WebViewer url={session.content_url} />
                    ) : (
                        <UxWatch_VideoPlayer
                            ref={videoRef}
                            url={session.content_url}
                            type={session.content_type as any}
                            onPlay={() => publishEvent('play', { time: videoRef.current?.getCurrentTime() })}
                            onPause={() => publishEvent('pause', {})}
                            onSeek={(t) => publishEvent('seek', { time: t })}
                            isHost={isHost}
                            onBack={handleStop}
                        />
                    )}
                    {session.content_type !== 'web' && (
                        <UxWatch_Reactions 
                            onReact={(emoji) => publishEvent('reaction', { emoji })}
                            incomingReaction={reactionTrigger} 
                        />
                    )}
                </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white p-4">
                    <div className="max-w-md w-full space-y-6">
                        
                        {menu === 'main' && (
                            <>
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold mb-2">Start a Session</h2>
                                    <p className="text-gray-400 text-sm">Select content to watch together in real-time.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setMenu('youtube')} className="bg-gray-800 hover:bg-red-900/20 p-6 rounded-xl text-center transition border border-gray-700 hover:border-red-500 group">
                                        <i className="fab fa-youtube text-4xl mb-3 text-red-500 group-hover:scale-110 transition"></i>
                                        <div className="font-bold">YouTube</div>
                                    </button>
                                    
                                    <label className="bg-gray-800 hover:bg-blue-900/20 p-6 rounded-xl cursor-pointer text-center transition border border-gray-700 hover:border-blue-500 group relative">
                                        <i className="fas fa-cloud-upload-alt text-4xl mb-3 text-blue-500 group-hover:scale-110 transition"></i>
                                        <div className="font-bold">Upload Video</div>
                                        <input type="file" className="hidden" accept="video/mp4" onChange={handleFileUpload} />
                                        {uploading && <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-xl font-bold"><i className="fas fa-spinner fa-spin mr-2"></i></div>}
                                    </label>

                                    <button onClick={() => setMenu('web')} className="col-span-2 bg-gray-800 hover:bg-purple-900/20 p-4 rounded-xl text-center transition border border-gray-700 hover:border-purple-500 flex items-center justify-center gap-4 group">
                                        <i className="fas fa-globe text-2xl text-purple-500 group-hover:rotate-12 transition"></i>
                                        <div className="font-bold">Web Browser</div>
                                    </button>
                                </div>
                            </>
                        )}

                        {menu === 'youtube' && (
                            <div className="bg-gray-800 p-6 rounded-xl animate-fade-in border border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg"><i className="fab fa-youtube text-red-500 mr-2"></i> Paste YouTube Link</h3>
                                    <button onClick={() => setMenu('main')} className="text-gray-400 hover:text-white text-sm">Back</button>
                                </div>
                                <input 
                                    type="text" 
                                    value={typedUrl}
                                    onChange={e => setTypedUrl(e.target.value)}
                                    placeholder="https://youtu.be/..."
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white mb-2 focus:border-red-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && startYouTube()}
                                />
                                {errorMsg && <p className="text-red-500 text-xs mb-3 font-bold"><i className="fas fa-exclamation-circle mr-1"></i>{errorMsg}</p>}
                                <p className="text-xs text-gray-500 mb-4">Supports regular videos and Shorts.</p>
                                <button onClick={startYouTube} disabled={!typedUrl} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-50 shadow-lg">
                                    Start Watching
                                </button>
                            </div>
                        )}

                        {menu === 'web' && (
                            <div className="bg-gray-800 p-6 rounded-xl animate-fade-in border border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg"><i className="fas fa-globe text-purple-500 mr-2"></i> Enter Website URL</h3>
                                    <button onClick={() => setMenu('main')} className="text-gray-400 hover:text-white text-sm">Back</button>
                                </div>
                                <input 
                                    type="text" 
                                    value={typedUrl}
                                    onChange={e => setTypedUrl(e.target.value)}
                                    placeholder="example.com"
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white mb-4 focus:border-purple-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && startWeb()}
                                />
                                <p className="text-xs text-gray-500 mb-4">Note: Some sites (Google, Facebook) block embedded viewers.</p>
                                <button onClick={startWeb} disabled={!typedUrl} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg disabled:opacity-50 shadow-lg">
                                    Browse Together
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default UxWatch_Modal;
