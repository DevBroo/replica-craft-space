import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import picnifyLogo from '/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png';

const Footer: React.FC = () => {
  const location = useLocation();
  
  const handleLinkClick = (to: string) => {
    if (location.pathname === to) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer className="bg-gray-900 text-white py-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-brand-red to-brand-orange rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-brand-orange to-yellow-500 rounded-full filter blur-3xl"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <img src={picnifyLogo} alt="Picnify.in Logo" className="h-12" />
            </div>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-md">
              Picnify is your one-stop platform to discover and book day picnic spots, villas, farmhouses, and unique getaways, making your time with loved ones hassle-free and memorable
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="https://facebook.com/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                <i className="fab fa-facebook-f text-xl group-hover:animate-bounce"></i>
              </a>
              <a href="https://instagram.com/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                <i className="fab fa-instagram text-xl group-hover:animate-bounce"></i>
              </a>
              <a href="https://twitter.com/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                <i className="fab fa-twitter text-xl group-hover:animate-bounce"></i>
              </a>
              <a href="https://youtube.com/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                <i className="fab fa-youtube text-xl group-hover:animate-bounce"></i>
              </a>
              <a href="https://linkedin.com/company/picnify" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                <i className="fab fa-linkedin-in text-xl group-hover:animate-bounce"></i>
              </a>
              <a href="https://wa.me/+919876543210" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-r from-brand-red to-brand-orange rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 group">
                <i className="fab fa-whatsapp text-xl group-hover:animate-bounce"></i>
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-6 text-white">Quick Links</h3>
            <ul className="space-y-4">
              <li><Link to="/about" onClick={() => handleLinkClick('/about')} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>About Picnify</Link></li>
              <li><Link to="/how-it-works" onClick={() => handleLinkClick('/how-it-works')} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>How It Works</Link></li>
              <li><Link to="/safety-guidelines" onClick={() => handleLinkClick('/safety-guidelines')} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Safety Guidelines</Link></li>
              <li><Link to="/privacy-policy" onClick={() => handleLinkClick('/privacy-policy')} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" onClick={() => handleLinkClick('/terms-of-service')} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-6 text-white">Support & Help</h3>
            <ul className="space-y-4">
              <li><Link to="/help-center" onClick={() => handleLinkClick('/help-center')} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>24/7 Help Center</Link></li>
              <li><Link to="/contact" onClick={() => handleLinkClick('/contact')} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Contact Support</Link></li>
              <li><Link to="/booking-assistance" onClick={() => handleLinkClick('/booking-assistance')} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Booking Assistance</Link></li>
              <li><Link to="/host-resources" onClick={() => handleLinkClick('/host-resources')} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Host Resources</Link></li>
              <li><Link to="/trust-safety" onClick={() => handleLinkClick('/trust-safety')} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center gap-2"><i className="fas fa-chevron-right text-xs text-brand-red"></i>Trust & Safety</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-12">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="text-center lg:text-left">
              <p className="text-gray-400 text-lg">
                © 2025 Picnify.in - Crafted with ❤️ in India. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Connecting travelers with extraordinary experiences since 2024
              </p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">4.9★</div>
                <div className="text-xs text-gray-400">App Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
