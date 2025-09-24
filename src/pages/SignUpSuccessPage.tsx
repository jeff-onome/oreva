
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import Button from '../components/Button';

const SignUpSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Timer to redirect after 3 seconds
    const redirectTimer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    // Interval to update the countdown display every second
    const countdownInterval = setInterval(() => {
        setCountdown((prevCount) => prevCount > 0 ? prevCount - 1 : 0);
    }, 1000);

    // Cleanup function to clear timers if the component unmounts
    return () => {
      clearTimeout(redirectTimer);
      clearInterval(countdownInterval);
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral">
      <div className="w-full max-w-md p-8 space-y-6 bg-base rounded-xl shadow-lg text-center animate-fade-in">
        <MailCheck size={64} className="mx-auto text-accent mb-4" />
        <h1 className="text-3xl font-extrabold text-text-primary">Account Created!</h1>
        <p className="text-text-secondary mt-2 text-lg">
          We've sent a verification link to your email address. Please check your inbox (and spam folder) to complete your registration.
        </p>
        <div className="pt-4">
            <Link to="/login">
                <Button size="lg">
                    Proceed to Login
                </Button>
            </Link>
        </div>
        <p className="text-sm text-text-secondary pt-4">
            Redirecting to login in {countdown}...
        </p>
      </div>
    </div>
  );
};

export default SignUpSuccessPage;
