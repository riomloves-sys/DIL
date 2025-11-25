
import React, { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

interface LockedMediaItem {
  messageId: string;
  url: string;
  type: 'image' | 'video';
  lockedByUid: string;
  ts: number;
}

interface Props {
  chatId: string;
  messageId: string;
  url: string;
  type: 'image' | 'video' | string;
  currentUserUid: string;
  isOwner: boolean;
  lockedMedia: LockedMediaItem[];
}

const UxExtra_LockToggle: React.FC<Props> = ({ chatId, messageId, url, type, currentUserUid, isOwner, lockedMedia }) => {
  const [loading, setLoading] = useState(false);
  
  // Check if this specific message is in the locked array
  const isLocked = lockedMedia.some(item => item.messageId === messageId);

  const toggleLock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner || loading) return;
    
    // Only allow images or videos
    if (type !== 'image' && type !== 'video') return;
    
    setLoading(true);
    const docRef = doc(db, 'chats', chatId);
    
    // Store URL and Type so it persists even if message is deleted
    const item: LockedMediaItem = { 
      messageId, 
      url, 
      type: type as 'image' | 'video',
      lockedByUid: currentUserUid, 
      ts: Date.now() 
    };

    try {
      const snapshot = await getDoc(docRef);
      let currentLocked: LockedMediaItem[] = [];
      let currentPinHash = '';
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        currentLocked = data.meta?.lockedMedia || [];
        currentPinHash = data.meta?.lockPinHash || '';
      }

      let newLocked = [...currentLocked];

      if (isLocked) {
        // Unlock: Remove item
        newLocked = newLocked.filter(i => i.messageId !== messageId);
      } else {
        // Lock: Add item
        newLocked.push(item);
      }

      await setDoc(docRef, {
        meta: {
          lockPinHash: currentPinHash,
          lockedMedia: newLocked
        }
      }, { merge: true });

    } catch (err) {
      console.error('Lock toggle failed:', err);
      // Fallback: LocalStorage
      const localKey = `uxExtra_pending_locks_${chatId}`;
      const pending = JSON.parse(localStorage.getItem(localKey) || '[]');
      pending.push({ action: isLocked ? 'unlock' : 'lock', messageId, url, type, ts: Date.now() });
      localStorage.setItem(localKey, JSON.stringify(pending));
      
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded shadow-lg z-50 text-sm';
      toast.innerText = 'Offline: Saved locally. Sync pending.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner && !isLocked) return null;

  return (
    <div 
      onClick={toggleLock}
      className={`absolute top-2 right-2 z-10 p-1.5 rounded-full cursor-pointer transition shadow-sm backdrop-blur-sm
        ${isLocked ? 'bg-green-500/90 text-white' : 'bg-black/30 text-white/70 hover:bg-black/50'}
      `}
      title={isLocked ? "Saved to Vault (Safe from deletion)" : "Save to Locked Gallery"}
    >
      {loading ? (
        <i className="fas fa-spinner fa-spin text-xs"></i>
      ) : (
        <i className={`fas ${isLocked ? 'fa-shield-alt' : 'fa-unlock'} text-xs`}></i>
      )}
    </div>
  );
};

export default UxExtra_LockToggle;
