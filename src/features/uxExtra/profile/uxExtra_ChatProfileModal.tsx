
import React from 'react';
import { UserProfile } from '../../../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onOpenCalendar: () => void;
  onOpenLockedGallery: () => void;
}

const UxExtra_ChatProfileModal: React.FC<Props> = ({ isOpen, onClose, user, onOpenCalendar, onOpenLockedGallery }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100" 
        onClick={e => e.stopPropagation()}
      >
        {/* Cover Photo Area (Mocked with color) */}
        <div className="h-24 bg-gradient-to-r from-blue-400 to-purple-500 relative">
            <button onClick={onClose} className="absolute top-2 right-2 text-white/80 hover:text-white bg-black/20 rounded-full p-2">
                <i className="fas fa-times"></i>
            </button>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-8 relative">
            <div className="relative -mt-12 mb-4 flex justify-center">
                <img 
                    src={user.photoURL} 
                    className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg bg-gray-200"
                    alt={user.displayName}
                />
                <div className={`absolute bottom-1 right-1/3 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>

            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{user.displayName}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                <div className="mt-2 text-xs font-medium px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full inline-block">
                    {user.isOnline ? 'Online Now' : 'Currently Offline'}
                </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <button 
                    onClick={() => { onClose(); onOpenCalendar(); }}
                    className="flex flex-col items-center justify-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-2xl hover:bg-pink-100 dark:hover:bg-pink-900/30 transition group"
                >
                    <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-800 flex items-center justify-center text-pink-500 dark:text-pink-200 mb-2 group-hover:scale-110 transition">
                        <i className="fas fa-heart"></i>
                    </div>
                    <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">Shared Calendar</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Special Dates</span>
                </button>

                <button 
                    onClick={() => { onClose(); onOpenLockedGallery(); }}
                    className="flex flex-col items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition group"
                >
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center text-yellow-600 dark:text-yellow-200 mb-2 group-hover:scale-110 transition">
                        <i className="fas fa-lock"></i>
                    </div>
                    <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">Locked Vault</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Private Media</span>
                </button>
            </div>

            <div className="text-center">
                <p className="text-xs text-gray-400 italic">"Making memories together"</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UxExtra_ChatProfileModal;
