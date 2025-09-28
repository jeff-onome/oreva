import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../utils/firebase';
import { Review } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Check, X, Trash2, Star } from 'lucide-react';
import Button from '../../components/Button';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};

// Modal component to display ticket details
const TicketDetailsModal: React.FC<{ ticket: Review; onClose: () => void }> = ({ ticket, onClose }) => (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-base rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold">Review Details</h3>
                <button onClick={onClose}><X /></button>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <h4 className="font-semibold text-sm text-text-secondary">Customer</h4>
                    <p>{ticket.userFirstName} {ticket.userLastName}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-text-secondary">Product</h4>
                    <p>{ticket.products?.name}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-sm text-text-secondary">Rating</h4>
                     <div className="flex items-center text-yellow-400">
                        {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < ticket.rating ? 'currentColor' : 'none'}/>)}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-text-secondary">Comment</h4>
                    <p className="whitespace-pre-wrap bg-neutral p-3 rounded-md">{ticket.comment}</p>
                </div>
                 <div className="text-right">
                     <Button variant="outline" onClick={onClose}>Close</Button>
                 </div>
            </div>
        </div>
    </div>
);


const ReviewManagementPage: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const { showToast } = useToast();

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const reviewsQuery = db.ref('reviews').orderByChild('createdAt');
            const reviewsSnap = await reviewsQuery.get();
            const reviewsArray = snapshotToArray(reviewsSnap).sort((a: any, b: any) => b.createdAt - a.createdAt);
            
            const reviewsData = await Promise.all(reviewsArray.map(async (reviewData: any) => {
                let profileData = { first_name: 'N/A', last_name: '' };
                const profileSnap = await db.ref('users/' + reviewData.userId).get();
                if (profileSnap.exists()) {
                    profileData = { first_name: profileSnap.val().firstName, last_name: profileSnap.val().lastName };
                }

                let productData = { name: 'N/A' };
                const productSnap = await db.ref('products/' + reviewData.productId).get();
                if (productSnap.exists()) {
                    productData = { name: productSnap.val().name };
                }

                return {
                    ...reviewData,
                    profiles: profileData,
                    products: productData,
                } as Review;
            }));

            setReviews(reviewsData);
        } catch (error) {
            showToast('Failed to fetch reviews', 'error');
            console.error(error)
        }
        setLoading(false);
    }, [showToast]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleApproveToggle = async (review: Review) => {
        try {
            await db.ref('reviews/' + review.id).update({ is_approved: !review.is_approved });
            showToast(`Review ${!review.is_approved ? 'approved' : 'hidden'}`, 'success');
            fetchReviews();
        } catch (error) {
            showToast('Failed to update review status', 'error');
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (window.confirm('Are you sure you want to permanently delete this review?')) {
            try {
                await db.ref('reviews/' + reviewId).remove();
                showToast('Review deleted successfully', 'success');
                fetchReviews();
            } catch (error) {
                showToast('Failed to delete review', 'error');
            }
        }
    };

    return (
        <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Manage Reviews</h2>
            <div className="bg-base overflow-x-auto rounded-lg shadow">
                {loading ? <p className="p-4">Loading reviews...</p> : (
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Product</th>
                                <th scope="col" className="px-6 py-3">Customer</th>
                                <th scope="col" className="px-6 py-3">Rating</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map(review => (
                                <tr key={review.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium max-w-xs truncate">{review.products?.name || 'N/A'}</td>
                                    <td className="px-6 py-4">{review.userFirstName} {review.userLastName}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {review.rating} <Star size={14} className="ml-1 text-yellow-400"/>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${review.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {review.is_approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-right space-x-1 sm:space-x-2">
                                        <button onClick={() => setSelectedReview(review)} className="font-medium text-primary hover:underline text-xs sm:text-sm px-2">View</button>
                                        <Button
                                            size="sm"
                                            variant={review.is_approved ? 'outline' : 'primary'}
                                            onClick={() => handleApproveToggle(review)}
                                            className="flex items-center gap-1 px-2 text-xs sm:text-sm"
                                        >
                                            {review.is_approved 
                                                ? <><X size={14}/> <span className="hidden sm:inline">Hide</span></>
                                                : <><Check size={14}/> <span className="hidden sm:inline">Approve</span></>
                                            }
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:bg-red-100 p-1 sm:p-2"
                                            onClick={() => handleDelete(review.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
             {selectedReview && <TicketDetailsModal ticket={selectedReview} onClose={() => setSelectedReview(null)} />}
        </div>
    );
};

export default ReviewManagementPage;