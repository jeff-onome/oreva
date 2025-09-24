import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Footer: React.FC = () => {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name?.name || 'ORESKY';
  const socials = settings.social_links;

  return (
    <footer className="bg-text-primary text-neutral mt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {siteName}
            </h3>
            <p className="text-slate-400">Your one-stop shop for everything colorful and cool.</p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Shop</h4>
            <ul className="space-y-2">
              <li><Link to="/products?category=electronics" className="text-slate-400 hover:text-white transition">Electronics</Link></li>
              <li><Link to="/products?category=apparel" className="text-slate-400 hover:text-white transition">Apparel</Link></li>
              <li><Link to="/products?category=home-goods" className="text-slate-400 hover:text-white transition">Home Goods</Link></li>
              <li><Link to="/products?category=books" className="text-slate-400 hover:text-white transition">Books</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-slate-400 hover:text-white transition">About Us</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-white transition">Contact Us</Link></li>
              <li><Link to="/faq" className="text-slate-400 hover:text-white transition">FAQ</Link></li>
              <li><Link to="/shipping-returns" className="text-slate-400 hover:text-white transition">Shipping & Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-white">Connect</h4>
            <div className="flex space-x-4">
              {socials?.github && <a href={socials.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition"><Github /></a>}
              {socials?.twitter && <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition"><Twitter /></a>}
              {socials?.linkedin && <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition"><Linkedin /></a>}
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-700 pt-8 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
