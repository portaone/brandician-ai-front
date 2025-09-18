import React, {useState, useRef, useEffect} from 'react';
import {Link, useNavigate, useLocation, NavLink} from 'react-router-dom';
import {Brain, LogOut, User} from 'lucide-react';
import {useAuthStore} from '../../store/auth';

const TopMenu: React.FC = () => {
    const {user, logout} = useAuthStore();
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
        navigate('/', {replace: true});
    };

    useEffect(() => {
        console.log('Current location:', location.pathname);
    }, [location]);

    return (
        <header className="bg-white sticky top-0 z-50">
            <div className="container mx-auto">
                <div className="flex items-center justify-between py-[14px] ">
                    <a
                        href="/"
                        onClick={handleLogoClick}
                        className="flex items-center"
                    >
                        <img
                            width="210"
                            height="43"
                            src="https://www.brandician.eu/wp-content/uploads/2021/03/Brandician-logo-1.png"
                            alt="Brandician"
                        />
                    </a>

                    {/* Full navigation menu exactly like brandician.eu */}
                    <div className="hidden md:flex items-center">
                        <div className="relative group">
                            <button className="nav-menu-item flex items-center">
                                ABOUT
                                <span className="ml-[10px]">
                                    <svg className="size-[14px]" fill="currentColor" viewBox="0 0 320 512"
                                         xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"/>
                                    </svg>
                                </span>
                            </button>
                        </div>
                        <a href="#" className="nav-menu-item">APP</a>
                        <a href="#" className="nav-menu-item">OUR WORK</a>
                        <a href="#" className="nav-menu-item">BLOG</a>
                        <a href="#" className="nav-menu-item">CONTACT</a>
                        <div className="nav-menu-item">
                            <svg className="pr-[2px] w-[18px] h-[16px]" fill="currentColor" viewBox="0 0 512 512">
                                <path
                                    d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"/>
                            </svg>
                        </div>
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