import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Plus, Minus, CheckCircle, ChevronLeft, ChevronRight, ArrowLeft, Home, Heart, Send } from 'lucide-react';
// FIX: Use firebase v9 compat libraries to support v8 syntax for ServerValue.TIMESTAMP.
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { db } from '../utils/firebase';
import { Product, Review } from '../types';
import Button from '../components/Button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import { formatNaira } from '../utils/formatters';
import Spinner from '../components/Spinner';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};

const ReviewForm: React.FC<{ productId: string, onReviewSubmit: () => void }> = ({ productId, onReviewSubmit }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user || !comment) return;
        setIsSubmitting(true);

        try {
          const reviewsRef = db.ref('reviews');
          await reviewsRef.push({
            productId,
            userId: user.id,
            userFirstName: user.firstName,
            userLastName: user.lastName,
            rating,
            comment,
            is_approved: false, // Reviews require approval
            createdAt: firebase.database.ServerValue.TIMESTAMP,
          });
          showToast('Review submitted for approval!', 'success');
          setComment('');
          setRating(5);
          onReviewSubmit();
        } catch (error) {
           showToast("Failed to submit review.", 'error');
           console.error("Review submission error:", error);
        }
        setIsSubmitting(false);
    }
    
    return (
        <div className="mt-8 p-6 bg-base rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Leave a Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Your Rating</label>
                    <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} type="button" onClick={() => setRating(star)}>
                                <Star className={`w-6 h-6 ${rating >= star ? 'text-yellow-400' : 'text-slate-300'}`} fill="currentColor"/>
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-text-secondary mb-1">Your Review</label>
                    <textarea 
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="What did you like or dislike?"
                        required
                    />
                </div>
                <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                    <Send size={16}/> {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
            </form>
        </div>
    )
}


const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [wishlistDocId, setWishlistDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchPageData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
        // Fetch product
        const productRef = db.ref('products/' + id);
        const productSnap = await productRef.get();
        if (!productSnap.exists()) {
            navigate('/products');
            return;
        }
        const productData = { id: productSnap.key!, ...productSnap.val() } as Product;
        setProduct(productData);

        // Fetch approved reviews for this product (requires client-side filtering)
        const reviewsQuery = db.ref('reviews').orderByChild('productId').equalTo(id);
        const reviewsSnap = await reviewsQuery.get();
        const allReviews = snapshotToArray(reviewsSnap) as Review[];
        setReviews(allReviews.filter(r => r.is_approved));

        // Fetch related products (client-side filtering due to RTDB query limits)
        if (productData.categories && productData.categories.length > 0) {
            const firstCategorySlug = productData.categories[0].slug;
            const allProductsSnap = await db.ref('products').get();
            const allProducts = snapshotToArray(allProductsSnap) as Product[];
            const related = allProducts.filter(p => 
                p.id !== id && p.categories?.some(c => c.slug === firstCategorySlug)
            ).slice(0, 3);
            setRelatedProducts(related);
        }

        // Check if user has purchased this item and if it's in their wishlist
        if (user) {
            // Check wishlist
            const wishlistQuery = db.ref(`users/${user.id}/wishlist`).orderByChild('productId').equalTo(id);
            const wishlistSnap = await wishlistQuery.get();
            if (wishlistSnap.exists()) {
                setWishlistDocId(Object.keys(wishlistSnap.val())[0]);
            } else {
                setWishlistDocId(null);
            }

            // Check purchase history (client-side filtering required)
            const ordersQuery = db.ref('orders').orderByChild('userId').equalTo(user.id);
            const ordersSnap = await ordersQuery.get();
            const userOrders = snapshotToArray(ordersSnap);
            const purchased = userOrders.some((order: any) => order.itemIds?.includes(id!));
            setHasPurchased(purchased);
        }

    } catch (err) {
        console.error("Error fetching product page data:", err);
        showToast('Could not load product details.', 'error');
    } finally {
        setLoading(false);
    }
  }, [id, user, navigate, showToast]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPageData();
  }, [fetchPageData]);

  const handleReviewSubmitted = useCallback(async () => {
     // The review is pending, so we don't need to re-fetch the public reviews list.
  }, []);
  
  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };
  
  const handleToggleWishlist = async () => {
      if (!user || !product) {
          showToast('Please log in to use the wishlist.', 'info');
          return;
      }
      const wishlistRef = db.ref(`users/${user.id}/wishlist`);
      if (wishlistDocId) {
          await db.ref(`users/${user.id}/wishlist/${wishlistDocId}`).remove();
          setWishlistDocId(null);
          showToast('Removed from wishlist.', 'success');
      } else {
          const newDocRef = await wishlistRef.push({ 
            productId: product.id,
            addedAt: firebase.database.ServerValue.TIMESTAMP
          });
          setWishlistDocId(newDocRef.key);
          showToast('Added to wishlist!', 'success');
      }
  }

  const nextImage = () => {
    if (!product || !product.images || product.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };
  const prevImage = () => {
    if (!product || !product.images || product.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };
  const incrementQuantity = () => product && quantity < product.stock && setQuantity(q => q + 1);
  const decrementQuantity = () => quantity > 1 && setQuantity(q => q - 1);


  if (loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }
  
  if (!product) {
    return <div className="text-center py-20">Product not found.</div>;
  }
  
  const hasStock = product.stock > 0;
  const displayPrice = product.sale_price || product.price;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
       <div className="flex justify-between items-center mb-6">
            <button 
                onClick={() => navigate(-1)} 
                className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-semibold"
                aria-label="Go back to previous page"
            >
                <ArrowLeft size={18} /> Back
            </button>
             <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-semibold">
                <Home size={18} /> Back to Homepage
            </Link>
       </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div>
          <div className="relative bg-base rounded-xl shadow-lg overflow-hidden mb-4">
            <img 
              key={currentImageIndex}
              src={product.images?.[currentImageIndex] || 'https://picsum.photos/seed/product/800/600'} 
              alt={product.name} 
              className="w-full h-96 object-cover animate-fade-in" 
            />
            {product.images && product.images.length > 1 && (
              <>
                <button onClick={prevImage} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 text-text-primary p-2 rounded-full shadow-md transition-all">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={nextImage} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/80 text-text-primary p-2 rounded-full shadow-md transition-all">
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
          <div className="flex gap-4">
            {product.images?.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`View image ${index + 1}`}
                className={`w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === index ? 'border-primary' : 'border-transparent'}`}
              >
                <img src={img} alt={`${product.name} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <span className="text-sm font-semibold text-primary uppercase">
            {product.categories?.map(c => c.name).join(' / ')}
          </span>
          <h1 className="text-3xl lg:text-4xl font-extrabold my-2">{product.name}</h1>
          <div className="flex items-center gap-4 my-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} fill={i < Math.round(product.rating) ? 'currentColor' : 'none'} />
              ))}
            </div>
            <span className="text-text-secondary">{product.rating.toFixed(1)} stars ({reviews.length} reviews)</span>
          </div>
          <p className="text-text-secondary text-lg leading-relaxed mb-6">{product.description}</p>
          
          <div className="flex items-baseline gap-4 mb-6">
            <p className={`text-4xl md:text-5xl font-bold ${product.sale_price ? 'text-secondary' : 'text-primary'}`}>
                {formatNaira(displayPrice)}
            </p>
            {product.sale_price && (
                <p className="text-2xl text-text-secondary line-through">
                    {formatNaira(product.price)}
                </p>
            )}
          </div>
          
          <div className={`mb-6 text-lg font-semibold ${hasStock ? 'text-accent' : 'text-red-500'}`}>
            {hasStock ? `${product.stock} items in stock` : 'Out of stock'}
          </div>

          {/* Actions */}
          {hasStock && (
            <div className="flex items-stretch gap-4 mb-6">
              <div className="flex items-center border border-slate-300 rounded-lg">
                <button onClick={decrementQuantity} className="p-3 text-text-secondary hover:bg-neutral rounded-l-lg"><Minus size={16} /></button>
                <span className="px-4 font-bold text-lg">{quantity}</span>
                <button onClick={incrementQuantity} className="p-3 text-text-secondary hover:bg-neutral rounded-r-lg"><Plus size={16} /></button>
              </div>
              <Button size="lg" onClick={handleAddToCart} className="flex-grow flex items-center justify-center gap-2">
                {addedToCart ? <><CheckCircle size={20}/> Added!</> : 'Add to Cart' }
              </Button>
              <Button size="lg" variant="outline" onClick={handleToggleWishlist} className="px-4">
                  <Heart size={20} fill={wishlistDocId ? 'currentColor' : 'none'}/>
              </Button>
            </div>
          )}
        </div>
      </div>
       
      {/* Reviews Section */}
      <div className="mt-16 pt-10 border-t">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Customer Reviews</h2>
          {reviews.length > 0 ? (
              <div className="space-y-6">
                  {reviews.map(review => (
                      <div key={review.id} className="p-4 border rounded-lg bg-base">
                          <div className="flex items-center gap-4 mb-2">
                              <p className="font-bold">{review.userFirstName} {review.userLastName?.charAt(0)}.</p>
                              <div className="flex text-yellow-400">
                                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < review.rating ? 'currentColor' : 'none'}/>)}
                              </div>
                          </div>
                          <p className="text-text-secondary">{review.comment}</p>
                      </div>
                  ))}
              </div>
          ) : (
            <p className="text-text-secondary">No reviews yet. Be the first to share your thoughts!</p>
          )}

          {/* Add Review Form */}
          {user && hasPurchased && <ReviewForm productId={product.id} onReviewSubmit={handleReviewSubmitted} />}
          {user && !hasPurchased && <p className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-lg">You must purchase this item to leave a review.</p>}
          {!user && <p className="mt-4 p-4 bg-neutral rounded-lg">Please <Link to="/login" className="font-bold text-primary hover:underline">log in</Link> to leave a review.</p>}

      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedProducts.map(p => <ProductCard key={p.id} product={p}/>)}
            </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;