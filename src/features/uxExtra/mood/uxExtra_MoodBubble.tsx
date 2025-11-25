import React from 'react';
import { UxExtra_Mood } from './useUxExtraMood';

interface Props {
  mood: UxExtra_Mood | null;
  currentUserUid: string | undefined;
}

const UxExtra_MoodBubble: React.FC<Props> = ({ mood, currentUserUid }) => {
  if (!mood) return null;

  const isMe = mood.updatedBy === currentUserUid;

  return (
    <div className="flex flex-col ml-2 animate-pulse">
      <div className="relative">
        <span className="text-2xl drop-shadow-md filter">{mood.emoji}</span>
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 bg-${mood.color}`}></div>
      </div>
    </div>
  );
};

export default UxExtra_MoodBubble;
