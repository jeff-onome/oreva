import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/firebase';
import { Coupon } from '../../types';
import { formatNaira } from '../../utils/formatters';
import Skeleton from '../../components/Skeleton';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};


const RewardsPage: React.FC = () => {
    const { user } = useAuth();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            // FIX: Use v8 Realtime Database syntax instead of Firestore
            const q = db.ref('coupons').orderByChild('is_active').equalTo(true);
            const querySnapshot = await q.get();
            setCoupons(snapshotToArray(querySnapshot) as Coupon[]);
        } catch (error) {
            console.error("Error fetching coupons:", error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Rewards & Coupons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Loyalty Points */}
                <div className="bg-primary/5 p-6 rounded-lg text-center">
                    <Gift size={32} className="mx-auto text-primary mb-3" />
                    <p className="text-text-secondary">Loyalty Points Balance</p>
                    <p className="text-4xl font-bold text-primary">
                        {(user?.loyaltyPoints || 0).toLocaleString()}
                    </p>
                </div>

                {/* Available Coupons */}
                <div className="bg-secondary/5 p-6 rounded-lg">
                     <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Tag size={20} className="text-secondary"/> Available Coupons</h3>
                     {loading ? (
                        <div className="space-y-3 animate-pulse">
                            <Skeleton className="h-16 rounded-lg" />
                            <Skeleton className="h-16 rounded-lg" />
                            <Skeleton className="h-16 rounded-lg" />
                        </div>
                     ) : (
                         coupons.length > 0 ? (
                            <div className="space-y-3">
                                {coupons.map(coupon => (
                                    <div key={coupon.id} className="p-3 border-l-4 border-secondary bg-white rounded-r-lg shadow-sm">
                                        <p className="font-mono font-semibold text-secondary">{coupon.code}</p>
                                        <p className="text-sm text-text-secondary">
                                            {coupon.discount_type === 'percentage'
                                                ? `Get ${coupon.discount_value}% off your purchase.`
                                                : `Get ${formatNaira(coupon.discount_value)} off your purchase.`
                                            }
                                        </p>
                                    </div>
                                ))}
                            </div>
                         ) : (
                            <p className="text-text-secondary text-center p-4">No active coupons available right now.</p>
                         )
                     )}
                </div>
            </div>
        </div>
    );
};

export default RewardsPage;