
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

export interface UxExtra_Mood {
  emoji: string;
  label: string;
  color: string;
  updatedBy: string;
  ts?: any;
}

export const useUxExtraMood = (chatId: string | undefined, currentUserUid: string | undefined) => {
  const [mood, setMood] = useState<UxExtra_Mood | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const unsub = onSnapshot(doc(db, 'chats', chatId), 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.meta && data.meta.mood) {
            setMood(data.meta.mood as UxExtra_Mood);
          } else {
            setMood(null);
          }
        }
      },
      (error) => {
        if (error.code !== 'permission-denied') {
            console.error("Mood sync error:", error);
        }
      }
    );

    return () => unsub();
  }, [chatId]);

  const updateMood = async (emoji: string, label: string, color: string) => {
    if (!chatId || !currentUserUid) return;

    const newMood: UxExtra_Mood = {
      emoji,
      label,
      color,
      updatedBy: currentUserUid,
      ts: serverTimestamp(),
    };

    try {
        await setDoc(doc(db, 'chats', chatId), {
        meta: {
            mood: newMood
        }
        }, { merge: true });
    } catch (err: any) {
        if (err.code !== 'permission-denied') {
            console.error("Error updating mood:", err);
        }
    }
  };

  return { mood, updateMood };
};
