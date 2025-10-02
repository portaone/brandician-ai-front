import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader } from 'lucide-react';

const PaymentCancelHandler: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Extract brandId from URL parameters
    // PayPal should include custom parameters in the return URL
    const brandId = searchParams.get('brand_id') || searchParams.get('custom') || searchParams.get('item_number');

    if (brandId) {
      const targetUrl = `/brands/${brandId}/payment?error=payment_cancelled`;

      // Check if we're in a popup window
      if (window.opener && window.opener !== window) {
        // We're in a popup - redirect the parent window and close the popup
        window.opener.location.href = targetUrl;
        // Show a message before closing
        document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;"><div style="text-align: center;"><h2>Payment Cancelled</h2><p>Returning to payment page...</p></div></div>';
        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        // Not in a popup, navigate normally back to payment page
        navigate(targetUrl);
      }
    } else {
      // If no brandId found, redirect to brands list
      console.error('No brandId found in PayPal cancel callback');
      navigate('/brands');
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center">
        <Loader className="animate-spin h-6 w-6 text-primary-600 mr-2" />
        <span>Processing payment cancellation...</span>
      </div>
    </div>
  );
};

export default PaymentCancelHandler;