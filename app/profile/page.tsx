import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/ui/Loader';

const EditProfilePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState('');

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setPhotoURL(user.photoURL || '');
            setPreview(user.photoURL || '');
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            setFile(f);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(f);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            let finalPhotoURL = photoURL;
            if (file) {
                finalPhotoURL = await uploadToCloudinary(file, 'image');
            }

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName,
                photoURL: finalPhotoURL
            });

            alert('Profile updated successfully!');
            navigate('/chat');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <Loader />;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Profile</h2>
                    <button onClick={() => navigate('/chat')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer">
                            <img 
                                src={preview || 'https://via.placeholder.com/150'} 
                                alt="Profile Preview" 
                                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-md"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                <i className="fas fa-camera text-white text-xl"></i>
                            </div>
                        </div>
                        <input 
                            type="file" 
                            id="avatar-upload" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileChange} 
                        />
                        <button type="button" onClick={() => document.getElementById('avatar-upload')?.click()} className="mt-2 text-sm text-blue-500 font-semibold hover:underline">Change Photo</button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                        <input 
                            type="text" 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition shadow-md disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfilePage;