import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../utils/firebase';
import { Loader2 } from 'lucide-react';

interface ToggleProps {
    label: string;
    dbKey: 'notifications_orders' | 'notifications_promos' | 'notifications_newsletter';
}

const NotificationsPage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();
    const [updating, setUpdating] = useState<string | null>(null);

    if (!user) return null;

    const handleToggle = async (key: ToggleProps['dbKey'], currentValue: boolean) => {
        setUpdating(key);
        try {
            // FIX: Use v8 Realtime Database syntax instead of Firestore
            const userDocRef = db.ref('users/' + user.id);
            await userDocRef.update({ [key]: !currentValue });
            showToast('Preference saved!', 'success');
            await refreshUser();
        } catch (error) {
            showToast('Failed to update preference', 'error');
        }
        setUpdating(null);
    }

    const ToggleSwitch: React.FC<ToggleProps> = ({ label, dbKey }) => {
        const enabled = user?.[dbKey] ?? false;
        const isLoading = updating === dbKey;

        return (
            <div className={`flex items-center justify-between p-4 border rounded-lg transition-opacity ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <span className="font-medium">{label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={enabled} 
                        onChange={() => handleToggle(dbKey, enabled)}
                        className="sr-only peer"
                        disabled={isLoading}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    {isLoading && <Loader2 size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-primary"/>}
                </label>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Notifications & Alerts</h2>
            <div className="space-y-4 max-w-lg">
                <ToggleSwitch label="Order Status Updates" dbKey="notifications_orders" />
                <ToggleSwitch label="Promotions & Sales" dbKey="notifications_promos" />
                <ToggleSwitch label="Newsletter" dbKey="notifications_newsletter" />
            </div>
        </div>
    );
};

export default NotificationsPage;
