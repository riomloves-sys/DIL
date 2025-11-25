
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://dfarxidgkgsndlzjjzjx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYXJ4aWRna2dzbmRsempqemp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODg3MDcsImV4cCI6MjA3OTU2NDcwN30.s4MiE6tSLXwF1Rebpr9KXUQB31ElRk2nL9bLGeHxB54"
);

const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryState {
  cards: Card[];
  p1Turn: boolean;
  p1Score: number;
  p2Score: number;
  winner: string | null;
  lastMoveResult: 'match' | 'miss' | null;
  isProcessing: boolean;
}

export const useUxGameMemoryMatch = (chatId: string, currentUserUid: string) => {
  const [game, setGame] = useState<MemoryState>({
    cards: [],
    p1Turn: true,
    p1Score: 0,
    p2Score: 0,
    winner: null,
    lastMoveResult: null,
    isProcessing: false
  });

  const players = chatId.split('_').sort();
  const p1 = players[0];
  const isP1 = currentUserUid === p1;
  const isMyTurn = (game.p1Turn && isP1) || (!game.p1Turn && !isP1);

  // --- HELPER FUNCTIONS (Defined before useEffect) ---

  const mapData = (data: any): MemoryState => ({
    cards: data.cards || [],
    p1Turn: data.p1_turn,
    p1Score: data.p1_score,
    p2Score: data.p2_score,
    winner: data.winner,
    lastMoveResult: null, 
    isProcessing: false
  });

  const resetGame = async () => {
    // 1. Create shuffled deck
    const deck = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, isFlipped: false, isMatched: false }));

    // 2. Optimistic Update
    setGame(prev => ({
        ...prev,
        cards: deck,
        p1Turn: true,
        p1Score: 0,
        p2Score: 0,
        winner: null,
        isProcessing: false
    }));

    // 3. Sync to DB
    await supabase.from('memory_match_games').update({
      cards: deck,
      p1_turn: true,
      p1_score: 0,
      p2_score: 0,
      matched_pairs: 0,
      winner: null
    }).eq('chat_id', chatId);
  };

  useEffect(() => {
    if (!chatId) return;

    const fetchGame = async () => {
      const { data } = await supabase.from('memory_match_games').select('*').eq('chat_id', chatId).single();
      
      if (data) {
        // Fix: If game exists but cards are empty/null, initialize them!
        if (!data.cards || data.cards.length === 0) {
            resetGame();
        } else {
            setGame(mapData(data));
        }
      } else {
        await supabase.from('memory_match_games').insert([{ chat_id: chatId }]);
        resetGame();
      }
    };
    fetchGame();

    const channel = supabase.channel(`memory:${chatId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'memory_match_games', filter: `chat_id=eq.${chatId}` }, 
      (payload) => {
        setGame(prev => ({
          ...mapData(payload.new),
          isProcessing: prev.isProcessing,
          lastMoveResult: prev.lastMoveResult
        }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  const flipCard = async (cardId: number) => {
    if (!isMyTurn || game.isProcessing || game.winner) return;

    const cardIndex = game.cards.findIndex(c => c.id === cardId);
    const card = game.cards[cardIndex];
    if (!card || card.isFlipped || card.isMatched) return;

    const flippedCardIndex = game.cards.findIndex(c => c.isFlipped && !c.isMatched);

    let newCards = [...game.cards];
    newCards[cardIndex] = { ...card, isFlipped: true };

    if (flippedCardIndex === -1) {
        // --- 1st Card Flipped ---
        setGame(prev => ({ ...prev, cards: newCards }));
        await supabase.from('memory_match_games').update({ cards: newCards }).eq('chat_id', chatId);
    } else {
        // --- 2nd Card Flipped ---
        const otherCard = newCards[flippedCardIndex];
        
        setGame(prev => ({ ...prev, cards: newCards, isProcessing: true })); 
        await supabase.from('memory_match_games').update({ cards: newCards }).eq('chat_id', chatId);

        if (otherCard.emoji === card.emoji) {
            // --- MATCH ---
            newCards[cardIndex].isMatched = true;
            newCards[flippedCardIndex].isMatched = true;
            
            const newP1Score = game.p1Turn ? game.p1Score + 1 : game.p1Score;
            const newP2Score = !game.p1Turn ? game.p2Score + 1 : game.p2Score;
            
            const allMatched = newCards.every(c => c.isMatched);
            const winner = allMatched ? (newP1Score > newP2Score ? 'p1' : newP2Score > newP1Score ? 'p2' : 'draw') : null;

            setGame(prev => ({ ...prev, lastMoveResult: 'match' }));
            setTimeout(() => setGame(prev => ({ ...prev, lastMoveResult: null })), 1500);

            setTimeout(async () => {
                await supabase.from('memory_match_games').update({
                    cards: newCards,
                    p1_score: newP1Score,
                    p2_score: newP2Score,
                    winner: winner
                }).eq('chat_id', chatId);
                setGame(prev => ({ ...prev, isProcessing: false }));
            }, 600);

        } else {
            // --- MISS ---
            setGame(prev => ({ ...prev, lastMoveResult: 'miss' }));
            setTimeout(() => setGame(prev => ({ ...prev, lastMoveResult: null })), 1500);

            setTimeout(async () => {
                const resetCards = [...newCards];
                resetCards[cardIndex].isFlipped = false;
                resetCards[flippedCardIndex].isFlipped = false;
                
                await supabase.from('memory_match_games').update({
                    cards: resetCards,
                    p1_turn: !game.p1Turn 
                }).eq('chat_id', chatId);
                
                setGame(prev => ({ ...prev, isProcessing: false }));
            }, 1500);
        }
    }
  };

  return { game, flipCard, resetGame, isMyTurn, p1 };
};
