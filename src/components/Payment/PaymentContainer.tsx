import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Loader, AlertCircle } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { useAuthStore } from '../../store/auth';
import { navigateAfterProgress } from '../../lib/navigation';
import { brands } from '../../lib/api';

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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
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
        return;
      }
      
      // Monitor popup for closure to check payment status
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          // Check payment status after popup closes
          console.log('Payment popup closed, checking status...');
          // The user will be redirected via our PayPal handlers if successful
          // For now, just reset the processing state
          setIsProcessingPayment(false);
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
              <h1 className="text-3xl font-display font-bold text-neutral-800 mb-4">
                Support Our Mission
              </h1>
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
                  We ask for a contribution of <strong>any amount</strong> based on the value we've added to your brand's future success. 
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

                {/* What you get */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-neutral-800 mb-3">What you get:</h3>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">✓</span>
                      Full access to all your brand assets
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">✓</span>
                      High-resolution logo files and variations
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">✓</span>
                      Complete brand guidelines document
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">✓</span>
                      Marketing materials and templates
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">✓</span>
                      Lifetime access to your brand portal
                    </li>
                  </ul>
                </div>
              </div>

              {/* Submit Button */}
              <div className="border-t pt-6">
                <button
                  onClick={handlePaymentSubmit}
                  disabled={isProcessingPayment}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Proceed to Secure Payment
                    </>
                  )}
                </button>
                
                <p className="text-xs text-gray-500 text-center mt-2">
                  Secure payment processing • Your download will be available immediately after payment
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