
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  emoji: string;
  description: string;
  createdBy: string;
  createdAt: number;
}

export const useUxExtraCalendar = (chatId: string | undefined, currentUserUid: string | undefined) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) return;
    const ref = doc(db, 'chats', chatId, 'extensions', 'calendar');
    
    const unsub = onSnapshot(ref, 
      (snap) => {
        if (snap.exists()) {
          setEvents(snap.data().events || []);
        } else {
          setEvents([]);
        }
        setLoading(false);
      },
      (error) => {
        if (error.code !== 'permission-denied') {
            console.error("Calendar sync error:", error);
        }
        setLoading(false);
      }
    );
    return () => unsub();
  }, [chatId]);

  const saveEvent = async (event: CalendarEvent) => {
    if (!chatId) return;
    const ref = doc(db, 'chats', chatId, 'extensions', 'calendar');
    try {
        const snap = await getDoc(ref);
        let currentEvents = snap.exists() ? snap.data().events || [] : [];
        
        // Check if updating or adding
        const existingIndex = currentEvents.findIndex((e: any) => e.id === event.id);
        if (existingIndex >= 0) {
        currentEvents[existingIndex] = event;
        } else {
        currentEvents.push(event);
        }
        
        await setDoc(ref, { events: currentEvents }, { merge: true });
    } catch (err: any) {
        if (err.code !== 'permission-denied') {
            console.error("Error saving event:", err);
            alert("Failed to save event.");
        }
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!chatId) return;
    const ref = doc(db, 'chats', chatId, 'extensions', 'calendar');
    try {
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        
        const currentEvents = snap.data().events || [];
        const newEvents = currentEvents.filter((e: any) => e.id !== eventId);
        
        await setDoc(ref, { events: newEvents }, { merge: true });
    } catch (err: any) {
         if (err.code !== 'permission-denied') {
            console.error("Error deleting event:", err);
        }
    }
  };

  return { events, saveEvent, deleteEvent, loading };
};
