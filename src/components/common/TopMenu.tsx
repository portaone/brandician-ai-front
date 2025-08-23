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
    <header className="bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <a
            href="/"
            onClick={handleLogoClick}
            className="flex items-center"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full border-2 border-primary-500 flex items-center justify-center mr-3">
                <div className="w-8 h-6 bg-primary-500 rounded-t-full"></div>
              </div>
              <span className="text-xl font-bold text-neutral-800">Brandician</span>
            </div>
          </a>
          
          {/* Full navigation menu exactly like brandician.eu */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="relative group">
              <button className="nav-menu-item flex items-center">
                ABOUT
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <a href="#" className="nav-menu-item">APP</a>
            <a href="#" className="nav-menu-item">OUR WORK</a>
            <a href="#" className="nav-menu-item">BLOG</a>
            <a href="#" className="nav-menu-item">CONTACT</a>
            <button className="p-2 hover:bg-neutral-50 transition-colors">
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          
          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center">
            <button className="p-2 rounded-md hover:bg-neutral-50 transition-colors">
              <div className="space-y-1">
                <div className="w-6 h-0.5 bg-neutral-800"></div>
                <div className="w-6 h-0.5 bg-neutral-800"></div>
                <div className="w-6 h-0.5 bg-neutral-800"></div>
              </div>
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopMenu;