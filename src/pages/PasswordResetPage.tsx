

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { Mail } from 'lucide-react';

const PasswordResetPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock password reset logic
        console.log("Password reset request for:", email);
        setSubmitted(true);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral">
            <div className="w-full max-w-md p-8 space-y-6 bg-base rounded-xl shadow-lg animate-fade-in">
                {submitted ? (
                    <div className="text-center">
                        <Mail size={48} className="mx-auto text-accent mb-4" />
                        <h1 className="text-2xl font-bold">Check Your Email</h1>
                        <p className="text-text-secondary mt-2">If an account with that email exists, we've sent instructions to reset your password.</p>
                        <Link to="/login"><Button className="mt-6">Back to Login</Button></Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold text-text-primary">Forgot Password?</h1>
                            <p className="text-text-secondary mt-2">No problem! Enter your email and we'll send you a reset link.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <InputField
                                id="email"
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                            <Button type="submit" className="w-full flex justify-center items-center gap-2" size="lg">
                                <Mail size={20} /> Send Reset Link
                            </Button>
                        </form>
                        <p className="text-center text-sm text-text-secondary">
                            Remember your password?{' '}
                            <Link to="/login" className="font-medium text-primary hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default PasswordResetPage;