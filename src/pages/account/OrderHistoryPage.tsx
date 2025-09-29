import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Order, OrderStatus } from '../../types';
import { Truck, CheckCircle, Clock, Repeat, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { formatNaira } from '../../utils/formatters';
import { db } from '../../utils/firebase';
import Spinner from '../../components/Spinner';

const getStatusStyles = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Delivered:
            return { icon: <CheckCircle className="text-green-500" />, text: 'text-green-600', bg: 'bg-green-100' };
        case OrderStatus.Shipped:
            return { icon: <Truck className="text-blue-500" />, text: 'text-blue-600', bg: 'bg-blue-100' };
        case OrderStatus.Processing:
            return { icon: <Clock className="text-yellow-500" />, text: 'text-yellow-600', bg: 'bg-yellow-100' };
        default:
            return { icon: <Clock className="text-slate-500" />, text: 'text-slate-600', bg: 'bg-slate-100' };
    }
};

const OrderHistoryPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    
    const fetchOrders = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const ordersRef = db.ref('orders');
            const ordersQuery = ordersRef.orderByChild('userId').equalTo(user.id);
            const snapshot = await ordersQuery.get();
            
            if (snapshot.exists()) {
                const ordersData = snapshot.val();
                const fetchedOrders = Object.entries(ordersData).map(([id, value]) => ({
                    id,
                    ...(value as Omit<Order, 'id'>)
                })).sort((a, b) => b.createdAt - a.createdAt);
                setOrders(fetchedOrders);
            } else {
                setOrders([]);
            }
        } catch (err: any) {
            console.error("Error fetching orders:", err);
            setError("Could not load your orders at this time. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);


    const handleReorder = () => {
        // This is a simplified reorder.
        console.log(`TODO: Re-add products to cart`);
        alert("Re-order functionality is a demo. It would require fetching latest product info.");
    };
    
    if (loading) {
        return <div className="flex justify-center py-10"><Spinner /></div>;
    }

    if (error) {
        return <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Order History</h2>
            {orders.length === 0 ? (
                <div className="text-center py-16 border rounded-lg">
                    <Package size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold">No Orders Yet</h3>
                    <p className="text-text-secondary mt-2">You haven't placed any orders yet. Let's change that!</p>
                    <Button variant="secondary" className="mt-6">
                        <Link to="/products">Start Shopping</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => {
                        const statusStyle = getStatusStyles(order.status);
                        return (
                            <div key={order.id} className="border rounded-lg p-4 transition-shadow hover:shadow-md">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg">Order #{order.id.substring(0,8)}...</h3>
                                        <p className="text-sm text-text-secondary">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mt-2 sm:mt-0 ${statusStyle.bg} ${statusStyle.text}`}>
                                        {statusStyle.icon}
                                        {order.status}
                                    </div>
                                </div>
                                <div className="flex -space-x-4 mb-4">
                                    {order.items.slice(0, 5).map(item => (
                                        <img key={item.id} src={item.image || 'https://picsum.photos/48'} alt={item.name} className="w-12 h-12 object-cover rounded-full border-2 border-white"/>
                                    ))}
                                </div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                    <p className="font-bold text-lg">Total: {formatNaira(order.total)}</p>
                                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                        <Button variant="ghost" size="sm" onClick={handleReorder}>
                                            <Repeat size={16} className="mr-2" />
                                            Reorder
                                        </Button>
                                        <Link 
                                          to={`/account/orders/${order.id}`}
                                          className="text-primary font-semibold hover:underline"
                                        >
                                          View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OrderHistoryPage;