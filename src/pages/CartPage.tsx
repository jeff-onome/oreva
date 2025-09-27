
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Button from '../components/Button';
import { Trash2, Plus, Minus, ShoppingCart, Tag } from 'lucide-react';
import { formatNaira } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, subtotal, itemCount, discount, total, applyCoupon, appliedCoupon } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const { showToast } = useToast();

  const handleApplyCoupon = async () => {
    if(!couponCode) return;
    const { success, message } = await applyCoupon(couponCode);
    showToast(message, success ? 'success' : 'error');
  };

  if (itemCount === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingCart size={64} className="mx-auto text-slate-300 mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Your Cart is Empty</h1>
        <p className="text-text-secondary mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Button>
          <Link to="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-neutral min-h-screen py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-center">Your Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-base rounded-xl shadow-lg p-6 space-y-6">
            {cart.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 border-b pb-6 last:border-b-0">
                <img src={item.images?.[0] || 'https://picsum.photos/seed/cartitem/200'} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
                <div className="flex-grow text-center sm:text-left">
                  <h2 className="text-lg font-bold">{item.name}</h2>
                  <p className="text-sm text-text-secondary">{item.categories[0]?.name}</p>
                  <p className="text-primary font-semibold mt-1">{formatNaira(item.price)}</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center border border-slate-300 rounded-lg">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 text-text-secondary hover:bg-neutral rounded-l-lg"><Minus size={16} /></button>
                    <span className="px-3 font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 text-text-secondary hover:bg-neutral rounded-r-lg"><Plus size={16} /></button>
                  </div>
                  <p className="font-bold w-28 text-center">{formatNaira(item.price * item.quantity)}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-base rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-2xl font-bold border-b pb-4 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal ({itemCount} items)</span>
                  <span className="font-semibold">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="font-semibold text-accent">FREE</span>
                </div>
                {appliedCoupon && (
                   <div className="flex justify-between text-secondary">
                      <span className="font-semibold flex items-center gap-1"><Tag size={14}/> {appliedCoupon.code}</span>
                      <span className="font-semibold">-{formatNaira(discount)}</span>
                    </div>
                )}
                 <div className="flex justify-between text-xl font-bold border-t pt-4 mt-4">
                  <span>Total</span>
                  <span>{formatNaira(total)}</span>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                 <div className="flex gap-2">
                    <input type="text" placeholder="Coupon Code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary sm:text-sm"/>
                    <Button variant="outline" onClick={handleApplyCoupon}>Apply</Button>
                 </div>
              </div>
              <Link to="/checkout">
                <Button size="md" className="w-full mt-6">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
