
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, writeBatch, getDocs, getDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { ref, onValue, set, off } from 'firebase/database';
import { db, rtdb } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { Message, UserProfile, SiteSettings } from '../../types';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { DEFAULT_EMOJIS } from '../../constants';
import GiphyModal from './GiphyModal';
import { uxExtra_formatDay, uxExtra_isSameDay } from '../../src/features/uxExtra/utils/uxExtra_formatDay';
import UxExtra_DaySeparator from '../../src/features/uxExtra/components/uxExtra_DaySeparator';
import UxExtra_LockedGalleryButton from '../../src/features/uxExtra/lockedGallery/uxExtra_LockedGalleryButton';
import UxExtra_LockedGalleryModal from '../../src/features/uxExtra/lockedGallery/uxExtra_LockedGalleryModal';
import UxExtra_LockToggle from '../../src/features/uxExtra/lockedGallery/uxExtra_LockToggle';

// --- MOOD SYNC IMPORTS ---
import { useUxExtraMood } from '../../src/features/uxExtra/mood/useUxExtraMood';
import UxExtra_MoodPicker from '../../src/features/uxExtra/mood/uxExtra_MoodPicker';
import UxExtra_MoodBubble from '../../src/features/uxExtra/mood/uxExtra_MoodBubble';

// --- NEW CALENDAR IMPORTS ---
import UxExtra_CalendarModal from '../../src/features/uxExtra/calendar/uxExtra_CalendarModal';

// --- PROFILE IMPORT ---
import UxExtra_ChatProfileModal from '../../src/features/uxExtra/profile/uxExtra_ChatProfileModal';

// --- GAME CENTER IMPORT ---
import UxGame_GameCenterModal from '../../src/features/uxGame/UxGame_GameCenterModal';

// --- PROMISE TRACKER IMPORTS ---
import UxPromise_Modal from '../../src/features/promise/uxPromise_Modal';
import { useUxPromise } from '../../src/features/promise/hooks/useUxPromise';

// --- SCREEN SHARE IMPORTS ---
import { useUxScreenShare } from '../../src/features/uxWatch/hooks/useUxScreenShare';
import UxWatch_ScreenShareModal from '../../src/features/uxWatch/ui/uxWatch_ScreenShareModal';
import UxWatch_IncomingToast from '../../src/features/uxWatch/components/uxWatch_IncomingToast';

// --- HUG FEATURE IMPORTS ---
import { useHug } from '../../src/features/hug/hooks/useHug';
import UxHug_Animation from '../../src/features/hug/uxHug_Animation';

