import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-neutral-900 text-white px-4 py-4 flex flex-col md:flex-row items-center justify-center shadow-lg">
      <span className="mr-2 mb-2 md:mb-0">
        We use cookies to improve your experience. By using this site, you agree to our{' '}
        <Link to="/cookies" className="underline text-primary-300 hover:text-primary-200">Cookie Policy</Link>.
      </span>
      <button
        onClick={handleAccept}
        className="ml-0 md:ml-4 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
      >
        Accept
      </button>
    </div>
  );
};

export default CookieConsent; 