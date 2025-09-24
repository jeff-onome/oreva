import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Order, OrderStatus, OrderItem } from '../../types';
import { Package, Truck, Home, CreditCard, User, MapPin, Calendar, Hash } from 'lucide-react';
import { db } from '../../utils/firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatNaira } from '../../utils/formatters';
import Spinner from '../../components/Spinner';

const OrderTrackingPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchOrder = useCallback(async () => {
        if (!id || !user) return;
        setLoading(true);

        try {
            const orderRef = db.ref('orders/' + id);
            const orderSnap = await orderRef.get();

            if (!orderSnap.exists() || (orderSnap.val().userId !== user.id && !user.isAdmin)) {
                showToast('Order not found or you do not have permission to view it.', 'error');
                navigate('/account/orders');
                return;
            }

            const orderData = orderSnap.val();
            setOrder({
                id: orderSnap.key!,
                ...orderData,
            } as Order);

        } catch (err) {
            console.error("Error fetching order:", err);
            showToast('Failed to load order details.', 'error');
        } finally {
            setLoading(false);
        }
      }, [id, user, navigate, showToast]);

    useEffect(() => {
      fetchOrder();
    }, [fetchOrder]);

    const handleStatusChange = async (newStatus: OrderStatus) => {
        if (!order) return;
        setIsUpdating(true);
        const orderRef = db.ref('orders/' + order.id);
        try {
            await orderRef.update({ status: newStatus });
            showToast('Order status updated successfully', 'success');
            setOrder({ ...order, status: newStatus }); // Optimistic update
        } catch (error) {
             showToast('Failed to update order status.', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
      return <div className="flex justify-center py-20"><Spinner /></div>;
    }

    if (!order) {
        return <div className="text-center py-20">Order not found.</div>;
    }
    
    const trackingSteps = [
      { status: OrderStatus.Processing, label: 'Order Placed', icon: <Package/> },
      { status: OrderStatus.Shipped, label: 'Shipped', icon: <Truck/> },
      { status: OrderStatus.Delivered, label: 'Delivered', icon: <Home/> },
    ];
    
    const currentStatus = order.status === OrderStatus.Pending ? OrderStatus.Processing : order.status;
    let currentStepIndex = trackingSteps.findIndex(step => step.status === currentStatus);
    if(order.status === OrderStatus.Cancelled) currentStepIndex = -1;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-6">
                <Link to={user?.isAdmin ? "/admin/orders" : "/account/orders"} className="text-primary hover:underline font-semibold">&larr; Back to Orders</Link>
                <span className="text-sm text-text-secondary">Order placed on {new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <h1 className="text-3xl font-bold mb-4">Order Details</h1>
            <h2 className="text-lg text-text-secondary mb-8">Order ID: <span className="font-mono">{order.id}</span></h2>

             {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left/Main Column */}
                <div className="lg:col-span-2 space-y-8">
                     {/* Status Tracking */}
                     {order.status !== OrderStatus.Cancelled && !user?.isAdmin && (
                         <div className="p-6 bg-base rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold mb-6">Order Status</h3>
                            <div className="flex justify-between items-start relative">
                                <div className="absolute left-0 top-6 w-full h-1 bg-slate-200 -translate-y-1/2">
                                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(currentStepIndex / (trackingSteps.length - 1)) * 100}%` }}></div>
                                </div>
                                {trackingSteps.map((step, index) => {
                                    const isCompleted = index <= currentStepIndex;
                                    return (
                                        <div key={step.status} className="z-10 text-center w-1/3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto transition-colors duration-300 ${isCompleted ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                                               {step.icon}
                                            </div>
                                            <p className={`mt-2 font-semibold ${isCompleted ? 'text-primary' : 'text-slate-500'}`}>{step.label}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {/* Order Items */}
                    <div className="p-6 bg-base rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold mb-4">Items in this order ({order.items.length})</h3>
                        <div className="space-y-4">
                            {order.items.map((item: OrderItem) => (
                                <div key={item.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                                <img src={item.image || 'https://picsum.photos/64'} alt={item.name} className="w-16 h-16 rounded-md object-cover"/>
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-text-secondary">Qty: {item.quantity} &times; {formatNaira(item.price)}</p>
                                </div>
                                <p className="font-semibold">{formatNaira(item.price * item.quantity)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right/Sidebar Column */}
                <div className="space-y-8">
                     {/* Order Summary */}
                    <div className="p-6 bg-base rounded-xl shadow-lg space-y-4">
                         <h3 className="text-xl font-bold border-b pb-3 mb-3">Order Summary</h3>
                         <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-2"><Hash size={16}/> Order Status</span>
                            {user?.isAdmin ? (
                                <select
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                                    className="p-1 rounded-md border-gray-300 text-sm focus:ring-primary focus:border-primary"
                                    disabled={isUpdating}
                                >
                                    {Object.values(OrderStatus).map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="font-semibold text-primary">{order.status}</span>
                            )}
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-2"><CreditCard size={16}/> Payment Method</span>
                            <span className="capitalize">{order.paymentMethod}</span>
                         </div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-2"><Calendar size={16}/> Date Placed</span>
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                         </div>
                    </div>
                     {/* Totals */}
                    <div className="p-6 bg-base rounded-xl shadow-lg space-y-3">
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Subtotal</span>
                            <span className="font-semibold">{formatNaira(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Shipping</span>
                            <span className="font-semibold text-accent">FREE</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold border-t pt-3 mt-2">
                            <span>Total</span>
                            <span>{formatNaira(order.total)}</span>
                        </div>
                    </div>
                     {/* Customer & Shipping */}
                     <div className="p-6 bg-base rounded-xl shadow-lg space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2"><User size={20}/> Customer</h3>
                        <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                        <div className="border-t pt-4 mt-4">
                            <h3 className="text-xl font-bold flex items-center gap-2"><MapPin size={20}/> Shipping Address</h3>
                            <address className="not-italic mt-2">
                                <p>{order.shippingAddress.address}</p>
                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                            </address>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTrackingPage;