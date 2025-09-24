import React, { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { Product } from '../../types';
import { db } from '../../utils/firebase';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/ProductCard';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/Spinner';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};


const WishlistPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWishlist = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // FIX: Use v8 Realtime Database syntax instead of Firestore
            const wishlistRef = db.ref(`users/${user.id}/wishlist`);
            const wishlistSnap = await wishlistRef.get();
            const wishlistItems = snapshotToArray(wishlistSnap);
            
            const productPromises = wishlistItems.map(item => {
                const productId = (item as any).productId;
                return db.ref(`products/${productId}`).get();
            });

            const productSnaps = await Promise.all(productPromises);
            const products = productSnaps
                .filter(snap => snap.exists())
                .map(snap => ({ id: snap.key, ...snap.val() } as Product));

            setWishlistProducts(products);
        } catch(error) {
            showToast('Could not load your wishlist.', 'error');
            console.error(error);
        }
        setLoading(false);
    }, [user, showToast]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>
            {loading ? <div className="flex justify-center py-10"><Spinner/></div> : (
                wishlistProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {wishlistProducts.map(product => (
                           <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border rounded-lg">
                        <Heart size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold">Your Wishlist is Empty</h3>
                        <p className="text-text-secondary mt-2">Click the heart icon on a product to save it here.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default WishlistPage;
