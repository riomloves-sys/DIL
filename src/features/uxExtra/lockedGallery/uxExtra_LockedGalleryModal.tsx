
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { UserProfile } from '../../../../types';
import { uxExtra_hashPin } from '../utils/uxExtra_hashPin';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentUser: UserProfile;
  lockedMedia: any[];
  pinHash: string;
}

interface LockedItem {
  messageId: string;
  url: string;
  type: 'image' | 'video';
  ts: number;
}

const SESSION_DURATION = 30 * 1000; // 30 seconds

const UxExtra_LockedGalleryModal: React.FC<Props> = ({ isOpen, onClose, chatId, currentUser, lockedMedia, pinHash }) => {
  const [step, setStep] = useState<'loading' | 'setup' | 'locked' | 'gallery' | 'admin-reset' | 'change-pin'>('loading');
  
  // Inputs
  const [pinInput, setPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [oldPinInput, setOldPinInput] = useState('');
  
  const [error, setError] = useState('');
  
  // Bulk Delete State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // STRICT ADMIN CHECK: Only Admins can delete from vault
  const canDelete = currentUser.isAdmin;

  // Clean up state when opening/closing
  const resetInputs = () => {
    setPinInput('');
    setNewPinInput('');
    setConfirmPin('');
    setOldPinInput('');
    setError('');
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  useEffect(() => {
    if (!isOpen) {
      resetInputs();
      return;
    }

    const checkLockStatus = async () => {
      // 1. Check Local Session Timer
      const sessionExpiryStr = localStorage.getItem(`uxExtra_vault_expiry_${chatId}`);
      const isSessionValid = sessionExpiryStr && parseInt(sessionExpiryStr) > Date.now();
      
      if (!pinHash) {
        setStep('setup');
      } else if (isSessionValid) {
        extendSession();
        setStep('gallery');
      } else {
        setStep('locked');
      }
    };

    checkLockStatus();
  }, [isOpen, chatId, pinHash]);

  const extendSession = () => {
    const expiry = Date.now() + SESSION_DURATION;
    localStorage.setItem(`uxExtra_vault_expiry_${chatId}`, expiry.toString());
  };

  // --- ACTIONS ---

  const handleSetup = async () => {
    if (pinInput.length < 4) return setError('PIN must be at least 4 digits');
    if (pinInput !== confirmPin) return setError('PINs do not match');

    const hash = await uxExtra_hashPin(pinInput);
    
    try {
      await setDoc(doc(db, 'chats', chatId), {
        meta: {
          lockPinHash: hash,
          lockedMedia: lockedMedia // Keep existing items from props
        }
      }, { merge: true });
      
      extendSession();
      setStep('gallery');
    } catch (e) {
      setError('Failed to save PIN. Try again.');
    }
  };

  const handleUnlock = async () => {
    const inputHash = await uxExtra_hashPin(pinInput);

    if (inputHash === pinHash) {
      extendSession();
      setStep('gallery');
    } else {
      setError('Incorrect PIN');
      setPinInput('');
    }
  };

  // ADMIN OVERRIDE: Set new PIN directly
  const handleAdminForceReset = async () => {
    if (newPinInput.length < 4) return setError('PIN must be at least 4 digits');
    if (newPinInput !== confirmPin) return setError('PINs do not match');

    const hash = await uxExtra_hashPin(newPinInput);

    try {
      await updateDoc(doc(db, 'chats', chatId), {
        "meta.lockPinHash": hash
      });
      alert("PIN successfully reset by Admin.");
      resetInputs();
      setStep('locked'); 
    } catch (err) {
      console.error(err);
      setError("Failed to update PIN");
    }
  };

  // USER CHANGE PIN: Old -> New
  const handleChangePin = async () => {
    if (newPinInput.length < 4) return setError('New PIN must be at least 4 digits');
    if (newPinInput !== confirmPin) return setError('New PINs do not match');

    // Verify Old PIN
    const oldHash = await uxExtra_hashPin(oldPinInput);

    if (oldHash !== pinHash) {
      return setError("Old PIN is incorrect");
    }

    // Set New PIN
    const newHash = await uxExtra_hashPin(newPinInput);
    
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        "meta.lockPinHash": newHash
      });
      alert("PIN changed successfully.");
      resetInputs();
      extendSession();
      setStep('gallery');
    } catch (err) {
      setError("Failed to change PIN");
    }
  };

  // DELETE MEDIA ITEM (Restricted to Admin)
  const handleDeleteMedia = async (itemToDelete: LockedItem) => {
    if (!canDelete) return;
    if (!window.confirm("Delete this from the Vault permanently?")) return;

    try {
        const docRef = doc(db, 'chats', chatId);
        
        // Filter out the item to delete based on messageId (unique)
        const updatedList = lockedMedia.filter((item: any) => item.messageId !== itemToDelete.messageId);
        
        // Use setDoc with merge: true
        await setDoc(docRef, {
            meta: {
                lockedMedia: updatedList
            }
        }, { merge: true });

        // No need to update local state manually, ChatWindow listener will update props
        extendSession();
    } catch(err) {
        console.error("Error deleting vault media:", err);
        alert("Failed to delete media.");
    }
  };

  // BULK DELETE
  const toggleSelection = (msgId: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(msgId)) newSet.delete(msgId);
    else newSet.add(msgId);
    setSelectedItems(newSet);
  };

  const handleBulkDelete = async () => {
    if (!canDelete || selectedItems.size === 0) return;
    if (!window.confirm(`Permanently delete ${selectedItems.size} items from the Vault?`)) return;

    try {
        const docRef = doc(db, 'chats', chatId);
        
        // Filter out ALL selected items
        const updatedList = lockedMedia.filter((item: any) => !selectedItems.has(item.messageId));
        
        await setDoc(docRef, {
            meta: {
                lockedMedia: updatedList
            }
        }, { merge: true });

        extendSession();
        setSelectionMode(false);
        setSelectedItems(new Set());
    } catch(err) {
        console.error("Error bulk deleting:", err);
        alert("Failed to delete items.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 shrink-0">
          <div className="flex items-center gap-2">
            <i className="fas fa-shield-alt text-green-600"></i>
            <h3 className="font-bold text-gray-800 dark:text-white">Secure Vault</h3>
          </div>
          <div className="flex items-center gap-3">
             {step === 'gallery' && !selectionMode && (
                 <button onClick={() => { resetInputs(); setStep('change-pin'); }} className="text-xs text-blue-500 hover:underline font-semibold">
                     Change PIN
                 </button>
             )}
             <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-white transition">
                <i className="fas fa-times text-xl"></i>
             </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-800">
          
          {step === 'loading' && (
            <div className="flex justify-center items-center h-full">
               <i className="fas fa-circle-notch fa-spin text-3xl text-blue-500"></i>
            </div>
          )}

          {/* 1. SETUP NEW VAULT */}
          {step === 'setup' && (
            <div className="flex flex-col items-center justify-center h-full max-w-xs mx-auto text-center space-y-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                 <i className="fas fa-key text-yellow-600 text-2xl"></i>
              </div>
              <h4 className="text-xl font-bold dark:text-white">Set Vault PIN</h4>
              <p className="text-sm text-gray-500 mb-4">Create a PIN to secure media.</p>
              
              <input 
                type="password" 
                placeholder="Enter PIN" 
                className="w-full p-3 text-center text-lg tracking-widest border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                maxLength={6}
              />
              <input 
                type="password" 
                placeholder="Confirm PIN" 
                className="w-full p-3 text-center text-lg tracking-widest border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value)}
                maxLength={6}
              />
              
              {error && <p className="text-red-500 text-sm">{error}</p>}
              
              <button onClick={handleSetup} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold transition shadow-lg">
                Create Vault
              </button>
            </div>
          )}

          {/* 2. LOCKED SCREEN */}
          {step === 'locked' && (
            <div className="flex flex-col items-center justify-center h-full max-w-xs mx-auto text-center space-y-4">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                 <i className="fas fa-lock text-green-600 text-2xl"></i>
              </div>
              <h4 className="text-xl font-bold dark:text-white">Vault Locked</h4>
              <p className="text-sm text-gray-500 mb-4">Enter PIN to access secured media.</p>
              
              <input 
                type="password" 
                placeholder="Enter PIN" 
                className="w-full p-3 text-center text-lg tracking-widest border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                maxLength={6}
                autoFocus
              />
              
              {error && <p className="text-red-500 text-sm">{error}</p>}
              
              <button onClick={handleUnlock} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition shadow-lg">
                Unlock Vault
              </button>

              {/* ADMIN FORCE RESET ENTRY */}
              {currentUser.isAdmin && (
                <div className="mt-8 pt-4 border-t border-gray-300 dark:border-gray-600 w-full">
                    <button 
                        onClick={() => { resetInputs(); setStep('admin-reset'); }} 
                        className="w-full py-2 px-4 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                        <i className="fas fa-user-shield"></i> Admin: Force Reset PIN
                    </button>
                </div>
              )}
            </div>
          )}

          {/* 3. ADMIN FORCE RESET SCREEN */}
          {step === 'admin-reset' && (
            <div className="flex flex-col items-center justify-center h-full max-w-xs mx-auto text-center space-y-4">
              <h4 className="text-xl font-bold text-red-500"><i className="fas fa-exclamation-triangle mr-2"></i>Admin Override</h4>
              <p className="text-sm text-gray-500 mb-4">Set a new PIN directly. The old PIN is not required.</p>
              
              <input 
                type="password" 
                placeholder="New PIN" 
                className="w-full p-3 text-center text-lg tracking-widest border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={newPinInput}
                onChange={e => setNewPinInput(e.target.value)}
                maxLength={6}
              />
              <input 
                type="password" 
                placeholder="Confirm New PIN" 
                className="w-full p-3 text-center text-lg tracking-widest border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value)}
                maxLength={6}
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}
              
              <div className="flex gap-2 w-full">
                  <button onClick={() => { resetInputs(); setStep('locked'); }} className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold">
                    Cancel
                  </button>
                  <button onClick={handleAdminForceReset} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold">
                    Set PIN
                  </button>
              </div>
            </div>
          )}

          {/* 4. USER CHANGE PIN SCREEN */}
          {step === 'change-pin' && (
             <div className="flex flex-col items-center justify-center h-full max-w-xs mx-auto text-center space-y-3">
              <h4 className="text-xl font-bold dark:text-white">Change PIN</h4>
              
              <div className="w-full text-left">
                  <label className="text-xs text-gray-500 ml-1">Old PIN</label>
                  <input 
                    type="password" 
                    className="w-full p-2 text-center text-lg tracking-widest border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 mb-2"
                    value={oldPinInput}
                    onChange={e => setOldPinInput(e.target.value)}
                    maxLength={6}
                  />
              </div>

              <div className="w-full text-left">
                  <label className="text-xs text-gray-500 ml-1">New PIN</label>
                  <input 
                    type="password" 
                    className="w-full p-2 text-center text-lg tracking-widest border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 mb-2"
                    value={newPinInput}
                    onChange={e => setNewPinInput(e.target.value)}
                    maxLength={6}
                  />
              </div>

              <div className="w-full text-left">
                  <label className="text-xs text-gray-500 ml-1">Confirm New PIN</label>
                  <input 
                    type="password" 
                    className="w-full p-2 text-center text-lg tracking-widest border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value)}
                    maxLength={6}
                  />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              
              <div className="flex gap-2 w-full mt-4">
                  <button onClick={() => { resetInputs(); setStep('gallery'); }} className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold">
                    Cancel
                  </button>
                  <button onClick={handleChangePin} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold">
                    Update
                  </button>
              </div>
            </div>
          )}

          {/* 5. GALLERY VIEW */}
          {step === 'gallery' && (
            <div className="h-full">
              
              {/* ADMIN CONTROLS (Bulk Selection) */}
              {canDelete && lockedMedia.length > 0 && (
                  <div className="flex justify-between items-center mb-4 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                      <button 
                        onClick={() => { setSelectionMode(!selectionMode); setSelectedItems(new Set()); }}
                        className={`text-xs font-bold px-3 py-1 rounded transition ${selectionMode ? 'bg-gray-300 dark:bg-gray-600' : 'text-blue-500 hover:bg-blue-50'}`}
                      >
                          {selectionMode ? 'Cancel Selection' : 'Select Multiple'}
                      </button>
                      
                      {selectionMode && selectedItems.size > 0 && (
                          <button 
                             onClick={handleBulkDelete}
                             className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow transition"
                          >
                              Delete ({selectedItems.size})
                          </button>
                      )}
                  </div>
              )}

              {lockedMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <i className="fas fa-shield-alt text-4xl mb-3 opacity-50"></i>
                  <p>Vault is empty.</p>
                  <p className="text-xs mt-1">Tap the lock/shield icon on images in chat to secure them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-12">
                  {lockedMedia.map((item: any, idx: number) => {
                    const isSelected = selectedItems.has(item.messageId);
                    return (
                        <div 
                            key={idx} 
                            className={`relative group rounded-lg overflow-hidden shadow-md bg-black ${selectionMode ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                                if(selectionMode) toggleSelection(item.messageId);
                            }}
                        >
                        {item.type === 'image' && (
                            <img src={item.url} alt="Locked content" className="w-full h-40 object-cover" />
                        )}
                        {item.type === 'video' && (
                            <video src={item.url} className="w-full h-40 object-cover" />
                        )}
                        
                        {/* SELECTION OVERLAY */}
                        {selectionMode ? (
                            <div className="absolute inset-0 bg-black/30 flex items-start justify-end p-2">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-white'}`}>
                                    {isSelected && <i className="fas fa-check text-white text-xs"></i>}
                                </div>
                            </div>
                        ) : (
                            /* VIEW ACTION OVERLAY (Non-Selection Mode) */
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-2">
                                <a href={item.url} target="_blank" rel="noreferrer" className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                View
                                </a>
                                
                                {/* Individual Delete Action (Admin Only) */}
                                {canDelete && (
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            handleDeleteMedia(item); 
                                        }} 
                                        className="text-white bg-red-600 hover:bg-red-700 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition"
                                        title="Delete from Vault"
                                    >
                                        <i className="fas fa-trash-alt text-xs"></i>
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] text-white/80">
                            {new Date(item.ts).toLocaleDateString()}
                        </div>
                        </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default UxExtra_LockedGalleryModal;
