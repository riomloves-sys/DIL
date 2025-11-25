
import { Message } from '../../../../types';

// Simple dictionary-based sentiment analysis
const POSITIVE_WORDS = new Set([
  'love', 'happy', 'great', 'good', 'amazing', 'baby', 'honey', 'sweet', 'care', 
  'beautiful', 'cute', 'miss', 'adore', 'best', 'thanks', 'thank', 'fun', 'joy', 
  'smile', 'laugh', 'forever', 'soulmate', 'darling', 'dear', 'exciting', 'proud'
]);

const NEGATIVE_WORDS = new Set([
  'sad', 'angry', 'hate', 'bad', 'hurt', 'stop', 'annoy', 'upset', 'mad', 
  'cry', 'leave', 'fight', 'worst', 'tired', 'bored', 'stupid', 'shut', 'rude'
]);

const LOVE_EMOJIS = ['❤️', '😍', '🥰', '😘', '💕', '💗', '💖', '💓', '💞', '💘', '💝', '💟', '💍', '👰', '🤵', '💏', '💑'];

interface AnalysisResult {
  communicationScore: number;
  affectionScore: number;
  moodScore: number;
  highlights: string[];
  lows: string[];
  suggestions: string[];
}

export const analyzeChat = (messages: Message[], currentUid: string): AnalysisResult => {
  let totalWords = 0;
  let affectionCount = 0;
  let sentimentScore = 0;
  let messageCount = messages.length;

  const scoredMessages: { msg: string, score: number }[] = [];

  messages.forEach(msg => {
    if (msg.type !== 'text') return;
    
    const text = (msg.content || '').toLowerCase();
    const words = text.split(/\s+/);
    totalWords += words.length;

    let localScore = 0;

    // Check Words
    words.forEach(w => {
      // Remove punctuation
      const cleanW = w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
      if (POSITIVE_WORDS.has(cleanW)) {
        localScore += 2;
        sentimentScore += 1;
      }
      if (NEGATIVE_WORDS.has(cleanW)) {
        localScore -= 2;
        sentimentScore -= 2; // Negatives weigh more
      }
    });

    // Check Emojis
    LOVE_EMOJIS.forEach(emoji => {
      if (text.includes(emoji)) {
        affectionCount += 3; // Emojis count towards affection
        localScore += 3;
        sentimentScore += 1;
      }
    });

    // Affection Keywords
    if (text.includes('love you') || text.includes('miss you')) {
      affectionCount += 5;
      localScore += 5;
    }

    scoredMessages.push({ msg: msg.content, score: localScore });
  });

  // 1. Communication Score (Volume & Frequency)
  // Arbitrary baseline: 50 messages/week = 50/100. 1000 words/week = good.
  const volScore = Math.min(100, (messageCount * 2) + (totalWords / 20));
  const communicationScore = Math.floor(volScore);

  // 2. Affection Score (Romantic keywords density)
  // Base 100 if affection ratio is high
  const affectionRatio = totalWords > 0 ? (affectionCount / totalWords) * 100 : 0;
  const affectionScore = Math.min(100, Math.floor(affectionRatio * 10) + (affectionCount * 2));

  // 3. Mood Score (Sentiment)
  // Base 50 + sentiment
  const moodScore = Math.min(100, Math.max(0, 50 + (sentimentScore * 2)));

  // 4. Highlights (Top 3 Sweetest)
  const highlights = scoredMessages
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(m => m.score > 0)
    .map(m => m.msg);

  // 5. Lows (Generic categorization, don't show exact messages to avoid re-triggering)
  // Only used to generate suggestions
  const negativeCount = scoredMessages.filter(m => m.score < -2).length;

  // 6. Suggestions
  const suggestions: string[] = [];
  if (communicationScore < 40) suggestions.push("Try to check in with each other more often during the day.");
  if (affectionScore < 30) suggestions.push("A simple 'I love you' or a heart emoji goes a long way!");
  if (moodScore < 40) suggestions.push("It seems like a stressful week. Consider a relaxing date night or a movie.");
  if (negativeCount > 5) suggestions.push("Communication is key. Try to express feelings calmly when upset.");
  if (suggestions.length === 0) suggestions.push("You guys are doing amazing! Keep the love flowing! ❤️");

  return {
    communicationScore,
    affectionScore,
    moodScore,
    highlights,
    lows: [], // We won't store specific negative messages for privacy/vibes
    suggestions: suggestions.slice(0, 3)
  };
};
