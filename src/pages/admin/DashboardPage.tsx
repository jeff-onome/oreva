import React, { useState, useEffect } from 'react';
import { DollarSign, Users, ShoppingCart, Activity } from 'lucide-react';
import { db } from '../../utils/firebase';
import { Order, Product } from '../../types';
import { formatNaira } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import Spinner from '../../components/Spinner';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-base p-6 rounded-xl shadow-lg flex items-center gap-6">
        <div className={`p-4 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-text-secondary font-medium">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    </div>
);

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, users: 0 });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<Pick<Product, 'id' | 'name' | 'stock'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Fetch stats
                const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
                    db.ref("orders").get(),
                    db.ref("products").get(),
                    db.ref("users").get()
                ]);
                
                const ordersData = ordersSnap.val() || {};
                const totalRevenue = Object.values(ordersData).reduce((sum: number, order: any) => sum + order.total, 0);
                
                setStats({
                    revenue: totalRevenue,
                    orders: ordersSnap.numChildren(),
                    products: productsSnap.numChildren(),
                    users: usersSnap.numChildren(),
                });

                // Fetch recent orders
                const recentOrdersQuery = db.ref('orders').orderByChild('createdAt').limitToLast(5);
                const recentOrdersSnap = await recentOrdersQuery.get();
                const recentOrdersArr = snapshotToArray(recentOrdersSnap).sort((a: any, b: any) => b.createdAt - a.createdAt);
                
                const fetchedOrders = await Promise.all(recentOrdersArr.map(async (orderData: any) => {
                    let userDetails = { first_name: 'N/A', last_name: ''};
                    if (orderData.userId) {
                        const userSnap = await db.ref('users/' + orderData.userId).get();
                        if (userSnap.exists()) {
                            const userData = userSnap.val();
                            userDetails = { first_name: userData.firstName, last_name: userData.lastName };
                        }
                    }
                    return {
                        ...orderData,
                        users: userDetails,
                    } as Order;
                }));
                setRecentOrders(fetchedOrders);


                // Fetch low stock products
                const lowStockQuery = db.ref('products').orderByChild('stock').startAt(1).endAt(10);
                const lowStockSnap = await lowStockQuery.get();
                setLowStockProducts(
                    snapshotToArray(lowStockSnap).map((product: any) => ({
                        id: product.id,
                        name: product.name,
                        stock: product.stock,
                    }))
                );

            } catch (err: any) {
                console.error("Error fetching admin dashboard data:", err);
                setError("Could not load dashboard data. Please try refreshing the page.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);


    if (loading) return <div className="flex justify-center py-10"><Spinner /></div>
    if (error) return <div className="text-center p-6 bg-red-50 text-red-700 rounded-lg">{error}</div>

    return (
        <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={formatNaira(stats.revenue)} icon={<DollarSign className="text-white"/>} color="bg-green-500" />
                <StatCard title="Total Orders" value={stats.orders.toString()} icon={<ShoppingCart className="text-white"/>} color="bg-blue-500" />
                <StatCard title="Total Products" value={stats.products.toString()} icon={<Users className="text-white"/>} color="bg-yellow-500" />
                <StatCard title="Total Users" value={stats.users.toString()} icon={<Activity className="text-white"/>} color="bg-pink-500" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="bg-base p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold text-xl mb-4">Recent Orders</h3>
                    <div className="space-y-4">
                        {recentOrders.length > 0 ? recentOrders.map(order => (
                            <div key={order.id} className="flex justify-between items-center text-sm">
                                <span><Link to={`/admin/orders/${order.id}`} className="text-primary hover:underline">#{order.id.substring(0,6)}...</Link></span>
                                <span>{order.users?.first_name} {order.users?.last_name}</span>
                                <span className="font-semibold">{formatNaira(order.total)}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span>
                            </div>
                        )) : <p>No recent orders.</p>}
                    </div>
                </div>
                 <div className="bg-base p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold text-xl mb-4">Low Stock Products</h3>
                    <div className="space-y-4">
                       {lowStockProducts.length > 0 ? lowStockProducts.map(product => (
                            <div key={product.id} className="flex justify-between items-center text-sm">
                                <span><Link to="/admin/products" className="hover:underline">{product.name}</Link></span>
                                <span className="font-bold text-red-500">{product.stock} left</span>
                            </div>
                       )) : <p>No products are low on stock.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;