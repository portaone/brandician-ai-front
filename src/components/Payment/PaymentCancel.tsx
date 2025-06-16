import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { useBrandStore } from '../../store/brand';

const PaymentCancel: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { currentBrand, selectBrand } = useBrandStore();

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  const handleReturnToPayment = () => {
    if (brandId) {
      // Navigate back to payment page with error state
      navigate(`/brands/${brandId}/payment?error=payment_cancelled`);
    }
  };

  const handleContactSupport = () => {
    // In a real app, this would open a support chat or redirect to support page
    window.open('mailto:support@brandician.ai?subject=Payment Assistance', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment was cancelled and no charges were made to your account.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-800">
              <strong>Having trouble with PayPal?</strong><br />
              Consider trying a different payment method such as credit card or Google Pay.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleReturnToPayment}
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Try Different Payment Method
            </button>
            
            <button
              onClick={handleContactSupport}
              className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Contact Support
            </button>
          </div>
          
          {currentBrand && (
            <p className="text-xs text-gray-500 mt-4">
              Your brand "{currentBrand.name}" is saved and ready for payment when you're ready.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;