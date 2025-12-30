import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

const TopMenu: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/", { replace: true });
  };

  return (
    <header className="bg-white sticky top-0 z-40">
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
            <a
              href="https://www.brandician.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-menu-item"
            >
              ABOUT
            </a>
            <a href="mailto:info@brandician.eu" className="nav-menu-item">
              CONTACT
            </a>
            {/* Authentication links */}
            {user ? (
              <>
                <Link to="/brands" className="nav-menu-item">
                  MY BRANDS
                </Link>
                <Link to="/profile" className="nav-menu-item">
                  MY PROFILE
                </Link>
              </>
            ) : (
              <Link to="/register" className="nav-menu-item">
                LOGIN / SIGN UP
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-neutral-50 transition-colors w-10 h-10 flex items-center justify-center"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
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
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-full left-0 right-0 md:hidden bg-white border-t border-gray-200 overflow-hidden shadow-lg z-50"
            >
              <div className="px-4 py-3 space-y-1">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors"
                >
                  HOME
                </Link>
                <div>
                  <a
                    href="https://www.brandician.eu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors"
                  >
                    About
                  </a>
                </div>
                <a
                  href="mailto:info@brandician.eu"
                  className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors"
                >
                  CONTACT
                </a>
                {/* Authentication links */}
                {user ? (
                  <>
                    <Link
                      to="/brands"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors"
                    >
                      MY BRANDS
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors"
                    >
                      MY PROFILE
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-[14px] font-['Source_Sans_Pro'] font-semibold uppercase tracking-[2px] text-gray-700 hover:text-[#FD615E] transition-colors"
                  >
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
