
import { useState, useEffect } from 'react';
import { uxLoveSupabase } from '../../../supabase/uxLove_client';
import { uxLove_encryptText, uxLove_hashPin } from '../utils/uxLove_crypto';

export interface LoveLetter {
  id: string;
  chat_id: string;
  sender_uid: string;
  receiver_uid: string;
  title: string | null;
  body: string;
  is_encrypted: boolean;
  encryption_meta: any;
  is_locked: boolean;
  pin_hash: string | null;
  is_read: boolean;
  opened_at: string | null;
  created_at: string;
}

export interface LoveReaction {
  id: string;
  letter_id: string;
  reacted_by: string;
  reaction: string;
}

export const useUxLoveLetters = (chatId: string, currentUserUid: string) => {
  const [letters, setLetters] = useState<LoveLetter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) return;

    const fetchLetters = async () => {
      const { data, error } = await uxLoveSupabase
        .from('love_letters')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setLetters(data as LoveLetter[]);
      }
      setLoading(false);
    };

    fetchLetters();

    const channel = uxLoveSupabase.channel(`letters:${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'love_letters', filter: `chat_id=eq.${chatId}` }, 
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setLetters(prev => [payload.new as LoveLetter, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setLetters(prev => prev.map(l => l.id === payload.new.id ? payload.new as LoveLetter : l));
        }
      })
      .subscribe();

    return () => { uxLoveSupabase.removeChannel(channel); };
  }, [chatId]);

  const createLetter = async (
    title: string, 
    body: string, 
    receiverUid: string,
    options: { 
      passphrase?: string, 
      pin?: string 
    }
  ) => {
    let finalBody = body;
    let isEncrypted = false;
    let encMeta = {};
    let isLocked = false;
    let pinHash = null;

    // 1. Encryption
    if (options.passphrase) {
      const result = await uxLove_encryptText(body, options.passphrase);
      finalBody = result.cipherText;
      encMeta = result.meta;
      isEncrypted = true;
    }

    // 2. Locking
    if (options.pin) {
      pinHash = await uxLove_hashPin(options.pin);
      isLocked = true;
    }

    const { error } = await uxLoveSupabase.from('love_letters').insert([{
      chat_id: chatId,
      sender_uid: currentUserUid,
      receiver_uid: receiverUid,
      title: title || 'Untitled Letter',
      body: finalBody,
      is_encrypted: isEncrypted,
      encryption_meta: encMeta,
      is_locked: isLocked,
      pin_hash: pinHash
    }]);

    if (error) console.error("Failed to send letter", error);
    return !error;
  };

  const markRead = async (letterId: string) => {
    await uxLoveSupabase.from('love_letters').update({
      is_read: true,
      opened_at: new Date().toISOString()
    }).eq('id', letterId);
  };

  const addReaction = async (letterId: string, reaction: string) => {
    await uxLoveSupabase.from('love_letter_reactions').insert({
      letter_id: letterId,
      reacted_by: currentUserUid,
      reaction
    });
  };

  return {
    letters,
    loading,
    createLetter,
    markRead,
    addReaction
  };
};
