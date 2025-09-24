import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { CreditCard, Lock, Truck } from 'lucide-react';
import { formatNaira } from '../utils/formatters';
// FIX: Use firebase v9 compat libraries to support v8 syntax for ServerValue.TIMESTAMP.
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { db } from '../utils/firebase';
import { OrderStatus } from '../types';

const CheckoutPage: React.FC = () => {
  const { cart, subtotal, total, appliedCoupon, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  
  const [shippingInfo, setShippingInfo] = useState({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      address: '',
      city: '',
      state: '',
      zip: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setShippingInfo(prev => ({...prev, [id]: value}));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        alert('You must be logged in to place an order.');
        navigate('/login');
        return;
    }
    setLoading(true);

    try {
        const ordersRef = db.ref('orders');
        const newOrderRef = ordersRef.push();
        const orderPayload = {
            userId: user.id,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            status: OrderStatus.Processing,
            shippingAddress: shippingInfo,
            paymentMethod: paymentMethod,
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.images?.[0] ?? null
            })),
            itemIds: cart.map(item => item.id), // For querying later
            subtotal: subtotal,
            total: total,
            coupon: appliedCoupon ? { code: appliedCoupon.code, discount_value: appliedCoupon.discount_value, discount_type: appliedCoupon.discount_type } : null,
        };
        await newOrderRef.set(orderPayload);

        // TODO: In a real app with transactions, you would decrement product stock here.

        setLoading(false);
        alert('Order placed successfully! (This is a demo)');
        clearCart();
        navigate('/account/orders');
    } catch (error) {
        console.error("Error placing order: ", error);
        alert('There was an error placing your order. Please try again.');
        setLoading(false);
    }
  };
  
  if (cart.length === 0) {
      return (
          <div className="container mx-auto px-4 text-center py-20">
              <h1 className="text-2xl font-bold">Your cart is empty.</h1>
              <p className="text-text-secondary mt-2">Add some items before checking out.</p>
              <Link to="/products"><Button className="mt-4">Go Shopping</Button></Link>
          </div>
      )
  }

  return (
    <div className="bg-neutral min-h-screen py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-center">Checkout</h1>
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping & Payment Details */}
          <div className="lg:col-span-2 bg-base rounded-xl shadow-lg p-8 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField id="firstName" label="First Name" type="text" placeholder="John" value={shippingInfo.firstName} onChange={handleInputChange} required />
                <InputField id="lastName" label="Last Name" type="text" placeholder="Doe" value={shippingInfo.lastName} onChange={handleInputChange} required />
                <InputField id="address" label="Address" type="text" placeholder="123 Main St" containerClassName="md:col-span-2" value={shippingInfo.address} onChange={handleInputChange} required />
                <InputField id="city" label="City" type="text" placeholder="Anytown" value={shippingInfo.city} onChange={handleInputChange} required />
                <InputField id="state" label="State" type="text" placeholder="CA" value={shippingInfo.state} onChange={handleInputChange} required />
                <InputField id="zip" label="ZIP Code" type="text" placeholder="12345" value={shippingInfo.zip} onChange={handleInputChange} required />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Card Payment Option */}
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-slate-400'}`}
                  aria-label="Select card payment"
                  role="radio"
                  aria-checked={paymentMethod === 'card'}
                >
                    <CreditCard size={24} className="text-primary"/>
                    <div>
                        <h3 className="font-bold">Credit/Debit Card</h3>
                        <p className="text-sm text-text-secondary">Secure online payment.</p>
                    </div>
                </div>
                {/* Pay on Delivery Option */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-slate-400'}`}
                  aria-label="Select pay on delivery"
                  role="radio"
                  aria-checked={paymentMethod === 'cod'}
                >
                    <Truck size={24} className="text-primary"/>
                    <div>
                        <h3 className="font-bold">Pay on Delivery</h3>
                        <p className="text-sm text-text-secondary">Pay with cash upon arrival.</p>
                    </div>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-6 animate-fade-in">
                  <InputField id="cardName" label="Name on Card" type="text" placeholder="John M Doe" required={paymentMethod === 'card'} />
                  <InputField id="cardNumber" label="Card Number" type="text" placeholder="•••• •••• •••• ••••" required={paymentMethod === 'card'} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="expiry" label="Expiry Date" type="text" placeholder="MM / YY" required={paymentMethod === 'card'} />
                    <InputField id="cvc" label="CVC" type="text" placeholder="123" required={paymentMethod === 'card'} />
                  </div>
                </div>
              )}
              {paymentMethod === 'cod' && (
                <div className="p-4 bg-neutral rounded-lg text-center animate-fade-in">
                    <p className="text-text-secondary">You will pay the total amount in cash to the delivery person when your order arrives.</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-base rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-2xl font-bold border-b pb-4 mb-4">Order Summary</h2>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={item.images[0]} alt={item.name} className="w-12 h-12 rounded-md object-cover"/>
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-text-secondary">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold">{formatNaira(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-semibold">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="font-semibold text-accent">FREE</span>
                </div>
                 {appliedCoupon && (
                   <div className="flex justify-between text-secondary">
                      <span className="font-semibold">Coupon Discount</span>
                      <span className="font-semibold">-{formatNaira(total - subtotal)}</span>
                    </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t pt-4 mt-4">
                  <span>Total</span>
                  <span>{formatNaira(total)}</span>
                </div>
              </div>
               <Button type="submit" size="lg" className="w-full mt-6 flex items-center justify-center gap-2" disabled={loading}>
                {loading ? 'Placing Order...' : <><Lock size={18}/> Place Order</>}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
