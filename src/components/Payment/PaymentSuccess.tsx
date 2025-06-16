import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, AlertTriangle } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { brands } from '../../lib/api';
import { navigateAfterProgress } from '../../lib/navigation';

const PaymentSuccess: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { progressBrandStatus, currentBrand, selectBrand } = useBrandStore();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!brandId) return;

      try {
        // First, ensure we have the current brand data
        await selectBrand(brandId);
        
        // Check payment status from the backend
        const paymentStatusData = await brands.getPaymentStatus(brandId);
        
        if (paymentStatusData.payment_complete) {
          setPaymentStatus('success');
          
          // Automatically progress to next status after successful payment
          setTimeout(async () => {
            try {
              const statusUpdate = await progressBrandStatus(brandId);
              navigateAfterProgress(navigate, brandId, statusUpdate);
            } catch (progressError) {
              console.error('Failed to progress brand status:', progressError);
              // Still navigate to completed page if progress fails
              navigate(`/brands/${brandId}/completed`);
            }
          }, 2000); // 2 second delay to show success message
          
        } else {
          setPaymentStatus('failed');
          setError('Payment was not completed successfully.');
        }
      } catch (err) {
        console.error('Failed to verify payment status:', err);
        setPaymentStatus('failed');
        setError('Failed to verify payment status. Please contact support.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [brandId, selectBrand, progressBrandStatus, navigate]);

  const handleReturnToPayment = () => {
    if (brandId) {
      navigate(`/brands/${brandId}/payment`);
    }
  };

  const handleContactSupport = () => {
    // In a real app, this would open a support chat or redirect to support page
    window.open('mailto:support@brandician.ai?subject=Payment Issue', '_blank');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Loader className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying Payment
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for your contribution! Your brand <strong>{currentBrand?.name}</strong> is now complete.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting you to download your brand assets...
          </p>
          <div className="mt-4">
            <div className="animate-pulse h-2 bg-green-200 rounded-full">
              <div className="h-2 bg-green-500 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment failed or error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Issue
        </h2>
        <p className="text-gray-600 mb-6">
          {error || 'There was an issue processing your payment.'}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleReturnToPayment}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Payment Again
          </button>
          
          <button
            onClick={handleContactSupport}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Contact Support
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          If you've already paid, please wait a few minutes and refresh this page.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;