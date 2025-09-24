import React, { useState, useMemo } from 'react';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { Monitor } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// Simple user agent parser helper
const parseUserAgent = (ua: string): string => {
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    if (!ua) return 'Current session';

    // OS detection
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('like Mac')) os = 'iOS';

    // Browser detection
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    else if (ua.includes('Trident')) browser = 'Internet Explorer';
    else if (ua.includes('Edg/')) browser = 'Edge'; // Chromium Edge
    else if (ua.includes('Edge')) browser = 'Edge (Legacy)';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    
    return `${browser} on ${os}`;
};

const SecurityPage: React.FC = () => {
    const { updateUserPassword, loading: authLoading } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { showToast } = useToast();

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match.', 'error');
            return;
        }
        if (newPassword.length < 6) {
             showToast('Password should be at least 6 characters.', 'error');
            return;
        }

        const { success, error } = await updateUserPassword(newPassword);
        if(error) {
            showToast(error.message, 'error');
        } else if (success) {
            showToast('Password updated successfully!', 'success');
            setNewPassword('');
            setConfirmPassword('');
        }
    };
    
    const currentSessionInfo = useMemo(() => {
        if (typeof window !== 'undefined' && window.navigator) {
            return parseUserAgent(navigator.userAgent);
        }
        return 'Current session';
    }, []);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Account Security</h2>

            {/* Change Password */}
            <div className="mb-12">
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm mt-4">
                    <InputField 
                        id="new-password" 
                        label="New Password" 
                        type="password" 
                        placeholder="••••••••" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <InputField 
                        id="confirm-new-password" 
                        label="Confirm New Password" 
                        type="password" 
                        placeholder="••••••••" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <Button type="submit" disabled={authLoading}>
                        {authLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                </form>
            </div>

            {/* 2FA */}
            <div className="mb-12">
                 <h3 className="text-xl font-semibold mb-4 border-b pb-2">Two-Factor Authentication (2FA)</h3>
                 <div className="flex items-center justify-between p-4 border rounded-lg max-w-lg mt-4">
                    <div>
                         <p className="font-medium">Enable 2FA</p>
                         <p className="text-sm text-text-secondary">Add an extra layer of security to your account. (Coming Soon)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-not-allowed">
                        <input type="checkbox" className="sr-only peer" disabled />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                </div>
            </div>

             {/* Login Sessions */}
            <div>
                 <h3 className="text-xl font-semibold mb-4 border-b pb-2">Login Sessions</h3>
                 <div className="space-y-4 mt-4">
                    <div className="p-4 border rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Monitor size={24} className="text-text-secondary"/>
                            <div>
                                <p className="font-semibold">{currentSessionInfo}</p>
                                <p className="text-sm text-text-secondary">This is your current session</p>
                            </div>
                        </div>
                        <span className="text-sm text-green-600 font-medium">Active</span>
                    </div>
                 </div>
                 <div className="mt-4">
                    <p className="text-sm text-text-secondary">Firebase Auth SDK does not support signing out other sessions from the client. This feature is unavailable.</p>
                 </div>
            </div>
        </div>
    );
};

export default SecurityPage;
