

import React from 'react';
import { Truck, Package, Undo } from 'lucide-react';

const ShippingReturnsPage: React.FC = () => {
    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="bg-neutral">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <Truck size={48} className="mx-auto mb-4 text-primary" />
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Shipping & Returns</h1>
                    <p className="max-w-2xl mx-auto text-lg text-text-secondary">
                        Everything you need to know about how we get our products to you and what to do if you need to send them back.
                    </p>
                </div>
            </section>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Shipping Policy */}
                    <div className="bg-base p-8 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Package className="text-secondary"/> Shipping Policy</h2>
                        <div className="space-y-4 text-text-secondary">
                            <div>
                                <h3 className="font-semibold text-text-primary">Processing Time</h3>
                                <p>Orders are typically processed and shipped within 1-2 business days. You will receive a shipment confirmation email once your order has shipped.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-text-primary">Shipping Rates & Delivery Estimates</h3>
                                <ul className="list-disc list-inside space-y-1 mt-2">
                                    <li><strong>Standard Shipping (5-7 business days):</strong> ₦5,000</li>
                                    <li><strong>Express Shipping (2-3 business days):</strong> ₦10,000</li>
                                    <li><strong>Free Shipping:</strong> Available on all orders over ₦50,000.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-text-primary">Order Tracking</h3>
                                <p>Once your order is shipped, you will receive an email containing your tracking number(s). The tracking number will be active within 24 hours.</p>
                            </div>
                        </div>
                    </div>
                    {/* Return Policy */}
                     <div className="bg-base p-8 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Undo className="text-accent"/> Return Policy</h2>
                        <div className="space-y-4 text-text-secondary">
                             <div>
                                <h3 className="font-semibold text-text-primary">30-Day Returns</h3>
                                <p>We want you to be happy with your purchase! You can return most new, unopened items within 30 days of delivery for a full refund.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-text-primary">Conditions</h3>
                                <p>Items must be returned in their original product packaging, be unused, and include all accessories. We reserve the right to refuse returns that do not meet these conditions.</p>
                            </div>
                             <div>
                                <h3 className="font-semibold text-text-primary">How to Initiate a Return</h3>
                                <p>To start a return, please contact our support team via the Support page in your account or email us at returns@ecom.com with your order number.</p>
                            </div>
                             <div>
                                <h3 className="font-semibold text-text-primary">Refunds</h3>
                                <p>Once we receive and inspect your return, we will process your refund within 5-7 business days. The refund will be applied to your original method of payment.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShippingReturnsPage;