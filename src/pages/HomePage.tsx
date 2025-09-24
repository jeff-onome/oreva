import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift, Package, ShieldCheck, ChevronLeft, ChevronRight, Zap, AlertTriangle } from 'lucide-react';
import Button from '../components/Button';
import ProductCard from '../components/ProductCard';
import { db } from '../utils/firebase';
import { Product, Category, FlashSale } from '../types';
import { formatNaira } from '../utils/formatters';
import { useSiteSettings } from '../context/SiteSettingsContext';
import Spinner from '../components/Spinner';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};

const CountdownTimer: React.FC<{ endDate: string }> = ({ endDate }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(endDate) - +new Date();
        let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    return (
        <div className="flex gap-4 text-center">
            {Object.entries(timeLeft).map(([interval, value]) => (
                <div key={interval} className="flex flex-col items-center p-3 bg-white/20 rounded-lg">
                    <span className="text-3xl font-bold">{String(value).padStart(2, '0')}</span>
                    <span className="text-xs uppercase">{interval}</span>
                </div>
            ))}
        </div>
    );
};


const HomePage: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
  const [flashSaleProduct, setFlashSaleProduct] = useState<Product | null>(null);
  const { settings } = useSiteSettings();
  const siteName = settings.site_name?.name || 'ORESKY';
  const heroSlides = settings.hero_slides || [];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHomePageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        // Fetch featured products (Note: requires indexing 'featured' in RTDB rules for performance)
        const productsQuery = db.ref('products').orderByChild('featured').equalTo(true).limitToFirst(4);
        const productsSnap = await productsQuery.get();
        // Client-side filtering as RTDB may not return in a specific order with limit.
        const allFeatured = snapshotToArray(productsSnap);
        setFeaturedProducts(allFeatured.slice(0, 4) as Product[]);

        // Fetch categories
        const categoriesQuery = db.ref('categories').limitToFirst(4);
        const categoriesSnap = await categoriesQuery.get();
        setCategories(snapshotToArray(categoriesSnap) as Category[]);

        // Fetch flash sale from settings
        const saleInfo = settings.flash_sale;
        if (saleInfo && saleInfo.active && new Date(saleInfo.endDate) > new Date()) {
            setFlashSale(saleInfo);
            if (saleInfo.productId) {
                const productDoc = await db.ref('products/' + saleInfo.productId).get();
                if (productDoc.exists()) {
                    setFlashSaleProduct({ id: productDoc.key!, ...productDoc.val() } as Product);
                }
            }
        } else {
            setFlashSale(null);
            setFlashSaleProduct(null);
        }

    } catch (err: any) {
        console.error("Failed to fetch homepage data:", err);
        setError(`Failed to load content: ${err.message}. Please check your connection and try again.`);
    } finally {
        setLoading(false);
    }
  }, [settings.flash_sale]);

  useEffect(() => {
    if (!settings) return; // Wait for settings to be loaded by context
    fetchHomePageData();
  }, [fetchHomePageData, settings]);
  
  const nextSlide = useCallback(() => {
    if (heroSlides.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const prevSlide = () => {
    if (heroSlides.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + heroSlides.length) % heroSlides.length);
  };
  
  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  useEffect(() => {
    const sliderInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    return () => clearInterval(sliderInterval);
  }, [nextSlide]);

  return (
    <div className="animate-fade-in">
      {/* Hero Slider Section */}
      {heroSlides.length > 0 && (
          <section className="relative h-[60vh] md:h-[80vh] w-full text-white">
            <div className="w-full h-full">
                {heroSlides.map((slide, slideIndex) => (
                    <div
                        key={slideIndex}
                        style={{ backgroundImage: `url(${slide.imageUrl})` }}
                        className={`absolute inset-0 w-full h-full bg-center bg-cover transition-opacity duration-1000 ease-in-out ${
                            slideIndex === currentIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                ))}
            </div>
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">{heroSlides[currentIndex]?.title}</h1>
                <p className="max-w-2xl mx-auto text-base md:text-lg text-indigo-100 mb-8">
                  {heroSlides[currentIndex]?.subtitle}
                </p>
                <Button size="lg">
                  <Link to="/products" className="flex items-center gap-2">
                    Shop Now <ArrowRight size={20} />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Left Arrow */}
            <button onClick={prevSlide} aria-label="Previous slide" className="group absolute top-1/2 -translate-y-1/2 left-5 text-white bg-primary/30 p-2 rounded-full hover:bg-primary/50 transition z-10">
              <ChevronLeft size={32} className="group-active:scale-90 transition-transform" />
            </button>
            {/* Right Arrow */}
            <button onClick={nextSlide} aria-label="Next slide" className="group absolute top-1/2 -translate-y-1/2 right-5 text-white bg-primary/30 p-2 rounded-full hover:bg-primary/50 transition z-10">
              <ChevronRight size={32} className="group-active:scale-90 transition-transform"/>
            </button>

            {/* Dots */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {heroSlides.map((_, slideIndex) => (
                <button
                  key={slideIndex}
                  onClick={() => goToSlide(slideIndex)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === slideIndex ? 'bg-primary scale-125' : 'bg-white/50'}`}
                  aria-label={`Go to slide ${slideIndex + 1}`}
                ></button>
              ))}
            </div>
          </section>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Spinner /></div>
      ) : error ? (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-red-600">Failed to Load Content</h2>
            <p className="text-text-secondary mt-2 mb-6">{error}</p>
            <Button onClick={fetchHomePageData} variant="secondary">Try Again</Button>
        </div>
      ) : (
        <>
          {/* Flash Sale Section */}
          {flashSale && flashSaleProduct && (
              <section className="bg-secondary text-white py-16">
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="grid md:grid-cols-2 gap-8 items-center">
                          <div className="text-center md:text-left">
                              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-2">
                                <Zap /> {flashSale.title}
                              </h2>
                              <p className="text-lg mb-4">Don't miss out on this limited-time offer!</p>
                              <CountdownTimer endDate={flashSale.endDate} />
                          </div>
                          <Link to={`/products/${flashSaleProduct.id}`} className="block bg-white/10 p-6 rounded-xl hover:bg-white/20 transition">
                            <div className="flex items-center gap-6">
                               <img src={flashSaleProduct.images[0]} alt={flashSaleProduct.name} className="w-32 h-32 object-cover rounded-lg"/>
                               <div>
                                    <h3 className="text-xl font-bold">{flashSaleProduct.name}</h3>
                                    <div className="flex items-baseline gap-3 mt-2">
                                        <p className="text-3xl font-bold">{formatNaira(flashSaleProduct.sale_price || flashSaleProduct.price)}</p>
                                        {flashSaleProduct.sale_price && <p className="line-through">{formatNaira(flashSaleProduct.price)}</p>}
                                    </div>
                               </div>
                            </div>
                          </Link>
                      </div>
                  </div>
              </section>
          )}

          {/* Featured Products Section */}
          {featuredProducts.length > 0 && (
             <section className="py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Featured Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featuredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                    ))}
                </div>
                </div>
            </section>
          )}

          {/* Categories Section */}
          <section className="bg-neutral py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Shop by Category</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {categories.map(category => (
                    <Link key={category.id} to={`/products?category=${category.slug}`} className="group relative block bg-base rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div className="h-48 bg-cover bg-center" style={{backgroundImage: `url(https://picsum.photos/seed/${category.slug}/800/600)`}}></div>
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <h3 className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{category.name}</h3>
                        </div>
                    </Link>
                    ))}
                </div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section className="py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Why Choose {siteName}?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="p-6">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto mb-4">
                    <Gift size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Unique Products</h3>
                  <p className="text-text-secondary">Handpicked items that you won't find anywhere else.</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-secondary/10 mx-auto mb-4">
                    <Package size={32} className="text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Fast Shipping</h3>
                  <p className="text-text-secondary">Quick and reliable delivery to your doorstep.</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-accent/10 mx-auto mb-4">
                    <ShieldCheck size={32} className="text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Secure Checkout</h3>
                  <p className="text-text-secondary">Your information is safe with our encrypted checkout.</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HomePage;
