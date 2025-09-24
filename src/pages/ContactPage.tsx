import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { useSiteSettings } from '../context/SiteSettingsContext';

const ContactPage: React.FC = () => {
    const [formState, setFormState] = useState({ name: '', email: '', message: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { settings } = useSiteSettings();
    const contact = settings.contact_info;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormState(prevState => ({ ...prevState, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formState);
        setIsSubmitted(true);
        // Here you would typically send the data to a backend server
    };

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-primary to-secondary text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
                    <Mail size={48} className="mx-auto mb-4" />
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4">Contact Us</h1>
                    <p className="max-w-3xl mx-auto text-base md:text-lg text-indigo-100">
                        Have a question or feedback? We'd love to hear from you. Reach out and we'll get back to you as soon as possible.
                    </p>
                </div>
            </section>

            {/* Contact Form and Info Section */}
            <section className="py-16 bg-neutral">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-base rounded-2xl shadow-2xl overflow-hidden lg:grid lg:grid-cols-2 lg:gap-x-12">
                        {/* Contact Information */}
                        <div className="p-8 md:p-12 bg-primary/5">
                            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">Get in Touch</h2>
                            <p className="text-text-secondary text-lg mb-8">
                                Use the form to send us a message, or contact us directly using the information below.
                            </p>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <MapPin size={24} className="text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-lg">Our Address</h3>
                                        <p className="text-text-secondary">{contact?.address || 'Loading...'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Phone size={24} className="text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-lg">Call Us</h3>
                                        <p className="text-text-secondary">{contact?.phone || 'Loading...'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Mail size={24} className="text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-lg">Email Us</h3>
                                        <p className="text-text-secondary">{contact?.email || 'Loading...'}</p>
                                    </div>
                                </div>
                            </div>
                             <div className="mt-8 pt-8 border-t border-slate-200">
                                <h3 className="font-semibold text-lg mb-2">Business Hours</h3>
                                <p className="text-text-secondary">{contact?.hours || 'Loading...'}</p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="p-8 md:p-12">
                            {isSubmitted ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <CheckCircle size={64} className="text-accent mb-4" />
                                    <h2 className="text-2xl font-bold">Thank You!</h2>
                                    <p className="text-text-secondary mt-2">Your message has been sent successfully. We'll get back to you shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <InputField
                                        id="name"
                                        label="Full Name"
                                        type="text"
                                        placeholder="John Doe"
                                        value={formState.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <InputField
                                        id="email"
                                        label="Email Address"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formState.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-1">
                                            Message
                                        </label>
                                        <textarea
                                            id="message"
                                            rows={5}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary sm:text-sm"
                                            placeholder="How can we help you?"
                                            value={formState.message}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" size="lg" className="w-full flex items-center justify-center gap-2">
                                        <Send size={18} /> Send Message
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;
