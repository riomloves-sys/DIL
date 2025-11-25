
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { uxLoveReportSupabase } from '../../../supabase/uxLoveReport_client';
import { analyzeChat } from '../utils/analyzeChat';
import { Message } from '../../../../types';

export interface LoveReport {
  id?: string;
  week_start: string;
  communication_score: number;
  affection_score: number;
  mood_score: number;
  highlights: string[];
  suggestions: string[];
  created_at?: string;
}

export const useLoveReport = (chatId: string, currentUserUid: string) => {
  const [report, setReport] = useState<LoveReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const getWeekStart = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const weekStart = getWeekStart();
      
      // 1. Check Supabase for existing report for this week
      const { data, error } = await uxLoveReportSupabase
        .from('love_reports')
        .select('*')
        .eq('chat_id', chatId)
        .eq('week_start', weekStart)
        .single();

      if (data) {
        setReport(data);
        setLoading(false);
      } else {
        // No report for this week?
        setReport(null);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatId) fetchReport();
  }, [chatId]);

  const generateReport = async () => {
    setAnalyzing(true);
    try {
      // 1. Fetch Messages from Firebase (Last 7 Days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysTimestamp = Timestamp.fromDate(sevenDaysAgo);

      const q = query(
        collection(db, 'chats', chatId, 'messages'),
        where('timestamp', '>=', sevenDaysTimestamp),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(d => d.data() as Message);

      if (messages.length === 0) {
        alert("Not enough messages this week to generate a report!");
        setAnalyzing(false);
        return;
      }

      // 2. Run Local Analysis
      const analysis = analyzeChat(messages, currentUserUid);

      // 3. Store in Supabase
      const weekStart = getWeekStart();
      const payload = {
        chat_id: chatId,
        week_start: weekStart,
        communication_score: analysis.communicationScore,
        affection_score: analysis.affectionScore,
        mood_score: analysis.moodScore,
        highlights: analysis.highlights,
        lows: analysis.lows,
        suggestions: analysis.suggestions
      };

      const { data, error } = await uxLoveReportSupabase
        .from('love_reports')
        .upsert(payload, { onConflict: 'chat_id,week_start' })
        .select()
        .single();

      if (data) setReport(data);
      else if (error) console.error("Supabase error:", error);

    } catch (err) {
      console.error("Analysis failed:", err);
      alert("Failed to generate report.");
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    report,
    loading,
    analyzing,
    generateReport
  };
};
