
import React, { useState, useEffect } from 'react';

interface Props {
  url: string;
}

const UxWatch_WebViewer: React.FC<Props> = ({ url }) => {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [iframeKey, setIframeKey] = useState(0); 
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
      // Ensure protocol
      let safeUrl = url;
      if (!safeUrl.startsWith('http')) safeUrl = 'https://' + safeUrl;
      setCurrentUrl(safeUrl);
      setIsBlocked(false);
  }, [url]);

  const refresh = () => setIframeKey(k => k + 1);

  return (
    <div className="w-full h-full bg-gray-100 flex flex-col relative">
        {/* Header Bar */}
        <div className="h-14 bg-gray-800 flex items-center px-4 gap-3 shrink-0 shadow-md z-10">
            <div className="flex-1 bg-black/40 rounded-lg px-3 py-2 text-xs text-gray-300 truncate font-mono border border-gray-700">
                {currentUrl}
            </div>
            <button onClick={refresh} className="text-gray-400 hover:text-white p-2" title="Reload Frame">
                <i className="fas fa-redo"></i>
            </button>
            <a 
                href={currentUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1"
                title="Open in New Tab"
            >
                Open <i className="fas fa-external-link-alt"></i>
            </a>
        </div>

        {/* Iframe Container */}
        <div className="flex-1 relative bg-white overflow-hidden">
            {!isBlocked ? (
                <>
                    <iframe 
                        key={iframeKey}
                        src={currentUrl} 
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        title="Shared Web Viewer"
                        onError={() => setIsBlocked(true)}
                    />
                    
                    {/* Fallback Detection Overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white p-3 rounded-lg shadow-xl text-xs flex items-center gap-4 backdrop-blur-sm opacity-90 hover:opacity-100 transition">
                         <span>Page blank or refused to connect?</span>
                         <button 
                            onClick={() => setIsBlocked(true)}
                            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded font-bold"
                         >
                            Show Fallback
                         </button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-center p-6">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-ban text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Website Blocked by Security Policy</h3>
                    <p className="text-sm text-gray-500 max-w-md mb-6">
                        Many websites (like Google, Facebook, Twitter) prevent being displayed inside other apps for security (X-Frame-Options).
                    </p>
                    <a 
                        href={currentUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2"
                    >
                        Open Website Externally <i className="fas fa-external-link-alt"></i>
                    </a>
                    <button 
                        onClick={() => setIsBlocked(false)}
                        className="mt-4 text-xs text-blue-500 hover:underline"
                    >
                        Try loading again
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default UxWatch_WebViewer;
