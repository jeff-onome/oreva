import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Header: React.FC = () => {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-lg font-medium transition-colors duration-300 ${isActive ? 'text-primary' : 'text-text-primary hover:text-primary'}`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block py-2 px-4 text-base font-medium rounded-md transition-colors duration-300 ${isActive ? 'bg-primary text-white' : 'text-text-primary hover:bg-neutral'}`;


  const renderNavLinks = (isMobile: boolean = false) => (
    <>
      <NavLink to="/" className={isMobile ? mobileNavLinkClass : navLinkClass} onClick={() => setIsMenuOpen(false)}>Home</NavLink>
      <NavLink to="/products" className={isMobile ? mobileNavLinkClass : navLinkClass} onClick={() => setIsMenuOpen(false)}>Shop</NavLink>
      <NavLink to="/about" className={isMobile ? mobileNavLinkClass : navLinkClass} onClick={() => setIsMenuOpen(false)}>About</NavLink>
      {user && user.isAdmin && (
        <NavLink to="/admin" className={isMobile ? mobileNavLinkClass : navLinkClass} onClick={() => setIsMenuOpen(false)}>
            <span className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-secondary"/> Admin
            </span>
        </NavLink>
      )}
    </>
  );

  return (
    <header className="bg-base/80 backdrop-blur-lg sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="text-[1.3rem] sm:text-3xl font-bold tracking-tight text-primary">
            {settings.site_name?.name || 'ORESKY'}
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            {renderNavLinks()}
          </nav>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
               {user ? (
                 <div className="relative group">
                    <Link to="/account" className="flex items-center gap-2 p-2 rounded-full transition-colors hover:bg-neutral">
                        <User className="text-text-primary"/>
                        <span className="hidden lg:inline text-sm font-medium">{`${user.firstName} ${user.lastName}`}</span>
                    </Link>
                    <div className="absolute right-0 mt-2 w-48 bg-base rounded-md shadow-lg py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                        <Link to="/account/profile" className="block px-4 py-2 text-sm text-text-primary hover:bg-neutral">Profile</Link>
                        <Link to="/account/orders" className="block px-4 py-2 text-sm text-text-primary hover:bg-neutral">My Orders</Link>
                        <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral">Logout</button>
                    </div>
                </div>
               ) : (
                <Link to="/login" className={navLinkClass({ isActive: false })}>
                    <User />
                </Link>
               )}

              <Link to="/cart" className="relative p-2 rounded-full transition-colors hover:bg-neutral">
                <ShoppingBag className="text-text-primary" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-secondary text-white text-xs text-center leading-5">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-base absolute top-14 left-0 w-full shadow-lg animate-fade-in">
          <nav className="flex flex-col p-4 space-y-2">
            {renderNavLinks(true)}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;