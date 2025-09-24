import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';
import { CartItem, Product, Coupon } from '../types';
import { db } from '../utils/firebase';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string; }>;
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon: Coupon | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const addToCart = useCallback((product: Product, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return prevCart.filter(item => item.id !== productId);
      }
      return prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    try {
      const couponsRef = db.ref('coupons');
      const q = couponsRef.orderByChild('code').equalTo(code.toUpperCase());
      const snapshot = await q.get();

      if (!snapshot.exists()) {
        setAppliedCoupon(null);
        return { success: false, message: 'Invalid coupon code.' };
      }
      
      const couponsData = snapshot.val();
      const couponId = Object.keys(couponsData)[0];
      const data = { id: couponId, ...couponsData[couponId] } as Coupon;
      
      if (!data.is_active) {
        setAppliedCoupon(null);
        return { success: false, message: 'This coupon is no longer active.' };
      }
      setAppliedCoupon(data);
      return { success: true, message: `Coupon "${data.code}" applied!` };
    } catch (error) {
       setAppliedCoupon(null);
       return { success: false, message: 'Could not validate coupon.' };
    }
  }, []);


  const itemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percentage') {
      return subtotal * (appliedCoupon.discount_value / 100);
    }
    if (appliedCoupon.discount_type === 'fixed') {
      return appliedCoupon.discount_value;
    }
    return 0;
  }, [subtotal, appliedCoupon]);
  
  const total = useMemo(() => {
      const finalTotal = subtotal - discount;
      return finalTotal > 0 ? finalTotal : 0;
  }, [subtotal, discount]);


  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    itemCount,
    subtotal,
    discount,
    total,
    appliedCoupon
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, applyCoupon, itemCount, subtotal, discount, total, appliedCoupon]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
