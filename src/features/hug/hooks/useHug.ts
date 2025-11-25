
import { useState, useEffect } from 'react';
import { uxHugSupabase } from '../../../supabase/uxHug_client';

export type HugType = 'soft' | 'tight' | 'missyou' | 'sleep';

export interface HugEvent {
  id: string;
  sender_uid: string;
  hug_type: HugType;
}

export const useHug = (chatId: string, currentUserUid: string) => {
  const [incomingHug, setIncomingHug] = useState<HugEvent | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const channel = uxHugSupabase.channel(`hugs:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'virtual_hugs', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const newHug = payload.new as HugEvent;
          // Only trigger animation if I am NOT the sender
          if (newHug.sender_uid !== currentUserUid) {
            setIncomingHug(newHug);
          }
        }
      )
      .subscribe();

    return () => {
      uxHugSupabase.removeChannel(channel);
    };
  }, [chatId, currentUserUid]);

  const sendHug = async (type: HugType) => {
    try {
      await uxHugSupabase.from('virtual_hugs').insert({
        chat_id: chatId,
        sender_uid: currentUserUid,
        hug_type: type
      });
    } catch (error) {
      console.error("Failed to send hug:", error);
    }
  };

  const clearHug = () => {
    setIncomingHug(null);
  };

  return {
    incomingHug,
    sendHug,
    clearHug
  };
};
