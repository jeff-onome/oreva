
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { User, Package, MapPin, CreditCard, Heart, Star, Bell, Shield, Gift, LifeBuoy, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-md font-medium transition-colors ${isActive ? 'bg-primary text-white shadow' : 'hover:bg-neutral'}`;

const AccountNavMenu: React.FC<{ onLinkClick?: () => void }> = ({ onLinkClick }) => (
    <nav className="space-y-1">
        <NavLink to="profile" className={navLinkClass} onClick={onLinkClick}>
            <User size={20} /> Profile
        </NavLink>
        <NavLink to="addresses" className={navLinkClass} onClick={onLinkClick}>
            <MapPin size={20} /> Addresses
        </NavLink>
        <NavLink to="payment-methods" className={navLinkClass} onClick={onLinkClick}>
            <CreditCard size={20} /> Payment
        </NavLink>
        <NavLink to="security" className={navLinkClass} onClick={onLinkClick}>
            <Shield size={20} /> Security
        </NavLink>

        <div className="pt-4 mt-2 border-t">
             <NavLink to="orders" className={navLinkClass} onClick={onLinkClick}>
                <Package size={20} /> Orders
            </NavLink>
            <NavLink to="wishlist" className={navLinkClass} onClick={onLinkClick}>
                <Heart size={20} /> Wishlist
            </NavLink>
             <NavLink to="reviews" className={navLinkClass} onClick={onLinkClick}>
                <Star size={20} /> My Reviews
            </NavLink>
        </div>
        
        <div className="pt-4 mt-2 border-t">
            <NavLink to="rewards" className={navLinkClass} onClick={onLinkClick}>
                <Gift size={20} /> Rewards
            </NavLink>
            <NavLink to="notifications" className={navLinkClass} onClick={onLinkClick}>
                <Bell size={20} /> Notifications
            </NavLink>
             <NavLink to="support" className={navLinkClass} onClick={onLinkClick}>
                <LifeBuoy size={20} /> Support
            </NavLink>
        </div>
    </nav>
);

const AccountLayout: React.FC = () => {
    const { user } = useAuth();
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header with mobile toggle */}
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">My Account</h1>
                    <p className="mt-2 text-lg text-text-secondary">Welcome back, {user?.firstName}!</p>
                </div>
                 <button 
                    className="p-2 md:hidden"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open navigation menu"
                 >
                    <Menu size={28} />
                 </button>
            </header>

            {/* Mobile Sidebar (Overlay) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
                    
                    {/* Sidebar Content */}
                    <aside className="relative w-4/5 max-w-xs bg-base h-full p-4 animate-slide-in-left">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Menu</h2>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2" aria-label="Close navigation menu">
                                <X size={24} />
                            </button>
                        </div>
                        <AccountNavMenu onLinkClick={() => setMobileMenuOpen(false)} />
                    </aside>
                </div>
            )}

            {/* Desktop Layout */}
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                <aside className="hidden md:block w-full md:w-1/4 lg:w-1/5">
                    <div className="sticky top-24 bg-base rounded-xl shadow-lg p-4">
                        <AccountNavMenu />
                    </div>
                </aside>
                <main className="w-full md:w-3/4 lg:w-4/5 bg-base rounded-xl shadow-lg p-6 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AccountLayout;