const ChatWindow: React.FC = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const { startCall } = useCall();
  const navigate = useNavigate();
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [stickers, setStickers] = useState<string[]>([]);
  
  // Selection / Deletion State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // UI State
  const [showPicker, setShowPicker] = useState(false);
  const [showGiphy, setShowGiphy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Locked Gallery State
  const [showLockedGallery, setShowLockedGallery] = useState(false);
  const [lockedMedia, setLockedMedia] = useState<any[]>([]);
  const [pinHash, setPinHash] = useState<string>('');
  
  // --- MOOD STATE ---
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const { mood, updateMood } = useUxExtraMood(chatId, user?.uid);

  // --- CALENDAR STATE ---
  const [showCalendar, setShowCalendar] = useState(false);

  // --- PROFILE STATE ---
  const [showProfileModal, setShowProfileModal] = useState(false);

  // --- GAME CENTER STATE ---
  const [showGameCenter, setShowGameCenter] = useState(false);

  // --- PROMISE TRACKER STATE ---
  const [showPromiseModal, setShowPromiseModal] = useState(false);
  const [detectedPromiseText, setDetectedPromiseText] = useState<string | null>(null);
  const [showPromisePopup, setShowPromisePopup] = useState(false);
  const { detectPromiseKeyword } = useUxPromise(chatId || '', user?.uid || '');

  // --- SCREEN SHARE HOOK ---
  const { 
    status: ssStatus, 
    localStream: ssLocal, 
    remoteStream: ssRemote, 
    incomingOffer: ssOffer, 
    startSharing: ssStart, 
    stopSharing: ssStop, 
    acceptShare: ssAccept, 
    rejectShare: ssReject 
  } = useUxScreenShare(chatId || '', user?.uid || '');

  // --- HUG HOOK ---
  const { incomingHug, clearHug, sendHug } = useHug(chatId || '', user?.uid || '');

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<number | null>(null); // For Swipe to Reply

  const getOtherUid = () => {
      if(!chatId || !user) return null;
      const parts = chatId.split('_');
      return parts.find(id => id !== user.uid);
  };

  // Load Chat Data
  useEffect(() => {
    if (!chatId || !user) return;
    const otherUid = getOtherUid();
    if(!otherUid) return;

    // Get Other User Data
    const unsubUser = onSnapshot(
      doc(db, 'users', otherUid), 
      (docSnap) => {
        if(docSnap.exists()) setOtherUser(docSnap.data() as UserProfile);
      },
      (error) => {
        if (error.code !== 'permission-denied') {
            console.error("User sync error:", error);
        }
      }
    );

    // Mark Messages as Seen
    const markSeen = async () => {
        try {
            const q = query(collection(db, 'chats', chatId, 'messages'));
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            let count = 0;
            snapshot.docs.forEach(d => {
                const m = d.data() as Message;
                // Only mark as seen if it's not my message, not seen yet, AND not deleted by me
                if(m.senderUid !== user.uid && !m.seenAt && (!m.deletedFor || !m.deletedFor.includes(user.uid))) {
                    batch.update(doc(db, 'chats', chatId, 'messages', d.id), { seenAt: serverTimestamp() });
                    count++;
                }
            });
            if(count > 0) await batch.commit();
        } catch(err: any) {
            // Ignore permission errors
            if (err.code !== 'permission-denied') {
                console.error("Error marking seen:", err);
            }
        }
    };
    markSeen();

    // Listen for Messages
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
    const unsubMsg = onSnapshot(q, 
      (snapshot) => {
        const msgs = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as Message))
          // FILTER: Only show messages that I haven't deleted locally
          .filter(msg => !msg.deletedFor?.includes(user.uid));
        
        setMessages(msgs);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      (error) => {
          if (error.code !== 'permission-denied') {
             console.error("Msg sync error:", error);
          }
      }
    );

    // Listen for Chat Metadata (Locked Media & PIN)
    const unsubMeta = onSnapshot(
      doc(db, 'chats', chatId), 
      (docSnap) => {
        if(docSnap.exists()) {
            const data = docSnap.data();
            setLockedMedia(data.meta?.lockedMedia || []);
            setPinHash(data.meta?.lockPinHash || '');
        } else {
            setLockedMedia([]);
            setPinHash('');
        }
      },
      (error) => {
          if (error.code !== 'permission-denied') {
              console.error("Meta sync error:", error);
          }
      }
    );

    // Listen for Typing Status
    const typingRef = ref(rtdb, `typing/${chatId}/${otherUid}`);
    const unsubTyping = onValue(typingRef, (snap) => {
        setIsOtherTyping(snap.val() === true);
    }, (err: any) => {
        // Suppress permission denied errors to prevent console spam
        if (err.code !== 'PERMISSION_DENIED') {
            console.error("Typing sync error:", err);
        }
    });

    // Load Stickers
    getDoc(doc(db, "siteSettings", "config")).then(snap => {
        if(snap.exists()) {
            const data = snap.data() as SiteSettings;
            setStickers(data.stickers?.map(s => s.url) || []);
        }
    }).catch(err => {
        // Ignore errors
    });

    return () => {
        unsubUser();
        unsubMsg();
        unsubMeta();
        off(typingRef);
    };
  }, [chatId, user]);

  // --- Swipe to Reply Logic ---
  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartRef.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent, msg: Message) => {
      if (touchStartRef.current === null) return;
      const touchEnd = e.changedTouches[0].clientX;
      const diff = touchStartRef.current - touchEnd;
      
      // Swipe Right (Drag finger from left to right) to Reply
      // Diff will be negative (Start < End)
      if (diff < -50) {
          setReplyTo(msg);
      }
      touchStartRef.current = null;
  };

  // --- Deletion Logic ---

  const toggleSelectionMode = () => {
      setSelectionMode(!selectionMode);
      setSelectedIds(new Set());
      setShowMenu(false);
  };

  const toggleMessageSelection = (msgId: string) => {
      if (!selectionMode) return;
      const newSelected = new Set(selectedIds);
      if (newSelected.has(msgId)) {
          newSelected.delete(msgId);
      } else {
          newSelected.add(msgId);
      }
      setSelectedIds(newSelected);
  };

  const selectAllMessages = () => {
      const allIds = new Set(messages.map(m => m.id!));
      setSelectedIds(allIds);
  };

  const checkOwnershipOfSelected = () => {
      // Check if ALL selected messages are sent by me
      if (selectedIds.size === 0) return false;
      let allMine = true;
      selectedIds.forEach(id => {
          const msg = messages.find(m => m.id === id);
          if (msg && msg.senderUid !== user?.uid) {
              allMine = false;
          }
      });
      return allMine;
  };

  // 1. DELETE FOR EVERYONE (Hard Delete)
  const deleteForEveryone = async () => {
      if (!chatId || !user || selectedIds.size === 0) return;
      setIsDeleting(true);
      setShowDeleteModal(false);

      try {
          const promises: Promise<void>[] = [];
          selectedIds.forEach(id => {
              const ref = doc(db, 'chats', chatId, 'messages', id);
              promises.push(deleteDoc(ref));
          });
          await Promise.all(promises);
          
          setSelectionMode(false);
          setSelectedIds(new Set());
      } catch (err) {
          console.error("Error deleting for everyone:", err);
          alert("Failed to delete messages.");
      } finally {
          setIsDeleting(false);
      }
  };

  // 2. DELETE FOR ME (Soft Delete)
  const deleteForMe = async () => {
      if (!chatId || !user) return;
      setIsDeleting(true);
      setShowDeleteModal(false);
      setShowMenu(false);

      let idsToProcess = Array.from(selectedIds);
      if (idsToProcess.length === 0 && !selectionMode) {
          idsToProcess = messages.map(m => m.id!);
      }

      if (idsToProcess.length === 0) {
          setIsDeleting(false);
          return;
      }

      try {
          const batch = writeBatch(db);
          idsToProcess.forEach(id => {
              const ref = doc(db, 'chats', chatId, 'messages', id);
              batch.update(ref, { 
                  deletedFor: arrayUnion(user.uid) 
              });
          });
          await batch.commit();

          setSelectionMode(false);
          setSelectedIds(new Set());
      } catch (err) {
          console.error("Error deleting for me:", err);
          alert("Failed to delete messages.");
      } finally {
          setIsDeleting(false);
      }
  };

  const handleClearChatClick = () => {
      if(window.confirm("Clear this chat? This will remove messages for YOU only.")) {
          deleteForMe();
      }
  };

  // --- Messaging Handlers ---

  const handleSend = async (type: Message['type'] = 'text', contentParam?: string, url?: string) => {
    if (!chatId || !user) return;
    
    let content = contentParam;
    
    // Strict content validation
    if (type === 'text') {
        if (typeof content !== 'string') content = text;
        if (!content || typeof content !== 'string' || content.trim() === '') return;
        
        // --- PROMISE DETECTION ---
        if (detectPromiseKeyword(content)) {
            setDetectedPromiseText(content);
            setShowPromisePopup(true);
        }
    } else {
        content = content || type;
    }

    try {
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            senderUid: user.uid,
            type,
            content: content,
            url: url || null,
            timestamp: serverTimestamp(),
            seenAt: null,
            replyToId: replyTo?.id || null,
            replyToContent: replyTo?.content || null,
            deletedFor: [] 
        });

        setText('');
        setReplyTo(null);
        setShowPicker(false);
        // Suppress error if permission denied (e.g. rules not yet propagated)
        set(ref(rtdb, `typing/${chatId}/${user.uid}`), false).catch(() => {});
    } catch(err) {
        console.error("Error sending message:", err);
        // Optionally alert based on error type
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (!user || !chatId) return;

    // Suppress errors for typing indicators
    set(ref(rtdb, `typing/${chatId}/${user.uid}`), true).catch(() => {});
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
        set(ref(rtdb, `typing/${chatId}/${user.uid}`), false).catch(() => {});
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files?.[0]) {
          const file = e.target.files[0];
          try {
              const url = await uploadToCloudinary(file, file.type.startsWith('video') ? 'video' : 'image');
              handleSend(file.type.startsWith('video') ? 'video' : 'image', file.name, url);
          } catch(err) {
              alert('Upload failed');
          }
      }
  };

  const toggleRecording = async () => {
    if (isRecording) {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = await uploadToCloudinary(audioBlob, 'raw');
                handleSend('audio', 'Voice Message', url);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (e) {
            alert('Mic permission denied');
        }
    }
  };

  const initiateCall = (type: 'audio' | 'video') => {
      if (otherUser) {
          startCall(otherUser.uid, otherUser.displayName, otherUser.photoURL, type);
      }
  };

  if (!otherUser) return <div className="flex-1 flex items-center justify-center">Loading...</div>;

  const isAllMine = checkOwnershipOfSelected();

  return (
    <div className="flex-1 flex flex-col h-full relative" onClick={() => setShowMenu(false)}>
      
      {/* --- HUG ANIMATION OVERLAY --- */}
      <UxHug_Animation 
        hug={incomingHug} 
        onDismiss={clearHug} 
        onHugBack={sendHug}
      />

      {/* --- SCREEN SHARE UI --- */}
      <UxWatch_IncomingToast 
        hostName={otherUser?.displayName} 
        visible={!!ssOffer} 
        type="screen-share"
        onJoin={ssAccept} 
        onDismiss={ssReject} 
      />
      <UxWatch_ScreenShareModal 
        status={ssStatus} 
        localStream={ssLocal} 
        remoteStream={ssRemote} 
        onStop={ssStop} 
      />

      {/* --- MOOD BACKGROUND GLOW --- */}
      {mood && (
        <div className={`absolute inset-0 pointer-events-none z-0 bg-${mood.color} opacity-5 dark:opacity-10 mix-blend-multiply dark:mix-blend-screen transition-colors duration-1000`}></div>
      )}

      {/* Header */}
      <div className={`h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shadow-sm shrink-0 z-30 transition-colors ${selectionMode ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}`}>
        
        {/* Left Side Header */}
        <div className="flex items-center gap-3">
          {selectionMode ? (
              <div className="flex items-center gap-2">
                  <button onClick={toggleSelectionMode} className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                      <i className="fas fa-times text-lg"></i>
                  </button>
                  <span className="font-bold text-lg text-gray-800 dark:text-white">{selectedIds.size} Selected</span>
                  <button onClick={selectAllMessages} className="text-xs text-blue-500 font-bold hover:underline ml-2">Select All</button>
              </div>
          ) : (
              <>
                  <button onClick={() => navigate('/chat')} className="md:hidden text-gray-600 dark:text-gray-300">
                    <i className="fas fa-arrow-left text-xl"></i>
                  </button>
                  {/* --- CLICKABLE PROFILE AREA (Calendar Access Here) --- */}
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition pr-3"
                    onClick={() => setShowProfileModal(true)}
                  >
                    <div className="relative">
                        <img src={otherUser.photoURL} className="w-10 h-10 rounded-full object-cover" alt={otherUser.displayName} />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white mr-2">{otherUser.displayName}</h3>
                            {/* --- MOOD BUBBLE --- */}
                            <UxExtra_MoodBubble mood={mood} currentUserUid={user?.uid} />
                        </div>
                        
                        {isOtherTyping ? (
                            <p className="text-xs text-blue-500 font-semibold italic">typing...</p>
                        ) : (
                            <p className={`text-xs ${otherUser.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
                                {otherUser.isOnline ? 'Online' : 'Offline'}
                            </p>
                        )}
                    </div>
                  </div>
              </>
          )}
        </div>

        {/* Right Side Header (Actions) */}
        <div className="flex items-center gap-2">
            {selectionMode ? (
                <button 
                    onClick={() => setShowDeleteModal(true)} 
                    disabled={selectedIds.size === 0 || isDeleting}
                    className={`p-2 rounded-full transition ${selectedIds.size > 0 ? 'text-red-500 hover:bg-red-100' : 'text-gray-300'}`}
                    title="Delete Options"
                >
                    <i className="fas fa-trash-alt text-xl"></i>
                </button>
            ) : (
                <>
                    {/* --- MOOD PICKER TRIGGER --- */}
                    <button 
                        onClick={() => setShowMoodPicker(true)} 
                        className="p-2 text-pink-500 hover:bg-pink-50 dark:hover:bg-gray-700 rounded-full transition"
                        title="Set Mood"
                    >
                        <i className="far fa-smile-wink"></i>
                    </button>

                    {/* --- GAME CENTER TRIGGER --- */}
                    <button 
                        onClick={() => setShowGameCenter(true)} 
                        className="p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-full transition"
                        title="Play Games"
                    >
                        <i className="fas fa-gamepad"></i>
                    </button>

                    <button onClick={() => initiateCall('audio')} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition">
                        <i className="fas fa-phone"></i>
                    </button>
                    <button onClick={() => initiateCall('video')} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition">
                        <i className="fas fa-video"></i>
                    </button>
                    
                    {/* More Options Menu */}
                    <div className="relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} 
                            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                        >
                            <i className="fas fa-ellipsis-v"></i>
                        </button>
                        
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 py-1 z-50 overflow-hidden">
                                
                                <button 
                                    onClick={() => { setShowPromiseModal(true); setShowMenu(false); }} 
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <i className="fas fa-hand-holding-heart text-yellow-600 dark:text-yellow-400"></i> Promise Tracker
                                </button>

                                <button 
                                    onClick={() => { setShowLockedGallery(true); setShowMenu(false); }} 
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <i className="fas fa-lock text-yellow-500"></i> Locked Gallery
                                </button>
                                
                                <div className="border-t dark:border-gray-700 my-1"></div>

                                <button 
                                    onClick={toggleSelectionMode} 
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <i className="fas fa-check-circle text-blue-500"></i> Select Messages
                                </button>
                                <div className="border-t dark:border-gray-700 my-1"></div>
                                <button 
                                    onClick={handleClearChatClick} 
                                    disabled={isDeleting}
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                    {isDeleting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
                                    Clear Chat (For Me)
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Delete Options Modal */}
      {showDeleteModal && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Delete {selectedIds.size} Message(s)?</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                      Choose how you want to delete these messages.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                      {isAllMine && (
                          <button 
                              onClick={deleteForEveryone}
                              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                          >
                              <i className="fas fa-globe"></i> Delete for Everyone
                          </button>
                      )}
                      
                      <button 
                          onClick={deleteForMe}
                          className="w-full py-3 bg-blue-100 hover:bg-blue-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-blue-700 dark:text-blue-300 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                          <i className="fas fa-user"></i> Delete for Me
                      </button>

                      <button 
                          onClick={() => setShowDeleteModal(false)}
                          className="w-full py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 mt-2"
                      >
                          Cancel
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-transparent z-10 scrollbar-thin min-w-0">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                <i className="fas fa-paper-plane text-4xl mb-2"></i>
                <p>No messages yet. Say hi!</p>
            </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderUid === user?.uid;
          const isSelected = selectedIds.has(msg.id!);
          
          // Day Separator Logic
          const currentDate = msg.timestamp; 
          const prevDate = i > 0 ? messages[i-1].timestamp : null;
          const showSeparator = !prevDate || !uxExtra_isSameDay(currentDate, prevDate);
          const dateLabel = showSeparator ? uxExtra_formatDay(currentDate) : '';

          return (
            <React.Fragment key={msg.id || i}>
            {showSeparator && <UxExtra_DaySeparator date={dateLabel} />}
            <div 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2 group relative ${selectionMode ? 'cursor-pointer' : ''}`}
                onClick={() => toggleMessageSelection(msg.id!)}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, msg)}
            >
              {/* Checkbox for selection mode */}
              {selectionMode && !isMe && (
                   <div className={`mr-2 flex items-center justify-center w-6 h-6 rounded-full border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                       {isSelected && <i className="fas fa-check text-white text-xs"></i>}
                   </div>
              )}

              {/* Reply Button (Left side for 'Me' messages) */}
              {!selectionMode && isMe && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setReplyTo(msg); }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-500 transition self-center mr-1"
                    title="Reply"
                  >
                    <i className="fas fa-reply"></i>
                  </button>
              )}

              <div className={`max-w-[85%] lg:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSelected ? 'opacity-80' : ''}`}>
                {msg.replyToId && (
                    <div className={`text-xs mb-1 px-2 py-1 rounded opacity-70 ${isMe ? 'bg-blue-700 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white'}`}>
                        Replying to: {msg.replyToContent?.slice(0, 30)}...
                    </div>
                )}
                <div 
                    className={`relative px-4 py-2 rounded-2xl shadow-sm break-words w-fit transition-all duration-200
                        ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                        ${isMe 
                        ? 'bg-blue-500 text-white rounded-br-none' 
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'
                    }`}
                    onDoubleClick={() => !selectionMode && setReplyTo(msg)}
                >
                  {msg.type === 'text' && <p className="whitespace-pre-wrap">{msg.content}</p>}
                  
                  {/* Media Locking Overlays */}
                  {(msg.type === 'image' || msg.type === 'video') && (
                      <UxExtra_LockToggle 
                        chatId={chatId || ''}
                        messageId={msg.id || ''}
                        url={msg.url || ''}
                        type={msg.type}
                        currentUserUid={user!.uid}
                        isOwner={isMe}
                        lockedMedia={lockedMedia}
                      />
                  )}

                  {msg.type === 'image' && (
                      <img src={msg.url!} alt="Shared" className="max-w-full rounded-lg cursor-pointer hover:opacity-90" onClick={() => !selectionMode && window.open(msg.url!, '_blank')} />
                  )}
                  {msg.type === 'video' && (
                      <video src={msg.url!} controls={!selectionMode} className="max-w-full rounded-lg" />
                  )}
                  {msg.type === 'audio' && (
                      <audio src={msg.url!} controls={!selectionMode} className="max-w-[200px]" />
                  )}
                  {msg.type === 'sticker' && (
                      <img src={msg.url!} alt="Sticker" className="w-24 h-24 object-contain" />
                  )}
                  {msg.type === 'gif' && (
                      <img src={msg.url!} alt="GIF" className="w-48 rounded-lg" />
                  )}
                  
                  <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 opacity-70 ${isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-300'}`}>
                    {msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                    {isMe && (
                        <span>
                            {msg.seenAt ? <i className="fas fa-check-double text-green-300"></i> : <i className="fas fa-check"></i>}
                        </span>
                    )}
                  </div>
                </div>
              </div>

               {/* Reply Button (Right side for 'Other' messages) */}
               {!selectionMode && !isMe && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setReplyTo(msg); }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-500 transition self-center ml-1"
                    title="Reply"
                  >
                    <i className="fas fa-reply"></i>
                  </button>
               )}

               {/* Checkbox for selection mode (Right side for me) */}
               {selectionMode && isMe && (
                   <div className={`ml-2 flex items-center justify-center w-6 h-6 rounded-full border-2 mt-auto mb-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                       {isSelected && <i className="fas fa-check text-white text-xs"></i>}
                   </div>
              )}
            </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Bar */}
      {replyTo && !selectionMode && (
          <div className="bg-gray-100 dark:bg-gray-800 p-2 flex justify-between items-center border-t dark:border-gray-700 z-10">
              <div className="text-sm text-gray-600 dark:text-gray-300 pl-2 border-l-4 border-blue-500">
                  <span className="font-bold text-blue-500">Replying to: </span>
                  {replyTo.content.slice(0, 50)}...
              </div>
              <button onClick={() => setReplyTo(null)} className="text-red-500 hover:bg-gray-200 rounded-full p-1">
                  <i className="fas fa-times"></i>
              </button>
          </div>
      )}

      {/* Input Area (Hidden in Selection Mode) */}
      {!selectionMode && (
          <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0 z-20">
            {/* Picker Area */}
            {showPicker && (
                <div className="mb-2 h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-lg p-2 grid grid-cols-8 gap-2 border dark:border-gray-600">
                    {DEFAULT_EMOJIS.map(e => (
                        <button key={e} onClick={() => setText(prev => prev + e)} className="text-2xl hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-1">{e}</button>
                    ))}
                    {stickers.map((url, i) => (
                        <img key={i} src={url} onClick={() => handleSend('sticker', 'Sticker', url)} className="w-10 h-10 object-contain cursor-pointer hover:scale-110 transition" />
                    ))}
                </div>
            )}

            <div className="flex items-center gap-2">
            <button onClick={() => setShowPicker(!showPicker)} className="text-yellow-500 hover:bg-yellow-50 p-2 rounded-full transition"><i className="far fa-smile text-xl"></i></button>
            <button onClick={() => setShowGiphy(true)} className="text-pink-500 hover:bg-pink-50 p-2 rounded-full transition font-bold text-xs border border-pink-200">GIF</button>
            
            <div className="flex-1 relative">
                <input 
                    type="text" 
                    value={text}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="w-full pl-4 pr-10 py-2 rounded-full bg-gray-100 dark:bg-gray-700 dark:text-white border-none focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 p-1"
                >
                    <i className="fas fa-paperclip"></i>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
            </div>

            {text ? (
                <button onClick={() => handleSend()} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center shadow-md transition">
                    <i className="fas fa-paper-plane text-sm"></i>
                </button>
            ) : (
                <button onClick={toggleRecording} className={`${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'} hover:opacity-80 p-2 rounded-full w-10 h-10 flex items-center justify-center transition`}>
                    <i className={`fas ${isRecording ? 'fa-stop text-white' : 'fa-microphone'}`}></i>
                </button>
            )}
            </div>
        </div>
      )}

      {/* Giphy Modal */}
      {showGiphy && (
          <GiphyModal 
             onSelect={(url) => { handleSend('gif', 'GIF', url); setShowGiphy(false); }} 
             onClose={() => setShowGiphy(false)} 
          />
      )}

      {/* Locked Gallery Modal */}
      {showLockedGallery && user && (
          <UxExtra_LockedGalleryModal 
            isOpen={showLockedGallery}
            onClose={() => setShowLockedGallery(false)}
            chatId={chatId || ''}
            currentUser={user}
            lockedMedia={lockedMedia}
            pinHash={pinHash}
          />
      )}

      {/* --- MOOD PICKER MODAL --- */}
      <UxExtra_MoodPicker 
        isOpen={showMoodPicker}
        onClose={() => setShowMoodPicker(false)}
        onSelect={updateMood}
      />

      {/* --- CALENDAR MODAL --- */}
      <UxExtra_CalendarModal 
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        chatId={chatId || ''}
        currentUserUid={user!.uid}
      />

      {/* --- PROFILE MODAL --- */}
      <UxExtra_ChatProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={otherUser}
        onOpenCalendar={() => setShowCalendar(true)}
        onOpenLockedGallery={() => setShowLockedGallery(true)}
      />

      {/* --- GAME CENTER MODAL --- */}
      <UxGame_GameCenterModal
        isOpen={showGameCenter}
        onClose={() => setShowGameCenter(false)}
        chatId={chatId || ''}
        currentUserUid={user!.uid}
        onStartScreenShare={ssStart} // Pass screen share trigger
      />

      {/* --- PROMISE TRACKER MODAL --- */}
      <UxPromise_Modal 
        isOpen={showPromiseModal}
        onClose={() => {
            setShowPromiseModal(false);
            setDetectedPromiseText(null);
        }}
        chatId={chatId || ''}
        currentUserUid={user!.uid}
        initialAddText={detectedPromiseText || undefined}
      />

      {/* --- PROMISE DETECTED POPUP --- */}
      {showPromisePopup && detectedPromiseText && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-yellow-50 dark:bg-gray-800 border border-yellow-400 p-4 rounded-xl shadow-2xl z-[80] animate-bounce-in max-w-sm w-full">
              <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-full shrink-0">
                      <span className="text-xl">🤞</span>
                  </div>
                  <div>
                      <h4 className="font-bold text-gray-800 dark:text-white text-sm">Promise Detected!</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 mb-3">"{detectedPromiseText}"</p>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => {
                                setShowPromisePopup(false);
                                setShowPromiseModal(true);
                            }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                          >
                              Add to Tracker
                          </button>
                          <button 
                            onClick={() => {
                                setShowPromisePopup(false);
                                setDetectedPromiseText(null);
                            }}
                            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-3 py-1.5 rounded-lg"
                          >
                              Ignore
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatWindow;
