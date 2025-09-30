import React, { useState, useEffect, useCallback } from 'react';
// FIX: Use firebase v9 compat libraries to support v8 syntax for ServerValue.TIMESTAMP.
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { db } from '../../utils/firebase';
import { Coupon } from '../../types';
import Button from '../../components/Button';
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import InputField from '../../components/InputField';
import Skeleton from '../../components/Skeleton';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};

const PromotionsPage: React.FC = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const { showToast } = useToast();

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const q = db.ref('coupons').orderByChild('createdAt');
            const snapshot = await q.get();
            const couponsArray = snapshotToArray(snapshot).sort((a: any, b: any) => b.createdAt - a.createdAt);
            setCoupons(couponsArray as Coupon[]);
        } catch (error) {
            showToast('Error fetching coupons', 'error');
        }
        setLoading(false);
    }, [showToast]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const handleAddCoupon = () => {
        setEditingCoupon(null);
        setIsModalOpen(true);
    };

    const handleEditCoupon = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setIsModalOpen(true);
    };

    const handleDeleteCoupon = async (couponId: string) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                await db.ref('coupons/' + couponId).remove();
                showToast('Coupon deleted successfully', 'success');
                fetchCoupons();
            } catch (error) {
                showToast('Error deleting coupon', 'error');
            }
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-center sm:text-left">Promotions & Coupons</h2>
                <Button variant="secondary" className="flex items-center justify-center gap-2 w-full sm:w-auto" onClick={handleAddCoupon}>
                    <Plus size={18} /> Create Coupon
                </Button>
            </div>
            <div className="bg-base overflow-x-auto rounded-lg shadow">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Code</th>
                            <th scope="col" className="px-6 py-3">Type</th>
                            <th scope="col" className="px-6 py-3">Value</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <tr key={i} className="bg-white border-b animate-pulse">
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Skeleton className="w-8 h-8 rounded-full" />
                                            <Skeleton className="w-8 h-8 rounded-full" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            coupons.map(coupon => (
                                <tr key={coupon.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono font-medium text-gray-900">{coupon.code}</td>
                                    <td className="px-6 py-4 capitalize">{coupon.discount_type}</td>
                                    <td className="px-6 py-4">{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₦${coupon.discount_value}`}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                            {coupon.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEditCoupon(coupon)} className="p-2 text-primary hover:bg-neutral rounded-full"><Edit size={16} /></button>
                                        <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 text-red-500 hover:bg-neutral rounded-full"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <CouponModal 
                    coupon={editingCoupon} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={fetchCoupons} 
                />
            )}
        </div>
    );
};

// Coupon Modal Form Component
const CouponModal: React.FC<{ coupon: Coupon | null, onClose: () => void, onSave: () => void }> = ({ coupon, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        code: coupon?.code || '',
        discount_type: coupon?.discount_type || 'percentage',
        discount_value: coupon?.discount_value || 0,
        is_active: coupon?.is_active !== undefined ? coupon.is_active : true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: string | number | boolean = value;
        if (type === 'checkbox') {
             processedValue = (e.target as HTMLInputElement).checked;
        } else if (name === 'discount_value') {
            processedValue = parseFloat(value);
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = { ...formData, createdAt: firebase.database.ServerValue.TIMESTAMP };

        try {
            if (coupon) {
                await db.ref('coupons/' + coupon.id).update(payload);
                showToast('Coupon updated successfully', 'success');
            } else {
                await db.ref('coupons').push(payload);
                showToast('Coupon created successfully', 'success');
            }
            onSave();
            onClose();
        } catch (error) {
            showToast('Error saving coupon', 'error');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-base rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">{coupon ? 'Edit Coupon' : 'Add New Coupon'}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <InputField id="code" name="code" label="Coupon Code" value={formData.code} onChange={handleInputChange} required />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Discount Type</label>
                            <select name="discount_type" value={formData.discount_type} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary sm:text-sm">
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed Amount</option>
                            </select>
                        </div>
                        <InputField id="discount_value" name="discount_value" label="Value" type="number" value={String(formData.discount_value)} onChange={handleInputChange} required />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded" />
                        <label htmlFor="is_active" className="text-sm font-medium text-text-secondary">Is Active</label>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Coupon'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromotionsPage;