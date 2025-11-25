
import React, { useState } from 'react';
import { UxPromise } from './hooks/useUxPromise';

interface Props {
  promises: UxPromise[];
  currentUserUid: string;
  onComplete: (id: string) => void;
  onBreak: (id: string) => void;
}

const UxPromise_List: React.FC<Props> = ({ promises, currentUserUid, onComplete, onBreak }) => {
  const [filter, setFilter] = useState<'pending' | 'completed' | 'broken'>('pending');

  const filtered = promises.filter(p => p.status === filter);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
       {/* Tabs */}
       <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4 shrink-0">
          <button 
            onClick={() => setFilter('pending')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${filter === 'pending' ? 'bg-white dark:bg-gray-600 shadow text-yellow-600 dark:text-yellow-400' : 'text-gray-500'}`}
          >
            <i className="fas fa-hourglass-half"></i> Pending
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${filter === 'completed' ? 'bg-white dark:bg-gray-600 shadow text-green-600 dark:text-green-400' : 'text-gray-500'}`}
          >
            <i className="fas fa-check-circle"></i> Fulfilled
          </button>
          <button 
            onClick={() => setFilter('broken')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${filter === 'broken' ? 'bg-white dark:bg-gray-600 shadow text-red-600 dark:text-red-400' : 'text-gray-500'}`}
          >
            <i className="fas fa-heart-broken"></i> Broken
          </button>
       </div>

       {/* List */}
       <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {filtered.length === 0 && (
             <div className="text-center py-12 text-gray-400 opacity-60 flex flex-col items-center">
                <i className={`fas fa-folder-open text-4xl mb-3`}></i>
                <p>No {filter} promises found.</p>
             </div>
          )}

          {filtered.map(p => {
             const isMine = p.created_by === currentUserUid;
             const isOverdue = p.due_date && new Date(p.due_date) < new Date() && p.status === 'pending';

             return (
               <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                  {/* Status Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      p.status === 'completed' ? 'bg-green-500' : 
                      p.status === 'broken' ? 'bg-red-500' : 
                      isOverdue ? 'bg-orange-500' : 'bg-yellow-400'
                  }`}></div>

                  <div className="pl-3">
                     <p className="text-gray-800 dark:text-gray-200 font-medium text-lg leading-snug mb-2">"{p.promise_text}"</p>
                     
                     <div className="flex justify-between items-end">
                        <div className="text-xs text-gray-500 space-y-1">
                           <div className="flex items-center gap-1">
                              <i className="fas fa-user-circle"></i>
                              <span>{isMine ? 'You promised' : 'Partner promised'}</span>
                           </div>
                           <div className="flex items-center gap-1">
                              <i className="far fa-clock"></i>
                              <span>{formatDate(p.created_at)}</span>
                           </div>
                           {p.due_date && (
                               <div className={`flex items-center gap-1 font-bold ${isOverdue ? 'text-red-500' : 'text-blue-500'}`}>
                                  <i className="fas fa-calendar-day"></i>
                                  <span>Due: {new Date(p.due_date).toLocaleDateString()}</span>
                                  {isOverdue && <span className="uppercase text-[10px] bg-red-100 px-1 rounded ml-1">Overdue</span>}
                               </div>
                           )}
                        </div>

                        {/* Actions */}
                        {p.status === 'pending' && (
                           <div className="flex gap-2">
                              {/* Only creator can complete, or logic allows both? Requirement says: User can mark own completed. */}
                              {isMine && (
                                <button 
                                  onClick={() => onComplete(p.id)}
                                  className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 text-green-600 flex items-center justify-center transition shadow-sm"
                                  title="Mark Completed"
                                >
                                   <i className="fas fa-check"></i>
                                </button>
                              )}
                              
                              {/* Partner can break, or owner can give up */}
                              <button 
                                onClick={() => onBreak(p.id)}
                                className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition shadow-sm"
                                title="Mark Broken"
                              >
                                 <i className="fas fa-times"></i>
                              </button>
                           </div>
                        )}
                        
                        {p.status === 'completed' && (
                           <span className="text-green-500 text-2xl animate-pop-in"><i className="fas fa-check-circle"></i></span>
                        )}
                        {p.status === 'broken' && (
                           <span className="text-red-500 text-2xl animate-shake"><i className="fas fa-heart-broken"></i></span>
                        )}
                     </div>
                  </div>
               </div>
             );
          })}
       </div>
    </div>
  );
};

export default UxPromise_List;
