import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Trash2, Loader2 } from 'lucide-react';
import Button from '../../components/Button';
import InputField from '../../components/InputField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
// FIX: Use firebase v9 compat libraries to support v8 syntax for ServerValue.TIMESTAMP.
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { db } from '../../utils/firebase';
import { PaymentMethod } from '../../types';

const snapshotToArray = (snapshot: any) => {
    const data = snapshot.val();
    if (data) {
        return Object.entries(data).map(([id, value]) => ({ ...(value as object), id }));
    }
    return [];
};


const visaIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" fill="#4285F4"/>
        <path d="M7 15h1.5l1-4.5h-1.5z" fill="#FFFFFF"/>
        <path d="M15.5 15H17l-1.5-6h-1.5z" fill="#F4B400"/>
    </svg>
);
const mastercardIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="12" r="6" fill="#EA4335"/>
        <circle cx="14" cy="12" r="6" fill="#F4B400" opacity="0.8"/>
    </svg>
);

const PaymentMethodModal: React.FC<{ onClose: () => void; onSave: () => void; }> = ({ onClose, onSave }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        setIsSubmitting(true);
        const formData = new FormData(e.target as HTMLFormElement);
        const cardNumber = (formData.get('cardNumber') as string).replace(/\s/g, '');

        const payload = {
            card_type: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
            last4: cardNumber.slice(-4),
            expiry_month: parseInt((formData.get('expiry') as string).split('/')[0].trim()),
            expiry_year: 2000 + parseInt((formData.get('expiry') as string).split('/')[1].trim()),
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        try {
            await db.ref(`users/${user.id}/paymentMethods`).push(payload);
            showToast('Payment method saved!', 'success');
            onSave();
            onClose();
        } catch (error) {
            showToast('Failed to save card.', 'error');
        }
        setIsSubmitting(false);
    }
    
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-base rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">Add New Card</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <InputField id="cardName" name="cardName" label="Name on Card" required />
                    <InputField id="cardNumber" name="cardNumber" label="Card Number" placeholder="•••• •••• •••• ••••" required />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField id="expiry" name="expiry" label="Expiry (MM/YY)" placeholder="MM / YY" required />
                        <InputField id="cvc" name="cvc" label="CVC" placeholder="123" required />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Card'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PaymentMethodsPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const fetchPaymentMethods = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const methodsRef = db.ref(`users/${user.id}/paymentMethods`);
            const q = methodsRef.orderByChild('createdAt');
            const snapshot = await q.get();
            setPaymentMethods(snapshotToArray(snapshot) as PaymentMethod[]);
        } catch (error) {
            showToast('Could not load payment methods', 'error');
        }
        setLoading(false);
    }, [user, showToast]);
    
    useEffect(() => {
        fetchPaymentMethods();
    }, [fetchPaymentMethods]);
    
    const handleDelete = async (methodId: string) => {
        if (window.confirm('Are you sure you want to delete this card?')) {
            if(!user) return;
            try {
                await db.ref(`users/${user.id}/paymentMethods/${methodId}`).remove();
                showToast('Card deleted', 'success');
                fetchPaymentMethods();
            } catch(error) {
                 showToast('Failed to delete card', 'error');
            }
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Payment Methods</h2>
                <Button variant="secondary" size="sm" className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} /> Add Card
                </Button>
            </div>
            {loading ? <p>Loading cards...</p> : (
                paymentMethods.length === 0 ? (
                    <p>No payment methods saved.</p>
                ) : (
                    <div className="space-y-4">
                        {paymentMethods.map(method => (
                            <div key={method.id} className="p-4 border rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {method.card_type === 'Visa' ? visaIcon : mastercardIcon}
                                    <div>
                                        <p className="font-semibold">{method.card_type} ending in {method.last4}</p>
                                        <p className="text-sm text-text-secondary">Expires {String(method.expiry_month).padStart(2,'0')}/{String(method.expiry_year).slice(-2)}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(method.id)} className="p-2 text-red-500 hover:bg-neutral rounded-full"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                )
            )}
            {isModalOpen && <PaymentMethodModal onClose={() => setIsModalOpen(false)} onSave={fetchPaymentMethods} />}
        </div>
    );
};

export default PaymentMethodsPage;