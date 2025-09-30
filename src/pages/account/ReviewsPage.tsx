import React, { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../utils/firebase';
import { Review } from '../../types';
import { Link } from 'react-router-dom';
import Skeleton from '../../components/Skeleton';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};

const ReviewsPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReviews = useCallback(async () => {
        if(!user) return;
        setLoading(true);
        try {
            // FIX: Use v8 Realtime Database syntax instead of Firestore
            const q = db.ref('reviews').orderByChild('userId').equalTo(user.id);
            const querySnapshot = await q.get();
            const userReviews = snapshotToArray(querySnapshot).sort((a: any, b: any) => b.createdAt - a.createdAt);
            
            const reviewsData = await Promise.all(userReviews.map(async (reviewData: any) => {
                const productSnap = await db.ref(`products/${reviewData.productId}`).get();
                return {
                    ...reviewData,
                    products: productSnap.exists() ? { id: productSnap.key, name: productSnap.val().name } : undefined
                } as Review;
            }));

            setReviews(reviewsData);
        } catch (error) {
            showToast('Could not fetch your reviews', 'error');
            console.error(error);
        }
        setLoading(false);
    }, [user, showToast]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);
    
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">My Reviews</h2>
             {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Skeleton className="h-5 w-40 mb-2" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-full mt-3" />
                            <Skeleton className="h-4 w-2/3 mt-2" />
                        </div>
                    ))}
                </div>
             ) : (
                 reviews.length > 0 ? (
                     <div className="space-y-4">
                         {reviews.map(review => (
                             <div key={review.id} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold">
                                            <Link to={`/products/${review.products?.id}`} className="hover:underline hover:text-primary">
                                                {review.products?.name || 'Product'}
                                            </Link>
                                        </h3>
                                        <div className="flex items-center text-yellow-400 my-1">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < review.rating ? 'currentColor' : 'none'}/>)}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${review.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {review.is_approved ? 'Approved' : 'Pending'}
                                    </span>
                                </div>
                                <p className="text-text-secondary mt-2">{review.comment}</p>
                             </div>
                         ))}
                     </div>
                 ) : (
                    <div className="text-center py-16 border rounded-lg">
                        <Star size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold">No Reviews Yet</h3>
                        <p className="text-text-secondary mt-2">After you purchase an item, you can share your feedback here.</p>
                    </div>
                 )
             )}
        </div>
    );
};

export default ReviewsPage;