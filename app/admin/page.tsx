
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { collection, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile, SiteSettings } from '../../types';

const AdminPage = () => {
    const { user, loading } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [settings, setSettings] = useState<SiteSettings>({ registrationsEnabled: true, stickers: [] });
    const [newSticker, setNewSticker] = useState('');
    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        if(!user?.isAdmin) return;
        
        // Load Users (Realtime to see permission changes)
        const unsubUsers = onSnapshot(collection(db, 'users'), 
            (snap) => {
                setUsers(snap.docs.map(d => d.data() as UserProfile));
            },
            (error) => {
                if (error.code !== 'permission-denied') {
                    console.error("Admin users sync error:", error);
                }
            }
        );

        // Load Settings
        const settingsRef = doc(db, 'siteSettings', 'config');
        getDoc(settingsRef).then(snap => {
            if(snap.exists()) setSettings(snap.data() as SiteSettings);
            else setDoc(settingsRef, { registrationsEnabled: true, stickers: [] });
        }).catch(err => {
             if (err.code !== 'permission-denied') console.error("Settings fetch error:", err);
        });

        return () => unsubUsers();
    }, [user]);

    const toggleReg = async () => {
        try {
            const newVal = !settings.registrationsEnabled;
            setSettings({...settings, registrationsEnabled: newVal});
            await updateDoc(doc(db, 'siteSettings', 'config'), { registrationsEnabled: newVal });
        } catch (e) {
            console.error("Error toggling registration:", e);
            alert("Failed to update settings. Permission denied?");
        }
    };

    const addSticker = async () => {
        if(!newSticker) return;
        try {
            const stickerObj = { url: newSticker, addedAt: Date.now() };
            await updateDoc(doc(db, 'siteSettings', 'config'), { stickers: arrayUnion(stickerObj) });
            setSettings({...settings, stickers: [...settings.stickers, stickerObj]});
            setNewSticker('');
        } catch (e) {
            console.error("Error adding sticker:", e);
            alert("Failed to add sticker.");
        }
    };

    const removeSticker = async (sticker: any) => {
        try {
            await updateDoc(doc(db, 'siteSettings', 'config'), { stickers: arrayRemove(sticker) });
            setSettings({...settings, stickers: settings.stickers.filter(s => s.url !== sticker.url)});
        } catch (e) {
             console.error("Error removing sticker:", e);
             alert("Failed to remove sticker.");
        }
    };

    if(loading) return <div>Loading...</div>;
    if(!user?.isAdmin) return <Navigate to="/chat" />;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white"><i className="fas fa-shield-alt text-red-500 mr-2"></i>Admin Panel</h1>
                    <button onClick={() => window.history.back()} className="text-gray-500 hover:text-gray-800">Exit</button>
                </div>
                <div className="flex h-[600px]">
                    <div className="w-1/4 bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-700 p-4 space-y-2">
                        <button onClick={() => setActiveTab('users')} className={`w-full text-left p-3 rounded-lg font-medium transition ${activeTab === 'users' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Users</button>
                        <button onClick={() => setActiveTab('content')} className={`w-full text-left p-3 rounded-lg font-medium transition ${activeTab === 'content' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Content & Stickers</button>
                        <button onClick={() => setActiveTab('settings')} className={`w-full text-left p-3 rounded-lg font-medium transition ${activeTab === 'settings' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Settings</button>
                    </div>
                    <div className="w-3/4 p-6 overflow-y-auto">
                        {activeTab === 'users' && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold dark:text-white">Manage Users ({users.length})</h2>
                                {users.map(u => (
                                    <div key={u.uid} className="flex flex-col p-3 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <img src={u.photoURL} className="w-10 h-10 rounded-full" />
                                                <div>
                                                    <p className="font-bold dark:text-white">{u.displayName}</p>
                                                    <p className="text-xs text-gray-500">{u.email}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${u.isAdmin ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                {u.isAdmin ? 'Admin' : 'User'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab === 'content' && (
                            <div>
                                <h2 className="text-xl font-bold dark:text-white mb-4">Stickers</h2>
                                <div className="flex gap-2 mb-4">
                                    <input value={newSticker} onChange={e => setNewSticker(e.target.value)} placeholder="Sticker URL" className="flex-1 border p-2 rounded dark:bg-gray-700 dark:text-white" />
                                    <button onClick={addSticker} className="bg-blue-500 text-white px-4 rounded">Add</button>
                                </div>
                                <div className="grid grid-cols-6 gap-2">
                                    {settings.stickers.map((s, i) => (
                                        <div key={i} className="relative group">
                                            <img src={s.url} className="w-full h-20 object-contain border rounded p-1" />
                                            <button onClick={() => removeSticker(s)} className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition text-xs">&times;</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'settings' && (
                            <div>
                                <h2 className="text-xl font-bold dark:text-white mb-4">Registration Settings</h2>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <h3 className="font-bold dark:text-white">Allow New Signups</h3>
                                        <p className="text-sm text-gray-500">Users can create new accounts</p>
                                    </div>
                                    <button onClick={toggleReg} className={`w-12 h-6 rounded-full p-1 transition ${settings.registrationsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition ${settings.registrationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPage;
