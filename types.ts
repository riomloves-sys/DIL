import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isAdmin: boolean;
  isOnline?: boolean;
  lastSeen?: Timestamp | any;
  peerId?: string;
  canDeleteVaultMedia?: boolean; // Permission to delete media from Vault
}

export interface Message {
  id?: string;
  senderUid: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'sticker' | 'gif';
  url?: string;
  timestamp: Timestamp;
  seenAt?: Timestamp;
  replyToId?: string;
  replyToContent?: string;
  deletedFor?: string[]; // Array of UIDs who deleted this message locally
}

export interface Sticker {
  url: string;
  addedAt: any;
}

export interface SiteSettings {
  registrationsEnabled: boolean;
  stickers: Sticker[];
}

export interface ChatSession {
  chatId: string;
  participants: string[]; // UIDs
  lastMessage?: string;
  lastMessageTime?: Timestamp;
}