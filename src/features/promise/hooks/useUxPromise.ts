
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';

export interface UxPromise {
  id: string;
  chat_id: string;
  created_by: string;
  for_user: string;
  promise_text: string;
  status: 'pending' | 'completed' | 'broken';
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
}

const PROMISE_KEYWORDS = [
  "promise", "pakka", "sure", "i will", "i promise", 
  "kal karunga", "kal karungi", "trust me", "i won't do it again",
  "kasam se", "promis"
];

export const useUxPromise = (chatId: string, currentUserUid: string) => {
  const [promises, setPromises] = useState<UxPromise[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. KEYWORD DETECTION ---
  const detectPromiseKeyword = (text: string): boolean => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return PROMISE_KEYWORDS.some(k => lower.includes(k));
  };

  // --- 2. FETCH & SUBSCRIBE ---
  useEffect(() => {
    if (!chatId) return;

    const fetchPromises = async () => {
      const { data, error } = await supabase
        .from('ux_promises')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setPromises(data as UxPromise[]);
      }
      setLoading(false);
    };

    fetchPromises();

    const channel = supabase.channel(`promises:${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ux_promises', filter: `chat_id=eq.${chatId}` }, 
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newPromise = payload.new as UxPromise;
          setPromises(prev => {
            // Avoid duplicates if optimistic update already added it or race condition
            if (prev.some(p => p.id === newPromise.id)) return prev;
            return [newPromise, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setPromises(prev => prev.map(p => p.id === payload.new.id ? payload.new as UxPromise : p));
        } else if (payload.eventType === 'DELETE') {
          setPromises(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  // --- 3. ACTIONS ---

  const addPromise = async (text: string, forUser: string, dueDate: string | null = null) => {
    if (!chatId || !currentUserUid) return;

    // 1. Optimistic Update (Instant UI feedback)
    const tempId = `temp-${Date.now()}`;
    const optimisticPromise: UxPromise = {
        id: tempId,
        chat_id: chatId,
        created_by: currentUserUid,
        for_user: forUser,
        promise_text: text,
        status: 'pending',
        due_date: dueDate,
        created_at: new Date().toISOString(),
        completed_at: null
    };

    setPromises(prev => [optimisticPromise, ...prev]);

    // 2. Perform DB Insert
    const { data, error } = await supabase
      .from('ux_promises')
      .insert([{
        chat_id: chatId,
        created_by: currentUserUid,
        for_user: forUser,
        promise_text: text,
        status: 'pending',
        due_date: dueDate
      }])
      .select()
      .single();

    if (error) {
        console.error("Failed to add promise", error);
        // Rollback on error
        setPromises(prev => prev.filter(p => p.id !== tempId));
    } else if (data) {
        // 3. Replace Temp with Real Data
        const realPromise = data as UxPromise;
        setPromises(prev => {
            // If Realtime subscription already added the real row, just remove temp
            if (prev.some(p => p.id === realPromise.id)) {
                return prev.filter(p => p.id !== tempId);
            }
            // Otherwise swap temp for real
            return prev.map(p => p.id === tempId ? realPromise : p);
        });
    }
  };

  const updateStatus = async (promiseId: string, newStatus: 'completed' | 'broken') => {
    // Optimistic update for status
    setPromises(prev => prev.map(p => {
        if (p.id === promiseId) {
            return { 
                ...p, 
                status: newStatus, 
                completed_at: newStatus === 'completed' ? new Date().toISOString() : null 
            };
        }
        return p;
    }));

    const updates: any = { 
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    };

    const { error } = await supabase.from('ux_promises').update(updates).eq('id', promiseId);
    
    if (error) {
        console.error("Failed to update status", error);
        // Revert if needed, but usually fetch/realtime corrects it
    }
  };

  return {
    promises,
    loading,
    detectPromiseKeyword,
    addPromise,
    updateStatus
  };
};
