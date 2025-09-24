import React, { useState } from 'react';
import Button from '../../components/Button';
import InputField from '../../components/InputField';
import { LifeBuoy, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
// FIX: Use firebase v9 compat libraries to support v8 syntax for ServerValue.TIMESTAMP.
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { db } from '../../utils/firebase';
import { SupportTicketStatus } from '../../types';

const SupportPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [subject, setSubject] = useState('');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            // FIX: Use v8 Realtime Database syntax instead of Firestore
            await db.ref('supportTickets').push({
                userId: user.id,
                subject,
                details,
                status: SupportTicketStatus.Open,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
            });
            setSubmitted(true);
        } catch(error) {
            showToast('Failed to submit ticket.', 'error');
        }
        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="text-center py-16">
                <CheckCircle size={48} className="mx-auto text-accent mb-4" />
                <h2 className="text-2xl font-bold">Ticket Submitted</h2>
                <p className="text-text-secondary mt-2">Our team will get back to you shortly. Thank you!</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Support & Help Center</h2>
            <div className="bg-primary/5 p-8 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><LifeBuoy size={24} className="text-primary"/> Open a Support Ticket</h3>
                <p className="text-text-secondary mb-6">Have an issue with an order or a question for us? Fill out the form below.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField 
                        id="subject" 
                        label="Subject" 
                        type="text" 
                        placeholder="e.g., Issue with order #ORD001" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required 
                    />
                    <div>
                        <label htmlFor="details" className="block text-sm font-medium text-text-secondary mb-1">Details</label>
                        <textarea 
                            id="details" 
                            rows={6} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary sm:text-sm" 
                            placeholder="Please describe your issue in detail..." 
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            required
                        ></textarea>
                    </div>
                    <Button type="submit" className="flex items-center gap-2" disabled={loading}>
                        {loading ? 'Submitting...' : <><Send size={18}/> Submit Ticket</>}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default SupportPage;