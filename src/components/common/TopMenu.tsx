import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Brain, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

const TopMenu: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  // Handle Brandician.AI logo click
  const handleLogoClick = (e: React.MouseEvent) => {
    console.log('Logo clicked: handleLogoClick called');
    e.preventDefault();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    console.log('Current location:', location.pathname);
  }, [location]);

  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <a
            href="/"
            onClick={handleLogoClick}
            className="flex items-center text-primary-600 hover:text-primary-700"
          >
            <img src="/images/brandician-logo.png" alt="Brandician.AI Logo" className="h-8 w-auto mr-2" />
            
          </a>
          
          {/* Navigation for landing page */}
          {location.pathname === '/' && (
            <nav className="hidden md:flex space-x-6">
              <a href="#features" className="text-neutral-600 hover:text-primary-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-neutral-600 hover:text-primary-600 transition-colors">How It Works</a>
              <a href="#pricing" className="text-neutral-600 hover:text-primary-600 transition-colors">Pricing</a>
            </nav>
          )}
          
          {/* Right side content */}
          {!user && (
            <Link 
              to="/register"
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Get Started
            </Link>
          )}
          
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-800 focus:outline-none"
              >
                <User className="h-5 w-5" />
                <span>{user.name}</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={() => {
                      navigate('/brands');
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    My Brands
                  </button>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    <div className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopMenu;