import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {AnimatePresence, motion} from 'framer-motion';
import { useAuthStore } from '../../store/auth';

const TopMenu: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate('/', {replace: true});
    };

    return (
        <header className="bg-white sticky top-0 z-50">
            <div className="container mx-auto relative">
                <div className="flex items-center justify-between py-[14px] ">
                    <a
                        href="/"
                        onClick={handleLogoClick}
                        className="flex items-center ml-2 lg:ml-0"
                    >
                        <img
                            className="w-[160px] md:w-[210px] h-auto"
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
                            {/* About dropdown menu */}
                            <div className="absolute top-full left-0 mt-0 w-auto min-w-[240px] bg-[#F4F2F2] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <a href="https://www.brandician.eu/about/what-makes-us-different/"
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="block px-5 py-[13px] text-[13px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-[#33373D] hover:text-[#FD615E] hover:bg-white/50 transition-colors whitespace-nowrap">
                                    What Makes Us Special
                                </a>
                                <a href="https://www.brandician.eu/team/"
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="block px-5 py-[13px] text-[13px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-[#33373D] hover:text-[#FD615E] hover:bg-white/50 transition-colors whitespace-nowrap">
                                    Team
                                </a>
                            </div>
                        </div>
                        <a href="#" className="nav-menu-item">OUR WORK</a>
                        <a href="#" className="nav-menu-item">BLOG</a>
                        <a href="#" className="nav-menu-item">CONTACT</a>
                        <div className="nav-menu-item">
                            <svg className="pr-[2px] w-[18px] h-[16px]" fill="currentColor" viewBox="0 0 512 512">
                                <path
                                    d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"/>
                            </svg>
                        </div>
                        {/* Authentication links */}
                        {user ? (
                            <>
                                <Link to="/brands" className="nav-menu-item">MY BRANDS</Link>
                                <Link to="/profile" className="nav-menu-item">MY PROFILE</Link>
                            </>
                        ) : (
                            <Link to="/register" className="nav-menu-item">LOGIN / SIGN UP</Link>
                        )}
                    </div>

                    {/* Mobile menu toggle */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-md hover:bg-neutral-50 transition-colors w-10 h-10 flex items-center justify-center"
                        >
                            {isMobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            ) : (
                                <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                                    <div className="w-full h-0.5 bg-neutral-800"></div>
                                    <div className="w-full h-0.5 bg-neutral-800"></div>
                                    <div className="w-full h-0.5 bg-neutral-800"></div>
                                </div>
                            )}
                            <span className="sr-only">Menu</span>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{height: 0, opacity: 0}}
                            animate={{height: 'auto', opacity: 1}}
                            exit={{height: 0, opacity: 0}}
                            transition={{duration: 0.3}}
                            className="absolute top-full left-0 right-0 md:hidden bg-white border-t border-gray-200 overflow-hidden shadow-lg z-50"
                        >
                            <div className="px-4 py-3 space-y-1">
                                <Link to="/" onClick={() => setIsMobileMenuOpen(false)}
                                      className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors">
                                    HOME
                                </Link>
                                <div>
                                    <button
                                        onClick={() => setIsAboutOpen(!isAboutOpen)}
                                        className="flex items-center justify-between w-full text-left px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors">
                                        ABOUT
                                        <svg
                                            className={`size-[14px] transform transition-transform ${isAboutOpen ? 'rotate-180' : ''}`}
                                            fill="currentColor"
                                            viewBox="0 0 320 512"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"/>
                                        </svg>
                                    </button>
                                    <AnimatePresence>
                                        {isAboutOpen && (
                                            <motion.div
                                                initial={{height: 0, opacity: 0}}
                                                animate={{height: 'auto', opacity: 1}}
                                                exit={{height: 0, opacity: 0}}
                                                transition={{duration: 0.2}}
                                                className="overflow-hidden"
                                            >
                                                <a href="https://www.brandician.eu/about/what-makes-us-different/"
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   onClick={() => setIsMobileMenuOpen(false)}
                                                   className="block pl-8 pr-3 py-2 text-[13px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[1px] text-gray-600 hover:text-[#FD615E] transition-colors">
                                                    What Makes Us Special
                                                </a>
                                                <a href="https://www.brandician.eu/team/"
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   onClick={() => setIsMobileMenuOpen(false)}
                                                   className="block pl-8 pr-3 py-2 text-[13px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[1px] text-gray-600 hover:text-[#FD615E] transition-colors">
                                                    Team
                                                </a>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <a href="#"
                                   className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors">
                                    OUR WORK
                                </a>
                                <a href="#"
                                   className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors">
                                    BLOG
                                </a>
                                <a href="#"
                                   className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors">
                                    CONTACT
                                </a>
                                {/* Authentication links */}
                                {user ? (
                                    <>
                                        <Link to="/brands" onClick={() => setIsMobileMenuOpen(false)}
                                              className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors">
                                            MY BRANDS
                                        </Link>
                                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}
                                              className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors">
                                            MY PROFILE
                                        </Link>
                                    </>
                                ) : (
                                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}
                                          className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors">
                                        LOGIN / SIGN UP
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

export default TopMenu;