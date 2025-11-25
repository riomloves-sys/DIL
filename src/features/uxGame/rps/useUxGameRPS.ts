
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://dfarxidgkgsndlzjjzjx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYXJ4aWRna2dzbmRsempqemp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODg3MDcsImV4cCI6MjA3OTU2NDcwN30.s4MiE6tSLXwF1Rebpr9KXUQB31ElRk2nL9bLGeHxB54"
);

interface RPSState {
  p1Choice: string | null;
  p2Choice: string | null;
  result: string | null; // 'p1', 'p2', 'draw'
  reason: string | null; // 'Rock crushes Scissors'
}

export const useUxGameRPS = (chatId: string, currentUserUid: string) => {
  const [game, setGame] = useState<RPSState>({
    p1Choice: null,
    p2Choice: null,
    result: null,
    reason: null
  });

  const players = chatId.split('_').sort();
  const p1 = players[0];
  const isP1 = currentUserUid === p1;

  // --- HELPER FUNCTIONS (Defined before use) ---
  
  const getReason = (c1: string, c2: string) => {
      if (c1 === c2) return 'Both chose same!';
      if (c1 === 'rock' && c2 === 'scissors') return 'Rock crushes Scissors';
      if (c1 === 'scissors' && c2 === 'paper') return 'Scissors cuts Paper';
      if (c1 === 'paper' && c2 === 'rock') return 'Paper covers Rock';
      
      // Reverse check for p2
      if (c2 === 'rock' && c1 === 'scissors') return 'Rock crushes Scissors';
      if (c2 === 'scissors' && c1 === 'paper') return 'Scissors cuts Paper';
      if (c2 === 'paper' && c1 === 'rock') return 'Paper covers Rock';
      return 'Win';
  };

  const calculateResult = (c1: string, c2: string) => {
      if (c1 === c2) return 'draw';
      if (
        (c1 === 'rock' && c2 === 'scissors') || 
        (c1 === 'paper' && c2 === 'rock') || 
        (c1 === 'scissors' && c2 === 'paper')
      ) {
        return 'p1';
      }
      return 'p2';
  };

  useEffect(() => {
    if (!chatId) return;

    // 1. Fetch initial state
    const fetchGame = async () => {
      const { data } = await supabase.from('rps_games').select('*').eq('chat_id', chatId).single();
      if (data) {
        const resultReason = data.result && data.p1_choice && data.p2_choice 
            ? getReason(data.p1_choice, data.p2_choice) 
            : null;
            
        setGame({
          p1Choice: data.p1_choice,
          p2Choice: data.p2_choice,
          result: data.result,
          reason: resultReason
        });
      } else {
        await supabase.from('rps_games').insert([{ chat_id: chatId }]);
      }
    };
    fetchGame();

    // 2. Subscribe
    const channel = supabase.channel(`rps:${chatId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rps_games', filter: `chat_id=eq.${chatId}` }, 
      (payload) => {
        const newData = payload.new;
        
        // Host (P1) computes winner if both chosen and no result yet (Backup logic)
        if (isP1 && newData.p1_choice && newData.p2_choice && !newData.result) {
            const res = calculateResult(newData.p1_choice, newData.p2_choice);
            supabase.from('rps_games').update({ result: res }).eq('chat_id', chatId);
        }
        
        const resultReason = newData.result ? getReason(newData.p1_choice, newData.p2_choice) : null;
        
        setGame({
          p1Choice: newData.p1_choice,
          p2Choice: newData.p2_choice,
          result: newData.result,
          reason: resultReason
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId, isP1]);

  const chooseOption = async (option: string) => {
    // Prevent move if game over or already chosen
    if (game.result) return;
    if ((isP1 && game.p1Choice) || (!isP1 && game.p2Choice)) return;

    const field = isP1 ? 'p1_choice' : 'p2_choice';
    const oppChoice = isP1 ? game.p2Choice : game.p1Choice;

    const updates: any = { [field]: option };

    // --- CRITICAL LOGIC: If opponent has already chosen, CALCULATE WINNER NOW ---
    if (oppChoice) {
        const p1C = isP1 ? option : oppChoice;
        const p2C = isP1 ? oppChoice : option;
        const result = calculateResult(p1C, p2C);
        updates.result = result;
    }

    await supabase.from('rps_games').update(updates).eq('chat_id', chatId);
  };

  const resetGame = async () => {
    await supabase.from('rps_games').update({
      p1_choice: null,
      p2_choice: null,
      result: null
    }).eq('chat_id', chatId);
  };

  return { game, chooseOption, resetGame, isP1 };
};
