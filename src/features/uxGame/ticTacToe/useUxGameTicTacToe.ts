
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- SUPABASE CONFIG ---
const supabase = createClient(
  "https://dfarxidgkgsndlzjjzjx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYXJ4aWRna2dzbmRsempqemp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODg3MDcsImV4cCI6MjA3OTU2NDcwN30.s4MiE6tSLXwF1Rebpr9KXUQB31ElRk2nL9bLGeHxB54"
);

interface GameState {
  board: string[];
  turn: string;
  winner: string | null;
}

export const useUxGameTicTacToe = (chatId: string, currentUserUid: string) => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(''),
    turn: 'X',
    winner: null,
  });
  const [loading, setLoading] = useState(true);

  // Determine Players: Sort UIDs alphabetically to ensure consistent P1/P2 assignment
  const players = chatId.split('_').sort();
  const p1 = players[0]; // Player 1 is always 'X'
  const mySymbol = currentUserUid === p1 ? 'X' : 'O';
  const isMyTurn = gameState.turn === mySymbol;

  const fetchOrCreateGame = async () => {
    try {
      // 1. Try to fetch existing game
      const { data, error } = await supabase
        .from('tictactoe_games')
        .select('*')
        .eq('chat_id', chatId)
        .single();

      if (data) {
        setGameState({
          board: data.board,
          turn: data.turn,
          winner: data.winner,
        });
      } else {
        // 2. Create if doesn't exist
        const initialBoard = Array(9).fill('');
        const { error: insertError } = await supabase
          .from('tictactoe_games')
          .insert([
            { chat_id: chatId, board: initialBoard, turn: 'X', winner: null }
          ]);
        
        if (!insertError) {
          setGameState({ board: initialBoard, turn: 'X', winner: null });
        }
      }
    } catch (err) {
      console.error("Error fetching TTT:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chatId) return;

    fetchOrCreateGame();

    // --- SUPABASE REALTIME SUBSCRIPTION ---
    const channel = supabase
      .channel(`realtime:tictactoe:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tictactoe_games',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newData = payload.new;
          setGameState({
            board: newData.board,
            turn: newData.turn,
            winner: newData.winner,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const checkWinner = (board: string[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6] // diagonals
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a]; // 'X' or 'O'
      }
    }
    if (!board.includes('')) return 'draw';
    return null;
  };

  const makeMove = async (index: number) => {
    if (loading || !isMyTurn || gameState.board[index] || gameState.winner) return;

    const newBoard = [...gameState.board];
    newBoard[index] = mySymbol;

    const winner = checkWinner(newBoard);
    const nextTurn = winner ? null : (gameState.turn === 'X' ? 'O' : 'X');

    // Optimistic Update
    setGameState({ board: newBoard, turn: nextTurn || '', winner });

    // Sync to Supabase
    await supabase
      .from('tictactoe_games')
      .update({
        board: newBoard,
        turn: nextTurn,
        winner: winner,
        updated_at: new Date().toISOString()
      })
      .eq('chat_id', chatId);
  };

  const resetGame = async () => {
    const resetState = {
      board: Array(9).fill(''),
      turn: 'X',
      winner: null
    };
    
    setGameState(resetState);

    await supabase
      .from('tictactoe_games')
      .update({
        board: resetState.board,
        turn: resetState.turn,
        winner: resetState.winner,
        updated_at: new Date().toISOString()
      })
      .eq('chat_id', chatId);
  };

  return { gameState, makeMove, resetGame, mySymbol, isMyTurn, loading };
};
