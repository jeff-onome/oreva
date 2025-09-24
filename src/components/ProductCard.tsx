
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import Button from './Button';
import { useCart } from '../context/CartContext';
import { formatNaira } from '../utils/formatters';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const hasStock = product.stock > 0;

  return (
    <div className="bg-base rounded-xl shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col">
      <div className="relative">
        <Link to={`/products/${product.id}`}>
          <img
            src={product.images?.[0] || 'https://picsum.photos/seed/product/800/600'}
            alt={product.name}
            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        {product.sale_price && (
            <div className="absolute top-2 left-2 py-1 px-3 rounded-full text-sm font-semibold text-white bg-secondary">
                SALE
            </div>
        )}
        <div className={`absolute top-2 right-2 py-1 px-3 rounded-full text-sm font-semibold text-white ${hasStock ? 'bg-accent' : 'bg-red-500'}`}>
          {hasStock ? 'In Stock' : 'Out of Stock'}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-text-primary truncate">
          <Link to={`/products/${product.id}`} className="hover:text-primary transition-colors">
            {product.name}
          </Link>
        </h3>
        <p className="text-sm text-text-secondary mt-1">{product.categories?.[0]?.name || 'Uncategorized'}</p>
        <div className="flex items-center mt-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill={i < Math.round(product.rating) ? 'currentColor' : 'none'} />
            ))}
          </div>
          <span className="text-xs text-text-secondary ml-2">({product.reviews} reviews)</span>
        </div>
        <div className="mt-4 flex-grow flex items-end justify-between">
          <div>
            {product.sale_price ? (
              <>
                <p className="text-2xl font-extrabold text-secondary">{formatNaira(product.sale_price)}</p>
                <p className="text-sm text-text-secondary line-through">{formatNaira(product.price)}</p>
              </>
            ) : (
              <p className="text-2xl font-extrabold text-primary">{formatNaira(product.price)}</p>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => addToCart(product, 1)}
            disabled={!hasStock}
            className="disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
