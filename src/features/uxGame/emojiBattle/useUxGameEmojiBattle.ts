
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://dfarxidgkgsndlzjjzjx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYXJ4aWRna2dzbmRsempqemp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODg3MDcsImV4cCI6MjA3OTU2NDcwN30.s4MiE6tSLXwF1Rebpr9KXUQB31ElRk2nL9bLGeHxB54"
);

export interface BattleState {
  round: number;
  p1Choice: string | null;
  p2Choice: string | null;
  p1Score: number;
  p2Score: number;
  winner: string | null;
  status: 'selecting' | 'revealed';
}

const WIN_LOGIC: Record<string, string[]> = {
    '🔥': ['🦍', '🌪️', '🧊', '🦖'],
    '⚡': ['🔥', '🦅', '💧', '🐉'],
    '💣': ['⚡', '🥊', '🧱', '🦈'],
    '🐉': ['💣', '🐅', '🌑', '🦍'],
    '🌪️': ['🐉', '🦈', '🍃', '🔥'],
    '🥊': ['🦍', '🦖', '🪵', '🦅'],
    '🦍': ['🐅', '🦈', '🥥', '🦄'],
    '🐅': ['🦄', '🦅', '🦌', '🥊'],
    '🦖': ['🦄', '🔥', '🚗', '💣'],
    '🦈': ['🦖', '💣', '🏄', '⚡'],
    '🦅': ['🌪️', '🥊', '🐁', '🐟'],
    '🦄': ['⚡', '🐉', '🌈', '🐅'],
};

export const useUxGameEmojiBattle = (chatId: string, currentUserUid: string) => {
  const [battle, setBattle] = useState<BattleState>({
    round: 1,
    p1Choice: null,
    p2Choice: null,
    p1Score: 0,
    p2Score: 0,
    winner: null,
    status: 'selecting'
  });

  const players = chatId.split('_').sort();
  const p1 = players[0];
  const isP1 = currentUserUid === p1;

  const determineRoundResult = (c1: string, c2: string) => {
      if (!c1 || !c2) return null;
      if (c1 === c2) return 'draw';
      if (WIN_LOGIC[c1]?.includes(c2)) return 'p1';
      if (WIN_LOGIC[c2]?.includes(c1)) return 'p2';
      const seed = (c1.codePointAt(0)! + c2.codePointAt(0)!) % 2;
      return seed === 0 ? 'p1' : 'p2';
  };

  const mapData = (data: any): BattleState => {
    const p1C = data.p1_choice;
    const p2C = data.p2_choice;
    const isRevealed = !!data.winner || (!!p1C && !!p2C);
    
    let effectiveWinner = data.winner;
    if (!effectiveWinner && p1C && p2C) {
        effectiveWinner = determineRoundResult(p1C, p2C);
    }

    return {
      round: data.round,
      p1Choice: p1C,
      p2Choice: p2C,
      p1Score: data.p1_score,
      p2Score: data.p2_score,
      winner: effectiveWinner,
      status: isRevealed ? 'revealed' : 'selecting'
    };
  };

  const updateScoreInDb = async (winner: string, s1: number, s2: number, rowId: string) => {
      const newP1Score = winner === 'p1' ? s1 + 1 : s1;
      const newP2Score = winner === 'p2' ? s2 + 1 : s2;

      await supabase.from('emoji_battle').update({
          winner: winner,
          p1_score: newP1Score,
          p2_score: newP2Score
      }).eq('id', rowId);
  };

  useEffect(() => {
    if (!chatId) return;

    const fetchGame = async () => {
      try {
        const { data } = await supabase.from('emoji_battle').select('*').eq('chat_id', chatId).single();
        if (data) {
          setBattle(mapData(data));
        } else {
          await supabase.from('emoji_battle').insert([{ chat_id: chatId }]);
        }
      } catch (err) {
        console.error("Error fetching battle:", err);
      }
    };
    fetchGame();

    const channel = supabase.channel(`emoji_battle:${chatId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'emoji_battle', filter: `chat_id=eq.${chatId}` }, 
      (payload) => {
        const newData = payload.new;
        const newState = mapData(newData);
        setBattle(newState);

        // Host Logic: Update DB Score if needed
        if (isP1 && newData.p1_choice && newData.p2_choice && !newData.winner) {
           const localWinner = determineRoundResult(newData.p1_choice, newData.p2_choice);
           if (localWinner) {
               updateScoreInDb(localWinner, newData.p1_score, newData.p2_score, newData.id);
           }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId, isP1]);

  const chooseEmoji = async (emoji: string) => {
    if (battle.status !== 'selecting') return;
    if ((isP1 && battle.p1Choice) || (!isP1 && battle.p2Choice)) return;

    const field = isP1 ? 'p1_choice' : 'p2_choice';
    await supabase.from('emoji_battle').update({ [field]: emoji }).eq('chat_id', chatId);
  };

  const nextRound = async () => {
    await supabase.from('emoji_battle').update({
        round: battle.round + 1,
        p1_choice: null,
        p2_choice: null,
        winner: null
    }).eq('chat_id', chatId);
  };

  const getLogicText = (winner: string | null, p1C: string | null, p2C: string | null) => {
      if (!winner || !p1C || !p2C) return 'Waiting for results...';
      if (winner === 'draw') return 'Same Power Level!';
      const wC = winner === 'p1' ? p1C : p2C;
      const lC = winner === 'p1' ? p2C : p1C;
      if (WIN_LOGIC[wC]?.includes(lC)) return `${wC} defeats ${lC}`;
      return `${wC} overpowers ${lC}`;
  };

  return { battle, chooseEmoji, nextRound, isP1, getLogicText };
};
