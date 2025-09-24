import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Filter } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import { db } from '../utils/firebase';
import { Category, Product } from '../types';
import { formatNaira } from '../utils/formatters';
import Spinner from '../components/Spinner';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(searchParams.getAll('category') || []);
  const [priceRange, setPriceRange] = useState<number>(300000);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsSnap, categoriesSnap] = await Promise.all([
          db.ref('products').get(),
          db.ref('categories').get()
        ]);
        
        setAllProducts(snapshotToArray(productsSnap) as Product[]);
        setCategories(snapshotToArray(categoriesSnap) as Category[]);

      } catch (err: any) {
        console.error('Failed to load products page data:', err);
        setError('Could not load products. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    if (loading) return [];
    return allProducts.filter(product => {
      const searchMatch = searchTerm
        ? product.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const categoryMatch = selectedCategories.length > 0
        ? product.categories?.some(cat => selectedCategories.includes(cat.slug))
        : true;

      const priceMatch = product.price <= priceRange;

      return searchMatch && categoryMatch && priceMatch;
    });
  }, [allProducts, loading, searchTerm, selectedCategories, priceRange]);


  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFilterOpen]);


  const handleCategoryChange = (slug: string) => {
    const newCategories = selectedCategories.includes(slug)
      ? selectedCategories.filter(c => c !== slug)
      : [...selectedCategories, slug];
    setSelectedCategories(newCategories);
    setSearchParams(prev => {
        prev.delete('category');
        newCategories.forEach(cat => prev.append('category', cat));
        return prev;
    }, { replace: true });
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setSearchParams(prev => {
          if (e.target.value) {
            prev.set('search', e.target.value);
          } else {
            prev.delete('search');
          }
          return prev;
      }, { replace: true });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange(300000);
    setSearchTerm('');
    setSearchParams({}, { replace: true });
  };

  const FilterContent = () => (
    <>
      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map((category: Category) => (
            <label key={category.id} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.slug)}
                onChange={() => handleCategoryChange(category.slug)}
                className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-text-secondary">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3">Price Range</h3>
        <input
          type="range"
          min="0"
          max="300000"
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full h-2 bg-neutral rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-sm text-text-secondary mt-2">
          <span>₦0</span>
          <span>{formatNaira(priceRange)}</span>
        </div>
      </div>
      
      <button 
        onClick={clearFilters}
        className="w-full flex items-center justify-center gap-2 text-sm text-secondary hover:underline"
      >
        <X size={16}/> Clear All Filters
      </button>
    </>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Our Products</h1>
        <p className="mt-2 text-lg text-text-secondary">Find exactly what you're looking for.</p>
      </header>

      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-6">
        <Button 
          onClick={() => setIsFilterOpen(true)}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <Filter size={18} />
          Show Filters
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-full lg:w-1/4 xl:w-1/5 p-6 bg-base rounded-xl shadow-lg h-fit sticky top-24">
          <h2 className="text-2xl font-bold mb-6">Filters</h2>
          <FilterContent />
        </aside>

        {/* Mobile Filter Panel */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsFilterOpen(false)}
              aria-hidden="true"
            ></div>
            
            {/* Panel */}
            <div className="fixed top-0 left-0 w-full max-w-xs h-full bg-base shadow-xl p-6 overflow-y-auto animate-slide-in-left">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold">Filters</h2>
                 <button onClick={() => setIsFilterOpen(false)} className="p-2 -mr-2" aria-label="Close filters">
                   <X size={24} />
                 </button>
               </div>
               <FilterContent />
            </div>
          </div>
        )}

        <main className="w-full lg:w-3/4 xl:w-4/5">
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner />
                </div>
            ) : error ? (
                <div className="text-center py-16 bg-red-50 text-red-700 rounded-xl shadow-lg">
                    <h3 className="text-2xl font-bold">An Error Occurred</h3>
                    <p className="mt-2">{error}</p>
                </div>
            ) : filteredProducts.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-base rounded-xl shadow-lg">
                    <h3 className="text-2xl font-bold">No Products Found</h3>
                    <p className="text-text-secondary mt-2">Try adjusting your filters to find what you're looking for.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default ProductsPage;
