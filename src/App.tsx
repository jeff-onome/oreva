import React from 'react';
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
import { XCircle } from 'lucide-react';
import Button from './components/Button';

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

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, initialLoading, error, logout } = useAuth();

  if (initialLoading) {
    return (
        <div className="flex flex-col justify-center items-center h-screen">
            <Spinner />
            <p className="mt-4 text-text-secondary">Loading your session...</p>
        </div>
    );
  }

  if (error) {
    console.error("Authentication Error in ProtectedRoute:", error);
    const handleLogoutAndRetry = async () => {
        await logout();
        window.location.reload();
    };
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-4 bg-neutral">
          <div className="bg-base p-8 rounded-lg shadow-lg max-w-lg">
              <XCircle size={48} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-red-600 mb-2">Session Error</h2>
              <p className="text-text-secondary mb-4">A problem occurred while loading your user session.</p>
              <p className="text-sm bg-red-50 p-3 rounded-md text-red-800 font-mono text-left">Error: {error}</p>
              <p className="mt-4 text-sm text-text-secondary">
                  This can happen due to a network issue or if your session has expired. Please try logging out to clear your session and start again.
              </p>
              <Button onClick={handleLogoutAndRetry} variant="secondary" className="mt-6">
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