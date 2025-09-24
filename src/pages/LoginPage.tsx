import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { LogIn } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const siteName = settings.site_name?.name || 'ORESKY';

  useEffect(() => {
    if (user) {
      if (user.isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
    }
  }, [user, navigate]);

  // Clear any previous auth errors when the component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) clearError(); // Clear error as soon as user starts typing again
    setter(e.target.value);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral">
      <div className="w-full max-w-md p-8 space-y-6 bg-base rounded-xl shadow-lg animate-fade-in">
        <div className="text-center">
            <h1 className="text-3xl font-extrabold text-text-primary">Welcome Back!</h1>
            <p className="text-text-secondary mt-2">Sign in to continue to {siteName}.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-500 bg-red-100 p-3 rounded-md text-center">{error}</p>}
          <InputField
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={handleInputChange(setEmail)}
            placeholder="you@example.com"
            required
          />
          <InputField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={handleInputChange(setPassword)}
            placeholder="••••••••"
            required
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded" />
              <span className="ml-2 text-sm text-text-secondary">Remember me</span>
            </label>
            <Link to="/password-reset" className="text-sm font-medium text-primary hover:underline">
              Forgot your password?
            </Link>
          </div>
          <Button type="submit" className="w-full flex justify-center items-center gap-2" size="lg" disabled={loading}>
            {loading ? 'Signing In...' : <><LogIn size={20}/> Sign In</>}
          </Button>
        </form>
        <p className="text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
