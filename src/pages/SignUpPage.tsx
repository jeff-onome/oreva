import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

const SignUpPage: React.FC = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState(''); // For local validation like password match
    const { signUp, loading, error: authError, clearError } = useAuth();
    const navigate = useNavigate();
    const { settings } = useSiteSettings();
    const siteName = settings.site_name?.name || 'ORESKY';

    // Clear context errors on mount
    useEffect(() => {
      clearError();
    }, [clearError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Clear previous errors
        setLocalError('');
        clearError();

        if (password !== confirmPassword) {
            setLocalError("Passwords do not match.");
            return;
        }
        
        const { success } = await signUp({
            email,
            password,
            options: {
                data: {
                    firstName,
                    lastName,
                    phone,
                    country
                }
            }
        });

        if (success) {
            navigate('/signup-success');
        }
    };
    
    const displayError = localError || authError;

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral py-12">
            <div className="w-full max-w-lg p-8 space-y-6 bg-base rounded-xl shadow-lg animate-fade-in">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-text-primary">Create an Account</h1>
                    <p className="text-text-secondary mt-2">Join the {siteName} family!</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {displayError && <p className="text-red-500 bg-red-100 p-3 rounded-md text-center">{displayError}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            id="firstName"
                            label="First Name"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            required
                        />
                         <InputField
                            id="lastName"
                            label="Last Name"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            required
                        />
                    </div>
                    <InputField
                        id="email"
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            id="phone"
                            label="Phone Number"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            required
                        />
                         <div>
                            <label htmlFor="country" className="block text-sm font-medium text-text-secondary mb-1">Country</label>
                            <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary sm:text-sm">
                                <option value="">Select Country</option>
                                <option value="United States">United States</option>
                                <option value="Canada">Canada</option>
                                <option value="Nigeria">Nigeria</option>
                                <option value="United Kingdom">United Kingdom</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            id="password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        <InputField
                            id="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full flex justify-center items-center gap-2" size="lg" disabled={loading}>
                        {loading ? 'Creating Account...' : <><UserPlus size={20} /> Create Account</>}
                    </Button>
                </form>
                <p className="text-center text-sm text-text-secondary">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignUpPage;
