import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CallProvider } from './context/CallContext';
import LoginPage from './app/login/page';
import SignupPage from './app/signup/page';
import ChatSidebar from './components/Chat/ChatSidebar';
import ChatWindow from './components/Chat/ChatWindow';
import AdminPage from './app/admin/page';
import EditProfilePage from './app/profile/page';
import { ProtectedRoute, PublicRoute } from './components/Auth/AuthGuard';

const ChatLayout = () => {
  const location = useLocation();
  // We are in "active chat" mode if the path is NOT just "/chat" (with or without trailing slash)
  const isChatActive = location.pathname.replace(/\/$/, '') !== '/chat';

  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
       {/* Sidebar: 
           - Mobile: Hidden if chat is active
           - Desktop: Always visible (width handled by component)
           - shrink-0 ensures it doesn't get squashed
       */}
       <div className={`${isChatActive ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full shrink-0`}>
          <ChatSidebar />
       </div>

       {/* Main Content (Chat Window):
           - Mobile: Hidden if chat is NOT active
           - Desktop: Always visible (flex-1)
           - min-w-0 is CRITICAL for flex containers to handle overflow text correctly
       */}
       <div className={`${isChatActive ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-gray-50 dark:bg-gray-900 min-w-0`}>
          <Outlet />
       </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CallProvider>
            <HashRouter>
            <Routes>
                {/* Root Redirect */}
                <Route path="/" element={<Navigate to="/chat" replace />} />

                {/* Public Routes */}
                <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                </Route>

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                <Route path="/edit-profile" element={<EditProfilePage />} />
                
                <Route path="/chat" element={<ChatLayout />}>
                    <Route index element={
                    <div className="flex-1 flex flex-col items-center justify-center text-center h-full text-gray-500 p-4 min-w-0">
                        <div className="w-24 h-24 bg-blue-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            <i className="fas fa-comments text-4xl text-blue-500"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Welcome to ChatApp Pro</h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Select a conversation from the sidebar to start messaging.</p>
                    </div>
                    } />
                    <Route path=":chatId" element={<ChatWindow />} />
                </Route>
                
                <Route path="/admin" element={<AdminPage />} />
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
            </HashRouter>
        </CallProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;