
import React from 'react';
import { useLoveReport } from './hooks/useLoveReport';
import UxLoveReport_Graphs from './uxLoveReport_Graphs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentUserUid: string;
}

const UxLoveReport_Dashboard: React.FC<Props> = ({ isOpen, onClose, chatId, currentUserUid }) => {
  const { report, loading, analyzing, generateReport } = useLoveReport(chatId, currentUserUid);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gray-50 dark:bg-gray-900 w-full max-w-2xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-pink-500 to-purple-600 flex justify-between items-start shrink-0 text-white shadow-lg">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <i className="fas fa-chart-pie"></i> Weekly Love Report
            </h2>
            <p className="text-pink-100 text-sm mt-1 opacity-90">AI-Powered Relationship Insights</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {loading || analyzing ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <i className={`fas ${analyzing ? 'fa-robot' : 'fa-spinner'} fa-spin text-3xl text-pink-500`}></i>
              </div>
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">
                {analyzing ? "Analyzing Chat Sentiment..." : "Loading Report..."}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">Reading last 7 days of messages to calculate affection & communication scores.</p>
            </div>
          ) : !report ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-file-contract text-4xl text-pink-500"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Report for This Week</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">Generate a summary of your relationship health based on recent chats.</p>
              <button 
                onClick={generateReport}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-full shadow-lg transform transition hover:scale-105"
              >
                <i className="fas fa-magic mr-2"></i> Generate AI Report
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-slide-up">
              
              {/* Overview Score */}
              <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 flex items-center justify-center text-white font-black text-2xl shadow-md">
                    {Math.round((report.communication_score + report.affection_score + report.mood_score) / 3)}
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-800 dark:text-white text-lg">Overall Health</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Composite score of all metrics</p>
                 </div>
                 <div className="ml-auto">
                    <button onClick={generateReport} className="text-xs text-blue-500 hover:underline"><i className="fas fa-redo"></i> Refresh</button>
                 </div>
              </div>

              {/* Graphs */}
              <UxLoveReport_Graphs 
                comm={report.communication_score} 
                aff={report.affection_score} 
                mood={report.mood_score} 
              />

              {/* Highlights */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-5 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                   <h4 className="font-bold text-yellow-700 dark:text-yellow-400 mb-3 flex items-center gap-2">
                     <i className="fas fa-star"></i> Sweetest Moments
                   </h4>
                   <ul className="space-y-2">
                     {report.highlights?.map((msg, i) => (
                       <li key={i} className="text-sm text-gray-700 dark:text-gray-300 italic bg-white/60 dark:bg-black/20 p-2 rounded-lg">
                         "{msg.length > 60 ? msg.substring(0, 60) + '...' : msg}"
                       </li>
                     ))}
                     {(!report.highlights || report.highlights.length === 0) && <li className="text-xs text-gray-400">No specific highlights found.</li>}
                   </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                   <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                     <i className="fas fa-lightbulb"></i> AI Suggestions
                   </h4>
                   <ul className="space-y-2">
                     {report.suggestions?.map((s, i) => (
                       <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                         <span className="text-blue-500 mt-1">•</span> {s}
                       </li>
                     ))}
                   </ul>
                </div>
              </div>

              <p className="text-center text-[10px] text-gray-400 pt-4">
                * Analysis is performed locally on your device for privacy. Scores are approximate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UxLoveReport_Dashboard;
