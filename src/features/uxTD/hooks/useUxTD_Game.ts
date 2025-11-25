
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';
import { TD_MYSTERY_LIST } from '../utils/uxTD_Lists';

export interface TDGame {
  id: string;
  chat_id: string;
  turn: string; // UID
  task_type: 'truth' | 'dare' | 'mystery' | 'danger' | null;
  task_text: string | null;
  task_answer: string | null;
  task_status: 'idle' | 'pending' | 'accepted' | 'completed';
  skip_user1: number;
  skip_user2: number;
  score_user1: number;
  score_user2: number;
  last_reaction: string | null;
  history: any[];
}

export const useUxTD_Game = (chatId: string, currentUserUid: string) => {
  const [game, setGame] = useState<TDGame | null>(null);
  const [loading, setLoading] = useState(true);

  // Identify Players
  const sortedUids = chatId.split('_').sort();
  const p1 = sortedUids[0];
  const p2 = sortedUids[1];
  const isP1 = currentUserUid === p1;

  // Determine Roles
  const isMyTurn = game?.turn === currentUserUid;
  const isSpinner = isMyTurn; // The person whose turn it is
  const isOpponent = !isMyTurn; // The person assigning tasks (for Truth/Danger)

  const mySkipCount = isP1 ? (game?.skip_user1 || 0) : (game?.skip_user2 || 0);
  const canSkip = mySkipCount < 3;

  useEffect(() => {
    if (!chatId) return;

    const fetchGame = async () => {
      let { data } = await supabase.from('truth_dare_games').select('*').eq('chat_id', chatId).single();
      
      if (!data) {
        // Create Game
        const { data: newData } = await supabase.from('truth_dare_games').insert([{
            chat_id: chatId,
            turn: p1, // P1 starts
            task_status: 'idle'
        }]).select().single();
        data = newData;
      }
      setGame(data);
      setLoading(false);
    };
    fetchGame();

    const channel = supabase.channel(`td_game:${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'truth_dare_games', filter: `chat_id=eq.${chatId}` }, 
      (payload) => {
        setGame(payload.new as TDGame);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  // ACTIONS

  const spinWheel = async (type: string) => {
    if (!game) return;
    
    // If Mystery, auto-pick immediately
    if (type === 'mystery') {
        const randomTask = TD_MYSTERY_LIST[Math.floor(Math.random() * TD_MYSTERY_LIST.length)];
        await supabase.from('truth_dare_games').update({
            task_type: 'mystery',
            task_text: randomTask,
            task_status: 'accepted' // Skip pending, go straight to doing
        }).eq('chat_id', chatId);
    } else {
        // Truth/Dare/Danger -> Go to Pending (Opponent picks question)
        await supabase.from('truth_dare_games').update({
            task_type: type,
            task_status: 'pending',
            task_text: null,
            task_answer: null
        }).eq('chat_id', chatId);
    }
  };

  const sendQuestion = async (text: string) => {
    await supabase.from('truth_dare_games').update({
        task_text: text,
        task_status: 'accepted'
    }).eq('chat_id', chatId);
  };

  const sendAnswer = async (answer: string) => {
      // Mark as completed so reaction panel shows
      await supabase.from('truth_dare_games').update({
          task_answer: answer,
          task_status: 'completed',
          last_reaction: null // Reset reaction
      }).eq('chat_id', chatId);
  };

  const skipTurn = async () => {
      if (!game || !canSkip) return;

      const skipField = isP1 ? 'skip_user1' : 'skip_user2';
      const scoreField = isP1 ? 'score_user1' : 'score_user2';
      
      const newHistory = [
          { type: 'skip', by: currentUserUid, ts: Date.now() },
          ...(game.history || [])
      ];

      // Penalty: -10 points, +1 skip count, Next Turn
      const nextTurn = game.turn === p1 ? p2 : p1;

      await supabase.from('truth_dare_games').update({
          [skipField]: mySkipCount + 1,
          [scoreField]: (isP1 ? game.score_user1 : game.score_user2) - 10,
          task_status: 'idle',
          task_type: null,
          task_text: null,
          task_answer: null,
          turn: nextTurn,
          history: newHistory
      }).eq('chat_id', chatId);
  };

  const sendReaction = async (emoji: string) => {
      await supabase.from('truth_dare_games').update({
          last_reaction: emoji
      }).eq('chat_id', chatId);
  };

  const nextTurn = async () => {
      if (!game) return;
      
      // Calculate Score
      const points = game.task_type === 'danger' ? 20 : (game.task_type === 'mystery' ? 15 : 10);
      const scoreField = game.turn === p1 ? 'score_user1' : 'score_user2';
      const currentScore = game.turn === p1 ? game.score_user1 : game.score_user2;
      
      const newHistory = [
          { type: game.task_type, text: game.task_text, ans: game.task_answer, ts: Date.now() },
          ...(game.history || [])
      ];

      const nextPlayer = game.turn === p1 ? p2 : p1;

      await supabase.from('truth_dare_games').update({
          task_status: 'idle',
          task_type: null,
          task_text: null,
          task_answer: null,
          last_reaction: null,
          turn: nextPlayer,
          [scoreField]: currentScore + points,
          history: newHistory
      }).eq('chat_id', chatId);
  };

  return {
    game,
    loading,
    isSpinner,
    isOpponent,
    canSkip,
    mySkipCount,
    spinWheel,
    sendQuestion,
    sendAnswer,
    skipTurn,
    sendReaction,
    nextTurn,
    p1, p2
  };
};
