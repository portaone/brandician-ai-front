import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, CreditCard, Loader, Heart, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { navigateAfterProgress } from '../../lib/navigation';
import { brands } from '../../lib/api';

const PaymentContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { currentBrand, selectBrand, progressBrandStatus, isLoading } = useBrandStore();
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Review state
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [testimonial, setTestimonial] = useState<string>('');
  const [showName, setShowName] = useState<boolean>(false);
  
  // Feedback state
  const [feedback, setFeedback] = useState<string>('');
  
  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      newErrors.payment = 'Please enter a payment amount';
    }
    
    if (rating === 0) {
      newErrors.rating = 'Please provide a star rating';
    }
    
    if (!testimonial.trim()) {
      newErrors.testimonial = 'Please write a brief review';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = async () => {
    if (!brandId || !validateForm()) return;
    
    setIsProcessingPayment(true);
    
    try {
      // Create payment session with the backend
      const paymentSession = await brands.createPaymentSession(
        brandId, 
        parseFloat(paymentAmount),
        `Brand creation payment for ${currentBrand?.name || 'brand'}`
      );
      
      // Store testimonial and feedback data in localStorage for now
      // TODO: Add proper API endpoints for testimonials and feedback
      const testimonialData = {
        brandId,
        rating,
        testimonial,
        showName,
        feedback,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`testimonial_${brandId}`, JSON.stringify(testimonialData));
      
      // Redirect to payment processor checkout
      console.log('Redirecting to payment checkout:', paymentSession.checkout_url);
      window.location.href = paymentSession.checkout_url;
      
    } catch (error) {
      console.error('Payment session creation failed:', error);
      setErrors({ payment: 'Failed to create payment session. Please try again.' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
    setErrors({ ...errors, rating: '' });
  };

  const handleTestimonialChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTestimonial(e.target.value);
    setErrors({ ...errors, testimonial: '' });
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
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-3xl font-display font-bold text-neutral-800 mb-4">
                Your Brand Journey is Complete!
              </h1>
              <p className="text-lg text-neutral-600 mb-6">
                Congratulations on creating <strong>{currentBrand.name}</strong>! 
                You've seen the brand assets we've generated for your future success.
              </p>
            </div>

            <div className="space-y-8">
              {/* Payment Section */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Support Our Mission
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
              </div>

              {/* Review Section */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-neutral-800 mb-4">
                  Share Your Experience
                </h2>
                
                {/* Star Rating */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate your experience
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-1 focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {rating > 0 && `${rating} star${rating !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  {errors.rating && (
                    <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
                  )}
                </div>

                {/* Testimonial */}
                <div className="mb-4">
                  <label htmlFor="testimonial" className="block text-sm font-medium text-gray-700 mb-2">
                    Write a brief review (publicly shareable)
                  </label>
                  <textarea
                    id="testimonial"
                    rows={4}
                    value={testimonial}
                    onChange={handleTestimonialChange}
                    className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.testimonial ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Tell other entrepreneurs about your experience with Brandician AI..."
                  />
                  {errors.testimonial && (
                    <p className="mt-1 text-sm text-red-600">{errors.testimonial}</p>
                  )}
                </div>

                {/* Show Name Option */}
                <div className="mb-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showName}
                      onChange={(e) => setShowName(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 flex items-center">
                      {showName ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                      Show my name as A*** F*** in testimonials
                    </span>
                  </label>
                </div>
              </div>

              {/* Feedback Section */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Help Us Improve
                </h2>
                <div className="mb-6">
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                    Comments or suggestions for the Brandician team (optional)
                  </label>
                  <textarea
                    id="feedback"
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="What can we do better? Any features you'd like to see?"
                  />
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
                      Complete Payment & Continue
                    </>
                  )}
                </button>
                
                <p className="text-xs text-gray-500 text-center mt-2">
                  Secure payment processing • Your download will be available on the next screen
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