
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Tag, Settings, Users, Folder, Star, LifeBuoy, Menu, X } from 'lucide-react';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${isActive ? 'bg-primary text-white shadow' : 'hover:bg-primary/10'}`;

const AdminNavMenu: React.FC<{ onLinkClick?: () => void }> = ({ onLinkClick }) => (
    <nav className="space-y-2">
        <NavLink to="dashboard" className={navLinkClass} onClick={onLinkClick}>
            <LayoutDashboard size={22} /> Dashboard
        </NavLink>
        <NavLink to="products" className={navLinkClass} onClick={onLinkClick}>
            <ShoppingCart size={22} /> Products
        </NavLink>
         <NavLink to="categories" className={navLinkClass} onClick={onLinkClick}>
            <Folder size={22} /> Categories
        </NavLink>
        <NavLink to="orders" className={navLinkClass} onClick={onLinkClick}>
            <Package size={22} /> Orders
        </NavLink>
        <NavLink to="users" className={navLinkClass} onClick={onLinkClick}>
            <Users size={22} /> Users
        </NavLink>
        <NavLink to="promotions" className={navLinkClass} onClick={onLinkClick}>
            <Tag size={22} /> Promotions
        </NavLink>
        <NavLink to="reviews" className={navLinkClass} onClick={onLinkClick}>
            <Star size={22} /> Reviews
        </NavLink>
         <NavLink to="support" className={navLinkClass} onClick={onLinkClick}>
            <LifeBuoy size={22} /> Support
        </NavLink>
        <NavLink to="settings" className={navLinkClass} onClick={onLinkClick}>
            <Settings size={22} /> Site Settings
        </NavLink>
    </nav>
);

const AdminLayout: React.FC = () => {
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
            <header className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
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
                            <h2 className="text-xl font-bold">Admin Menu</h2>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2" aria-label="Close navigation menu">
                                <X size={24} />
                            </button>
                        </div>
                        <AdminNavMenu onLinkClick={() => setMobileMenuOpen(false)} />
                    </aside>
                </div>
            )}

            {/* Desktop Layout */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <aside className="hidden md:block w-full md:w-1/4 lg:w-1/5">
                    <div className="sticky top-24 bg-base rounded-xl shadow-lg p-4">
                        <AdminNavMenu />
                    </div>
                </aside>
                <main className="w-full md:w-3/4 lg:w-4/5 bg-base rounded-xl shadow-lg p-6 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
