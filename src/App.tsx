import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import ThemeManager from './components/ThemeManager';
import Spinner from './components/Spinner';
import { XCircle, Settings } from 'lucide-react';
import Button from './components/Button';
import { supabase } from './utils/supabase';

// Page Imports
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import SignUpSuccessPage from './pages/SignUpSuccessPage';
import PasswordResetPage from './pages/PasswordResetPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import ShippingReturnsPage from './pages/ShippingReturnsPage';

// Account Pages
import AccountLayout from './pages/account/AccountLayout';
import ProfilePage from './pages/account/ProfilePage';
import OrderHistoryPage from './pages/account/OrderHistoryPage';
import AddressesPage from './pages/account/AddressesPage';
import OrderTrackingPage from './pages/account/OrderTrackingPage';
import PaymentMethodsPage from './pages/account/PaymentMethodsPage';
import WishlistPage from './pages/account/WishlistPage';
import ReviewsPage from './pages/account/ReviewsPage';
import NotificationsPage from './pages/account/NotificationsPage';
import SecurityPage from './pages/account/SecurityPage';
import RewardsPage from './pages/account/RewardsPage';
import SupportPage from './pages/account/SupportPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import ProductManagementPage from './pages/admin/ProductManagementPage';
import OrderManagementPage from './pages/admin/OrderManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';
import PromotionsPage from './pages/admin/PromotionsPage';
import SiteSettingsPage from './pages/admin/SiteSettingsPage';
import ReviewManagementPage from './pages/admin/ReviewManagementPage';
import SupportManagementPage from './pages/admin/SupportManagementPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const SupabaseJWTConfigError: React.FC<{ onRetry: () => void; errorDetails: string }> = ({ onRetry, errorDetails }) => {
  return (
    <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-neutral">
      <div className="bg-base p-8 rounded-lg shadow-lg max-w-2xl text-left">
        <div className="flex items-start gap-4">
          <Settings size={48} className="text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Supabase Configuration Required</h2>
            <p className="text-text-secondary mb-4">
              Your Supabase project is not configured to validate authentication tokens from Firebase. This is a one-time setup required in your Supabase dashboard to secure your data.
            </p>
          </div>
        </div>
        
        <div className="mt-4 border-t pt-4">
          <h3 className="font-bold text-lg mb-2">How to Fix:</h3>
          <ol className="list-decimal list-inside space-y-3 text-text-secondary">
            <li>
              Go to your Supabase Project dashboard: <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary underline">supabase.com/dashboard</a>.
            </li>
            <li>
              Navigate to <strong className="text-text-primary">Project Settings</strong> (gear icon), then click <strong className="text-text-primary">Authentication</strong> in the sidebar.
               <p className="text-xs mt-1 bg-neutral p-2 rounded">This takes you to the main Authentication page. <strong className="text-red-600">Stay on this page and scroll down. Do not click on the "Providers" tab.</strong></p>
            </li>
            <li>
              On the main <strong className="text-text-primary">Authentication</strong> page, scroll down to the <strong className="text-text-primary">JWT Settings</strong> section.
            </li>
            <li>
              For the <strong className="text-text-primary">JWT Secret</strong>, you must provide a JSON object telling Supabase where to find Firebase's public keys. <strong>Clear the text box completely</strong> and paste the following JSON:
              <pre className="block bg-neutral px-3 py-2 my-1 rounded text-sm font-mono text-secondary break-all text-left overflow-x-auto">
                <code>
                  {JSON.stringify({ jwks_url: "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com" }, null, 2)}
                </code>
              </pre>
              <p className="text-xs mt-1">This configures Supabase to use the RS256 algorithm required by Firebase.</p>
            </li>
             <li>
              Set the <strong className="text-text-primary">Issuer</strong>. Enter your Firebase project's issuer URL:
              <code className="block bg-neutral px-2 py-1 my-1 rounded text-sm font-mono text-secondary">
                https://securetoken.google.com/ecommerce-e9230
              </code>
            </li>
            <li>
              <span className="font-bold text-red-500">Important:</span> Set the <strong className="text-text-primary">Audiences</strong>. This must contain your Firebase Project ID. Enter the following value:
               <code className="block bg-neutral px-2 py-1 my-1 rounded text-sm font-mono text-secondary">
                ecommerce-e9230
              </code>
            </li>
            <li>
              Once saved, come back here and click the retry button.
            </li>
          </ol>
        </div>
        
        <div className="mt-6 text-center">
          <Button onClick={onRetry} variant="secondary" size="lg">
            I've configured it, Retry Now
          </Button>
        </div>
         <p className="text-xs bg-yellow-50 p-2 mt-4 rounded-md text-yellow-800 font-mono text-left">
            Verification failed with error: {errorDetails}
        </p>
      </div>
    </div>
  );
};


const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, initialLoading, logout } = useAuth();
  const [verificationState, setVerificationState] = useState<'pending' | 'success' | 'failed'>('pending');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    // Only run verification if Firebase auth has loaded and we have a user.
    if (!initialLoading && user) {
      setVerificationState('pending');
      const verifySupabaseConnection = async () => {
        try {
          // Attempt a simple authenticated Supabase operation.
          // Listing files in the user's private folder is a good, low-impact test.
          // It requires the user to be authenticated and for RLS to be working.
          const { error } = await supabase.storage.from('images').list(`profile_pictures/${user.id}`, { limit: 1 });

          // A "404 Not Found" error is acceptable if the folder doesn't exist yet.
          // Any other error, especially related to auth, is a failure.
          if (error && error.message !== 'The resource was not found') {
            throw new Error(error.message);
          }
          setVerificationState('success');
        } catch (err: any) {
          console.error("Supabase verification failed:", err);
          setVerificationError(err.message || 'An unknown error occurred during verification.');
          setVerificationState('failed');
        }
      };
      verifySupabaseConnection();
    }
  }, [user, initialLoading]);


  if (initialLoading || (user && verificationState === 'pending')) {
    return (
        <div className="flex flex-col justify-center items-center h-screen">
            <Spinner />
            <p className="mt-4 text-text-secondary">Verifying your session...</p>
        </div>
    );
  }

  if (verificationState === 'failed' && verificationError) {
     const handleRetry = () => window.location.reload();
     // Check for a common JWT validation error from Supabase (the message might vary)
     if (verificationError.toLowerCase().includes('jwt') || verificationError.toLowerCase().includes('denied') || verificationError.toLowerCase().includes('invalid')) {
        return <SupabaseJWTConfigError onRetry={handleRetry} errorDetails={verificationError} />;
     }
      // Generic error for other issues
      return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-neutral">
          <div className="bg-base p-8 rounded-lg shadow-lg max-w-lg">
              <XCircle size={48} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-red-600 mb-2">Session Error</h2>
              <p className="text-text-secondary mb-4">A problem occurred while verifying your session with our data services.</p>
              <p className="text-sm bg-red-50 p-3 rounded-md text-red-800 font-mono text-left">Error: {verificationError}</p>
              <p className="mt-4 text-sm text-text-secondary">
                  Please try logging out and signing in again.
              </p>
              <Button onClick={async () => { await logout(); window.location.reload(); }} variant="secondary" className="mt-6">
                  Logout & Retry
              </Button>
          </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // If we reach here, Firebase user exists and Supabase verification succeeded.
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <ThemeManager />
        <CartProvider>
          <ToastProvider>
            <HashRouter>
              <div className="flex flex-col min-h-screen bg-neutral text-text-primary">
                <Header />
                <main className="flex-grow">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/signup-success" element={<SignUpSuccessPage />} />
                    <Route path="/password-reset" element={<PasswordResetPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/shipping-returns" element={<ShippingReturnsPage />} />

                    {/* Protected Routes */}
                    <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                    <Route path="/account" element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}>
                      <Route index element={<Navigate to="profile" replace />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="orders" element={<OrderHistoryPage />} />
                      <Route path="orders/:id" element={<OrderTrackingPage />} />
                      <Route path="addresses" element={<AddressesPage />} />
                      <Route path="payment-methods" element={<PaymentMethodsPage />} />
                      <Route path="wishlist" element={<WishlistPage />} />
                      <Route path="reviews" element={<ReviewsPage />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="security" element={<SecurityPage />} />
                      <Route path="rewards" element={<RewardsPage />} />
                      <Route path="support" element={<SupportPage />} />
                    </Route>
                    
                    {/* Admin Routes */}
                    <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminLayout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="products" element={<ProductManagementPage />} />
                        <Route path="categories" element={<CategoryManagementPage />} />
                        <Route path="orders" element={<OrderManagementPage />} />
                        <Route path="orders/:id" element={<OrderTrackingPage />} />
                        <Route path="users" element={<UserManagementPage />} />
                        <Route path="promotions" element={<PromotionsPage />} />
                        <Route path="reviews" element={<ReviewManagementPage />} />
                        <Route path="settings" element={<SiteSettingsPage />} />
                        <Route path="support" element={<SupportManagementPage />} />
                    </Route>
                    
                    {/* Fallback Route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
              </div>
              <Toast />
            </HashRouter>
          </ToastProvider>
        </CartProvider>
      </SiteSettingsProvider>
    </AuthProvider>
  );
}

export default App;