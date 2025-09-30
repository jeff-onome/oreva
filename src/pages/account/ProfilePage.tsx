import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { Camera, Loader2 } from 'lucide-react';
import { db } from '../../utils/firebase';
import { supabase } from '../../utils/supabase';
import { useToast } from '../../context/ToastContext';
import AvatarPlaceholder from '../../components/AvatarPlaceholder';

const ProfilePage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setPhone(user.phone || '');
            setCountry(user.country || '');
        }
    }, [user]);

    if (!user) return null;

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
          const userDocRef = db.ref('users/' + user.id);
          await userDocRef.update({
            firstName,
            lastName,
            phone,
            country,
          });
          showToast('Profile updated successfully!', 'success');
          await refreshUser();
        } catch (error) {
           showToast('Error updating profile.', 'error');
           console.error("Profile update error: ", error);
        } finally {
            setLoading(false);
        }
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;
        
        const file = e.target.files[0];
        setUploading(true);
        
        try {
            const filePath = `profile_pictures/${user.id}/${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (error) {
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(data.path);

            const userDocRef = db.ref('users/' + user.id);
            await userDocRef.update({
                profilePictureUrl: publicUrl
            });
            
            showToast('Profile picture updated!', 'success');
            await refreshUser();
        } catch (error) {
            showToast('Upload failed. Please try again.', 'error');
            console.error("Avatar upload error: ", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
            <form onSubmit={handleSaveChanges} className="space-y-6">
                <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6">
                    <div className="relative">
                         {user.profilePictureUrl ? (
                            <img 
                                src={user.profilePictureUrl}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-4 border-neutral"
                            />
                        ) : (
                            <AvatarPlaceholder className="w-24 h-24 rounded-full border-4 border-neutral" />
                        )}
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            className="hidden"
                            accept="image/png, image/jpeg"
                            disabled={uploading}
                        />
                        <button 
                            type="button" 
                            onClick={handleAvatarClick}
                            className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full hover:bg-primary-hover transition-colors"
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                        </button>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{`${user.firstName} ${user.lastName}`}</h3>
                        <p className="text-text-secondary">{user.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                     <InputField
                        id="firstName"
                        label="First Name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    <InputField
                        id="lastName"
                        label="Last Name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                    <InputField
                        id="email"
                        label="Email Address"
                        type="email"
                        defaultValue={user.email}
                        disabled
                        className="bg-slate-100 cursor-not-allowed"
                    />
                     <InputField
                        id="phone"
                        label="Phone Number"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                     <InputField
                        id="country"
                        label="Country"
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                    />
                </div>
               
                <div className="text-right pt-4">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;