import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { auth, db, rtdb } from '../lib/firebase';
import { UserProfile } from '../types';
import { ADMIN_EMAIL } from '../constants';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, logout: async () => {} });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Setup Presence
        const userStatusDbRef = ref(rtdb, '/status/' + firebaseUser.uid);
        const isOfflineForRTDB = { state: 'offline', last_changed: Date.now() };
        const isOnlineForRTDB = { state: 'online', last_changed: Date.now() };
        
        // Session Token Logic (Single Device Login)
        const sessionToken = Math.random().toString(36).substring(2);
        const sessionRef = ref(rtdb, `activeSessions/${firebaseUser.uid}`);
        
        // Check current session
        const tokenCheck = localStorage.getItem('sessionToken');
        if (!tokenCheck) {
            localStorage.setItem('sessionToken', sessionToken);
            set(sessionRef, sessionToken);
        }

        // Listen for remote logout
        onValue(sessionRef, (snap) => {
            const serverToken = snap.val();
            const localToken = localStorage.getItem('sessionToken');
            if (serverToken && localToken && serverToken !== localToken) {
                alert('You have been logged out from another device.');
                signOut(auth);
            }
        });

        // Presence Logic
        const connectedRef = ref(rtdb, '.info/connected');
        onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                onDisconnect(userStatusDbRef).set(isOfflineForRTDB).then(() => {
                    set(userStatusDbRef, isOnlineForRTDB);
                });
                // Also update Firestore for persistent last seen
                setDoc(doc(db, 'users', firebaseUser.uid), { 
                    isOnline: true 
                }, { merge: true });
            }
        });

        // User Data Listener
        const userRef = doc(db, 'users', firebaseUser.uid);
        onSnapshot(userRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              setUser({ ...docSnap.data() as UserProfile, uid: firebaseUser.uid });
            } else {
               // Create user if not exists
               const newUser: UserProfile = {
                   uid: firebaseUser.uid,
                   email: firebaseUser.email || '',
                   displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                   photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email}`,
                   isAdmin: firebaseUser.email === ADMIN_EMAIL
               };
               setDoc(userRef, newUser, { merge: true });
               setUser(newUser);
            }
            setLoading(false);
          },
          (error) => {
            // Handle permission denied gracefully
            if (error.code !== 'permission-denied') {
              console.error("Auth context user sync error:", error);
            } else {
              // Fallback for permission denied: set basic user info from Auth
              setUser({
                 uid: firebaseUser.uid,
                 email: firebaseUser.email || '',
                 displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                 photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email}`,
                 isAdmin: false
              });
            }
            setLoading(false);
          }
        );

      } else {
        // Cleanup presence if needed (handled by onDisconnect usually)
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if (user) {
        // Set offline status explicitly
        await set(ref(rtdb, '/status/' + user.uid), { state: 'offline' });
        await setDoc(doc(db, 'users', user.uid), { isOnline: false, lastSeen: serverTimestamp() }, { merge: true });
        localStorage.removeItem('sessionToken');
        await signOut(auth);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};