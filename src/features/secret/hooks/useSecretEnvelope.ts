
import { useState, useEffect } from 'react';
import { uxSecretSupabase } from '../../../supabase/uxSecret_client';

export interface SecretEnvelope {
  id: string;
  chat_id: string;
  sender_uid: string;
  receiver_uid: string;
  message: string;
  audio_url: string | null;
  unlock_at: string; // ISO timestamp
  revealed: boolean;
  created_at: string;
}

export const useSecretEnvelope = (chatId: string, currentUserUid: string) => {
  const [envelopes, setEnvelopes] = useState<SecretEnvelope[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) return;

    const fetchEnvelopes = async () => {
      const { data, error } = await uxSecretSupabase
        .from('secret_envelopes')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setEnvelopes(data as SecretEnvelope[]);
      }
      setLoading(false);
    };

    fetchEnvelopes();

    // Real-time Subscription
    const channel = uxSecretSupabase.channel(`secret:${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'secret_envelopes', filter: `chat_id=eq.${chatId}` }, 
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setEnvelopes(prev => [payload.new as SecretEnvelope, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setEnvelopes(prev => prev.map(e => e.id === payload.new.id ? payload.new as SecretEnvelope : e));
        } else if (payload.eventType === 'DELETE') {
          setEnvelopes(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { uxSecretSupabase.removeChannel(channel); };
  }, [chatId]);

  const createEnvelope = async (message: string, unlockDate: Date, audioUrl: string | null = null) => {
    const receiverUid = chatId.split('_').find(uid => uid !== currentUserUid) || 'unknown';
    
    const { error } = await uxSecretSupabase.from('secret_envelopes').insert([{
      chat_id: chatId,
      sender_uid: currentUserUid,
      receiver_uid: receiverUid,
      message,
      audio_url: audioUrl,
      unlock_at: unlockDate.toISOString(),
      revealed: false
    }]);

    if (error) console.error("Error creating envelope:", error);
    return !error;
  };

  const revealEnvelope = async (id: string) => {
    // Optimistic update
    setEnvelopes(prev => prev.map(e => e.id === id ? { ...e, revealed: true } : e));
    
    await uxSecretSupabase.from('secret_envelopes').update({
      revealed: true
    }).eq('id', id);
  };

  return {
    envelopes,
    loading,
    createEnvelope,
    revealEnvelope
  };
};
