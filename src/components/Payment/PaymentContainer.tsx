import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Loader, AlertCircle, Copy } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { useAuthStore } from '../../store/auth';
import { navigateAfterProgress } from '../../lib/navigation';
import { brands } from '../../lib/api';
import Button from '../common/Button';
import GetHelpButton from '../common/GetHelpButton';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const PaymentContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentBrand, selectBrand, progressBrandStatus, isLoading } = useBrandStore();
  const { user } = useAuthStore();
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('credit_card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  
  // Form validation and error handling
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Social sharing state for zero-amount
  const [sharedNetworks, setSharedNetworks] = useState<{[key: string]: boolean}>({
    facebook: false,
    linkedin: false,
    twitter: false,
    other: false,
  });
  const shareText =
    'I have just created a branding for my new business idea using Brandician.AI and it was awesome! AI-powered tool analyzes your business idea, suggests the brand archetype, generates brand assets, etc. Visit https://brandician.ai/ to create a brand for your idea!';
  const atLeastOneShared = Object.values(sharedNetworks).some(Boolean);
  const isZeroAmount = paymentAmount !== '' && parseFloat(paymentAmount) === 0;
  const canProceed = paymentAmount !== '' && (!isZeroAmount || atLeastOneShared);

  // Ref for amount input
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  // Check for payment error from URL params
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'payment_cancelled') {
      setPaymentError('Your PayPal payment was cancelled. Please try a different payment method or try again.');
    }
  }, [searchParams]);

  // Load available payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await brands.getPaymentMethods();
        
        const paymentMethods: PaymentMethod[] = [
          {
            id: 'credit_card',
            name: 'Credit Card',
            icon: <CreditCard className="h-5 w-5" />,
            enabled: response.payment_methods.includes('credit_card')
          },
          {
            id: 'paypal',
            name: 'PayPal',
            icon: <div className="h-5 w-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">P</div>,
            enabled: response.payment_methods.includes('paypal')
          },
          {
            id: 'google_pay',
            name: 'Google Pay',
            icon: <div className="h-5 w-5 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">G</div>,
            enabled: response.payment_methods.includes('google_pay')
          }
        ];
        
        setAvailablePaymentMethods(paymentMethods);
        
        // Set default to first enabled method
        const firstEnabled = paymentMethods.find(method => method.enabled);
        if (firstEnabled) {
          setSelectedPaymentMethod(firstEnabled.id);
        }
        
      } catch (error) {
        console.error('Failed to load payment methods:', error);
        // Fallback to default methods
        setAvailablePaymentMethods([
          {
            id: 'credit_card',
            name: 'Credit Card',
            icon: <CreditCard className="h-5 w-5" />,
            enabled: true
          }
        ]);
      } finally {
        setIsLoadingMethods(false);
      }
    };

    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, []);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    // Accept zero as valid
    if (paymentAmount === '' || isNaN(Number(paymentAmount))) {
      newErrors.payment = 'Please enter a payment amount';
    }
    if (!selectedPaymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = async () => {
    if (!brandId || !validateForm()) return;
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      if (isZeroAmount) {
        // Just progress status and move on
        const statusUpdate = await progressBrandStatus(brandId);
        navigateAfterProgress(navigate, brandId, statusUpdate);
        return;
      }
      // Create payment session with the backend including payment method
      const paymentSession = await brands.createPaymentSession(
        brandId, 
        parseFloat(paymentAmount),
        `Brand creation payment for ${currentBrand?.name || 'brand'}`,
        selectedPaymentMethod
      );
      // Open payment processor checkout in new window (standard PayPal behavior)
      console.log('Opening payment checkout in new window:', paymentSession.checkout_url);
      const popup = window.open(
        paymentSession.checkout_url,
        'paypal_checkout',
        'width=600,height=700,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=no'
      );
      if (!popup) {
        // Handle popup blocker
        setPaymentError('Popup blocked. Please allow popups for this site and try again.');
        setIsProcessingPayment(false);
        return;
      }
      // Monitor popup for closure to check payment status
      const pollTimer = setInterval(async () => {
        if (popup.closed) {
          clearInterval(pollTimer);
          // Check payment status after popup closes
          console.log('Payment popup closed, checking status...');

          // Wait a moment for any redirects to complete
          setTimeout(async () => {
            try {
              // Check if payment was completed
              const paymentStatus = await brands.getPaymentStatus(brandId);
              if (paymentStatus.payment_complete) {
                // Payment was successful, progress to completion
                const statusUpdate = await progressBrandStatus(brandId);
                navigateAfterProgress(navigate, brandId, statusUpdate);
              } else {
                // Payment was not completed, just reset state
                setIsProcessingPayment(false);
              }
            } catch (error) {
              console.error('Failed to check payment status:', error);
              setIsProcessingPayment(false);
            }
          }, 2000); // Wait 2 seconds to allow for redirect handling
        }
      }, 1000);
    } catch (error) {
      console.error('Payment submission failed:', error);
      setErrors({ payment: 'Failed to process payment. Please try again.' });
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentAmount(e.target.value);
    setErrors({ ...errors, payment: '' });
  };

  const handleCheckboxChange = (network: string) => {
    setSharedNetworks(prev => ({ ...prev, [network]: !prev[network] }));
  };
  const handleCopyShareText = () => {
    navigator.clipboard.writeText(shareText);
  };

  if (isLoading || !currentBrand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center">
          <Loader className="animate-spin h-6 w-6 text-primary-600 mr-2" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <CreditCard className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1"></div>
                <h1 className="text-3xl font-display font-bold text-neutral-800 flex-1 text-center">
                  Support Our Mission
                </h1>
                <div className="flex-1 flex justify-end">
                  <GetHelpButton variant="secondary" size="md" />
                </div>
              </div>
              <p className="text-lg text-neutral-600 mb-6">
                Your brand <strong>{currentBrand.name}</strong> is ready! 
                We ask for a contribution based on the value we've provided.
              </p>
            </div>

            <div className="space-y-8">
              {/* Payment Error Alert */}
              {paymentError && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                    <p className="text-orange-800">{paymentError}</p>
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              <div>
                <h2 className="text-xl font-semibold text-neutral-800 mb-4">
                  Payment Method
                </h2>
                {isLoadingMethods ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader className="animate-spin h-5 w-5 text-primary-600 mr-2" />
                    <span className="text-gray-600">Loading payment methods...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availablePaymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          method.enabled 
                            ? selectedPaymentMethod === method.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-300 hover:border-gray-400'
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selectedPaymentMethod === method.id}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          disabled={!method.enabled}
                          className="sr-only"
                        />
                        <div className="flex items-center">
                          {method.icon}
                          <span className="ml-3 font-medium text-gray-900">{method.name}</span>
                          {!method.enabled && (
                            <span className="ml-2 text-xs text-gray-500">(Not available)</span>
                          )}
                        </div>
                        {selectedPaymentMethod === method.id && method.enabled && (
                          <div className="ml-auto">
                            <div className="h-4 w-4 rounded-full bg-primary-600 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          </div>
                        )}
                      </label>
                    ))}
                    {errors.paymentMethod && (
                      <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Amount Section */}
              <div>
                <h2 className="text-xl font-semibold text-neutral-800 mb-4">
                  Choose Your Contribution
                </h2>
                <p className="text-neutral-600 mb-4">
                  We ask for a contribution of <strong>any amount</strong> (yes, it can even be zero!) based on the value we've added to your brand's future success. 
                  Your support helps us cover AI costs and continue developing new features for entrepreneurs like you.
                </p>
                
                <div className="mb-4">
                  <label htmlFor="payment" className="block text-sm font-medium text-gray-700 mb-2">
                    Contribution Amount ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      id="payment"
                      type="number"
                      min="1"
                      step="0.01"
                      value={paymentAmount}
                      onChange={handlePaymentAmountChange}
                      className={`w-full pl-8 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.payment ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter amount"
                      ref={amountInputRef}
                    />
                  </div>
                  {errors.payment && (
                    <p className="mt-1 text-sm text-red-600">{errors.payment}</p>
                  )}
                </div>

                {/* Suggested amounts */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {[10, 25, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setPaymentAmount(amount.toString())}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                {/* Zero-amount sharing flow */}
                {isZeroAmount && (
                  <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-300 rounded-lg text-center">
                    <div className="text-xl font-bold text-blue-900 mb-4">
                      <p>It is ok to pay nothing - sometimes the cash situation is tight.
                      But can you then please do a thing, that will not cost you anything -
                      but will help Brandician and our customers?
                      </p>
                      <p>Please share the text below (or your own wording) on as many as possible
                        of your favorite social networks.</p>
                    </div>
                    <div className="mb-4 mt-4">
                      <div className="font-semibold text-lg mb-2">Yes, I shared it on:</div>
                      <div className="flex flex-wrap justify-center gap-6">
                        <label className="flex items-center gap-2 text-lg">
                          <input type="checkbox" checked={sharedNetworks.facebook} onChange={() => handleCheckboxChange('facebook')} />
                          Facebook
                        </label>
                        <label className="flex items-center gap-2 text-lg">
                          <input type="checkbox" checked={sharedNetworks.linkedin} onChange={() => handleCheckboxChange('linkedin')} />
                          LinkedIn
                        </label>
                        <label className="flex items-center gap-2 text-lg">
                          <input type="checkbox" checked={sharedNetworks.twitter} onChange={() => handleCheckboxChange('twitter')} />
                          Twitter(X)
                        </label>
                        <label className="flex items-center gap-2 text-lg">
                          <input type="checkbox" checked={sharedNetworks.other} onChange={() => handleCheckboxChange('other')} />
                          Other
                        </label>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-4 mb-2 text-left max-w-2xl mx-auto">
                      <div className="mb-2 text-gray-700">Share this text:</div>
                      <div className="font-mono text-base text-gray-900 mb-2 whitespace-pre-line">{shareText}</div>
                      <Button
                        onClick={handleCopyShareText}
                        leftIcon={<Copy className="h-4 w-4" />}
                      >
                        Copy to Clipboard
                      </Button>
                    </div>
                  </div>
                )}

                {/* Always show share text section below suggested amounts, outside zero-amount block */}
                {!isZeroAmount && (
                  <div className="bg-white border border-gray-200 rounded p-4 mb-6 text-left max-w-2xl mx-auto">
                    <div className="mb-2 text-gray-700 font-semibold">Share this text on social networks:</div>
                    <div className="font-mono text-base text-gray-900 mb-2 whitespace-pre-line">{shareText}</div>
                    <Button
                      onClick={handleCopyShareText}
                      leftIcon={<Copy className="h-4 w-4" />}
                    >
                      Copy to Clipboard
                    </Button>
                  </div>
                )}

              </div>

              {/* Submit Button */}
              <div className="border-t pt-6">
                <Button
                  onClick={handlePaymentSubmit}
                  disabled={isProcessingPayment || !canProceed}
                  loading={isProcessingPayment}
                  leftIcon={!isProcessingPayment ? <CreditCard className="h-5 w-5" /> : undefined}
                  className="w-full"
                >
                  {isProcessingPayment
                    ? 'Processing...'
                    : isZeroAmount
                      ? 'Proceed without payment'
                      : 'Proceed to Secure Payment'}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-2">
                  {isZeroAmount
                    ? 'Your download will be available immediately'
                    : 'Secure payment processing • Your download will be available immediately after payment'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentContainer;