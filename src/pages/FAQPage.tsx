

import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

const faqData = [
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and Apple Pay. All transactions are secure and encrypted.'
    },
    {
        question: 'How can I track my order?',
        answer: 'Once your order has shipped, you will receive an email with a tracking number and a link to the carrier\'s website. You can also find your tracking information in the "My Orders" section of your account.'
    },
    {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for most items. The item must be unused, in its original packaging, and in the same condition that you received it. Please visit our Shipping & Returns page for more details.'
    },
    {
        question: 'How long does shipping take?',
        answer: 'Standard shipping typically takes 5-7 business days. We also offer an expedited shipping option which takes 2-3 business days. Processing time is usually 1-2 business days before the order is shipped.'
    },
    {
        question: 'Do you ship internationally?',
        answer: 'Yes, we ship to most countries worldwide. International shipping rates and times vary depending on the destination. Please note that customs fees or import duties are the responsibility of the customer.'
    }
];

const FAQPage: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(0);

    const toggleFAQ = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-primary to-secondary text-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <HelpCircle size={48} className="mx-auto mb-4" />
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Frequently Asked Questions</h1>
                    <p className="max-w-2xl mx-auto text-lg text-indigo-100">
                        Have questions? We have answers. If you can't find what you're looking for, feel free to contact us.
                    </p>
                </div>
            </section>

            {/* FAQ Accordion */}
            <section className="py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
                    <div className="space-y-4">
                        {faqData.map((item, index) => (
                            <div key={index} className="border-b">
                                <button
                                    className="w-full flex justify-between items-center text-left py-4"
                                    onClick={() => toggleFAQ(index)}
                                    aria-expanded={activeIndex === index}
                                >
                                    <h3 className="text-lg font-semibold text-text-primary">{item.question}</h3>
                                    <ChevronDown
                                        className={`transform transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`}
                                        size={24}
                                    />
                                </button>
                                <div
                                    className={`grid transition-all duration-300 ease-in-out ${activeIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                                >
                                    <div className="overflow-hidden">
                                         <p className="pb-4 text-text-secondary">{item.answer}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FAQPage;