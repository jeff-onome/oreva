import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../components/Button';
import { Plus, MapPin, Edit, Trash2, X, Loader2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
// FIX: Use firebase v9 compat libraries to support v8 syntax for ServerValue.TIMESTAMP.
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { db } from '../../utils/firebase';
import { Address } from '../../types';
import InputField from '../../components/InputField';
import Skeleton from '../../components/Skeleton';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};


const AddressModal: React.FC<{ address: Partial<Address> | null; onClose: () => void; onSave: () => void; }> = ({ address, onClose, onSave }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        zip: address?.zip || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        setIsSubmitting(true);

        try {
            // FIX: Use v8 Realtime Database syntax instead of Firestore
            const addressesRef = db.ref(`users/${user.id}/addresses`);
            if (address?.id) { // Editing
                await addressesRef.child(address.id).update(formData);
                showToast('Address updated!', 'success');
            } else { // Creating a new one
                const newAddressPayload = { 
                    ...formData, 
                    userId: user.id, 
                    is_default: false, // New addresses are not default
                    createdAt: firebase.database.ServerValue.TIMESTAMP 
                };
                await addressesRef.push(newAddressPayload);
                showToast('Address added!', 'success');
            }
            onSave();
            onClose();
        } catch(error) {
            showToast('Failed to save address.', 'error');
        }
        setIsSubmitting(false);
    }
    
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-base rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">{address?.id ? 'Edit Address' : 'Add New Address'}</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <InputField id="street" label="Street Address" value={formData.street} onChange={handleChange} required/>
                    <InputField id="city" label="City" value={formData.city} onChange={handleChange} required/>
                    <InputField id="state" label="State / Province" value={formData.state} onChange={handleChange} required/>
                    <InputField id="zip" label="ZIP / Postal Code" value={formData.zip} onChange={handleChange} required/>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin"/> : 'Save Address'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddressesPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const fetchAddresses = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // FIX: Use v8 Realtime Database syntax instead of Firestore
            const addressesRef = db.ref(`users/${user.id}/addresses`);
            const q = addressesRef.orderByChild('createdAt');
            const snapshot = await q.get();
            const addressesData = snapshotToArray(snapshot).sort((a: any, b: any) => b.createdAt - a.createdAt);
            setAddresses(addressesData as Address[]);
        } catch (error) {
            showToast('Could not load addresses', 'error');
        }
        setLoading(false);
    }, [user, showToast]);
    
    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleAdd = () => {
        setEditingAddress(null);
        setIsModalOpen(true);
    };

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setIsModalOpen(true);
    };

    const handleDelete = async (addressId: string) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            if(!user) return;
            try {
                 // FIX: Use v8 Realtime Database syntax instead of Firestore
                await db.ref(`users/${user.id}/addresses/${addressId}`).remove();
                showToast('Address deleted', 'success');
                fetchAddresses();
            } catch(error) {
                 showToast('Failed to delete address', 'error');
            }
        }
    };
    
    const handleSetDefault = async (addressId: string) => {
        if(!user) return;
        try {
            // FIX: Use v8 Realtime Database multi-path update instead of Firestore Batch
            const addressesRef = db.ref(`users/${user.id}/addresses`);
            const snapshot = await addressesRef.get();
            
            if (snapshot.exists()) {
                const updates: { [key: string]: any } = {};
                snapshot.forEach((childSnapshot) => {
                    updates[`/users/${user.id}/addresses/${childSnapshot.key}/is_default`] = false;
                });
                updates[`/users/${user.id}/addresses/${addressId}/is_default`] = true;
                await db.ref().update(updates);
                showToast('Default address updated!', 'success');
                fetchAddresses();
            }
        } catch (error) {
            showToast('Failed to update default address.', 'error');
            console.error('Set default error:', error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">My Addresses</h2>
                <Button variant="secondary" size="sm" className="flex items-center gap-2" onClick={handleAdd}>
                    <Plus size={16} /> Add New Address
                </Button>
            </div>
            {loading ? (
                 <div className="space-y-4 animate-pulse">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg flex justify-between items-center gap-4">
                            <div>
                                <Skeleton className="h-5 w-48 mb-2" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <Skeleton className="w-8 h-8 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : addresses.length === 0 ? (
                <div className="text-center py-16 border rounded-lg">
                    <MapPin size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold">No Saved Addresses</h3>
                    <p className="text-text-secondary mt-2">Add a new address to get started with faster checkouts.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {addresses.map((address) => (
                        <div key={address.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <address className="not-italic">
                                <p className="font-semibold">{address.street}</p>
                                <p className="text-text-secondary">{`${address.city}, ${address.state} ${address.zip}`}</p>
                            </address>
                            <div className="flex items-center gap-4 flex-shrink-0">
                                {address.is_default ? (
                                    <span className="text-xs font-bold uppercase text-accent bg-accent/10 px-2 py-1 rounded-full flex items-center gap-1">
                                        <Check size={14}/> Default
                                    </span>
                                ) : (
                                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(address.id)}>Set as Default</Button>
                                )}
                                <button onClick={() => handleEdit(address)} className="p-2 text-primary hover:bg-neutral rounded-full"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(address.id)} className="p-2 text-red-500 hover:bg-neutral rounded-full"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {isModalOpen && (
                <AddressModal 
                    address={editingAddress}
                    onClose={() => setIsModalOpen(false)} 
                    onSave={fetchAddresses} 
                />
            )}
        </div>
    );
};

export default AddressesPage;