import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const ChatSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { toggleTheme, theme } = useTheme();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Basic query to fetch users
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const userList: UserProfile[] = [];
        snapshot.forEach((doc) => {
          const u = doc.data() as UserProfile;
          if (u.uid !== user?.uid) {
            userList.push(u);
          }
        });
        setUsers(userList);
        setError(null);
      },
      (err) => {
        // Suppress permission-denied to allow app usage without proper rules
        if (err.code === 'permission-denied') {
            console.warn("Firestore permission denied (suppressed)");
        } else {
            console.error("Error fetching users:", err);
        }
      }
    );
    return () => unsubscribe();
  }, [user]);

  const startChat = (otherUser: UserProfile) => {
    if (!user) return;
    const uid1 = user.uid < otherUser.uid ? user.uid : otherUser.uid;
    const uid2 = user.uid < otherUser.uid ? otherUser.uid : user.uid;
    const chatId = `${uid1}_${uid2}`;
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="w-full md:w-80 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full relative z-10">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 shrink-0">
        <div>
           <h2 className="text-xl font-bold text-gray-800 dark:text-white">Messages</h2>
           <p className="text-xs text-green-500 font-medium flex items-center gap-1">
             <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
           </p>
        </div>
        <div className="relative">
          <img 
            src={user?.photoURL} 
            alt="Profile" 
            className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition object-cover"
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          />
          {showMenu && (
            <>
              {/* Backdrop to close menu */}
              <div className="fixed inset-0 z-[40]" onClick={() => setShowMenu(false)}></div>
              
              {/* Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-[50] border dark:border-gray-600 overflow-hidden">
                <button 
                  onClick={() => { toggleTheme(); setShowMenu(false); }} 
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
                >
                  <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} w-5 mr-2 text-center`}></i> Theme
                </button>
                <button 
                  onClick={() => { navigate('/edit-profile'); setShowMenu(false); }} 
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
                >
                  <i className="fas fa-user-edit w-5 mr-2 text-center text-blue-500"></i> Edit Profile
                </button>
                {user?.isAdmin && (
                  <button 
                    onClick={() => { navigate('/admin'); setShowMenu(false); }} 
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
                  >
                    <i className="fas fa-shield-alt w-5 mr-2 text-center text-red-500"></i> Admin
                  </button>
                )}
                <div className="border-t border-gray-200 dark:border-gray-600"></div>
                <button 
                  onClick={() => { logout(); setShowMenu(false); }} 
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                >
                  <i className="fas fa-sign-out-alt w-5 mr-2 text-center"></i> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Admin Quick Chat */}
      <div className="p-3 shrink-0">
         <button className="w-full py-2 bg-gradient-to-r from-green-400 to-emerald-600 text-white rounded-lg shadow-md hover:shadow-lg transition font-medium flex justify-center items-center gap-2">
           <i className="fas fa-headset"></i> Support Chat
         </button>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
        {users.length === 0 && (
            <p className="text-center text-gray-400 mt-4 text-sm">No other users found.</p>
        )}
        {users.map((u) => (
        <div 
            key={u.uid} 
            onClick={() => startChat(u)}
            role="button"
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition group border border-transparent hover:border-blue-100 dark:hover:border-gray-600"
        >
            <div className="relative">
            <img src={u.photoURL} className="w-12 h-12 rounded-full object-cover shadow-sm bg-gray-200" alt={u.displayName} />
            <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full ${u.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </div>
            <div className="flex-1 min-w-0 text-left">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{u.displayName}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{u.isAdmin ? 'Admin' : 'User'}</p>
            </div>
            <div className="text-right">
                {u.isOnline && (
                    <i className="fas fa-video text-blue-500 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full hover:bg-blue-200 transition text-xs"></i>
                )}
            </div>
        </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;