import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../utils/firebase';
import { Order, OrderStatus } from '../../types';
import { formatNaira } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';
import Skeleton from '../../components/Skeleton';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};

const OrderManagementPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
        const ordersQuery = db.ref('orders').orderByChild('createdAt');
        const ordersSnap = await ordersQuery.get();
        const ordersArray = snapshotToArray(ordersSnap).sort((a: any, b: any) => b.createdAt - a.createdAt);

        const fetchedOrders = await Promise.all(ordersArray.map(async (orderData: any) => {
            let userDetails: any = { first_name: "Guest", last_name: "User" };
            if (orderData.userId) {
                const userRef = db.ref('users/' + orderData.userId);
                const userSnap = await userRef.get();
                if (userSnap.exists()) {
                    userDetails = { first_name: userSnap.val().firstName, last_name: userSnap.val().lastName, email: userSnap.val().email };
                }
            }
            return {
                ...orderData,
                users: userDetails
            } as Order;
        }));
        setOrders(fetchedOrders);
    } catch (error) {
        showToast('Failed to fetch orders', 'error');
        console.error(error);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
        await db.ref('orders/' + orderId).update({ status: newStatus });
        showToast('Order status updated successfully', 'success');
        fetchOrders(); // Refresh the list
    } catch (error) {
        showToast(`Failed to update order`, 'error');
    }
  };


  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Manage Orders</h2>
      <div className="bg-base overflow-x-auto rounded-lg shadow">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Order ID</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Customer</th>
                <th scope="col" className="px-6 py-3">Total</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                    <tr key={i} className="bg-white border-b animate-pulse">
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-28" /></td>
                        <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    </tr>
                ))
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      #{order.id.substring(0,8)}...
                    </th>
                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {order.users ? `${order.users.first_name} ${order.users.last_name}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-semibold">{formatNaira(order.total)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="p-1 rounded-md border-gray-300 text-xs focus:ring-primary focus:border-primary"
                      >
                        {Object.values(OrderStatus).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">View Details</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>
    </div>
  );
};

export default OrderManagementPage;