import { Timestamp } from 'firebase/firestore';

export const uxExtra_formatDay = (timestamp: Timestamp | any): string => {
  if (!timestamp) return '';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  
  // Normalize to midnight for accurate comparison
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(n);
  yesterday.setDate(n.getDate() - 1);

  if (d.getTime() === n.getTime()) {
    return 'Today';
  }
  if (d.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  
  // Format: 12 Oct 2023
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const uxExtra_isSameDay = (ts1: Timestamp | any, ts2: Timestamp | any): boolean => {
  if (!ts1 || !ts2) return false;
  const d1 = ts1.toDate ? ts1.toDate() : new Date(ts1);
  const d2 = ts2.toDate ? ts2.toDate() : new Date(ts2);

  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};