import {
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  MessageSquare,
  Star,
  Loader,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brands } from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useAuthStore } from "../../store/auth";
import { useBrandStore } from "../../store/brand";
import BrandicianLoader from "../common/BrandicianLoader";

const TestimonialContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { currentBrand, selectBrand, progressBrandStatus, isLoading } =
    useBrandStore();
  const { user } = useAuthStore();

  // Review state
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [testimonial, setTestimonial] = useState<string>("");
  const [showName, setShowName] = useState<boolean>(false);

  // Feedback state
  const [feedback, setFeedback] = useState<string>("");

  // Form validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  const maskUserName = (name: string): string => {
    if (!name) return "A*** F***";

    const words = name.trim().split(/\s+/);
    return words
      .map((word) => {
        if (word.length === 0) return "";
        if (word.length === 1) return word;
        return word[0] + "*".repeat(Math.max(word.length - 1, 3));
      })
      .join(" ");
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (rating === 0) {
      newErrors.rating = "Please provide a star rating";
    }

    if (!testimonial.trim()) {
      newErrors.testimonial = "Please write a brief review";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!brandId || !validateForm()) return;

    setIsSubmitting(true);

    try {
      // Submit feedback to the backend
      await brands.updateFeedback(brandId, {
        rating,
        testimonial,
        suggestion: feedback,
        author: showName ? user?.name : undefined,
      });

      // Progress to payment status
      const statusUpdate = await progressBrandStatus(brandId);
      if (statusUpdate) {
        navigateAfterProgress(navigate, brandId, statusUpdate);
      }
    } catch (error) {
      console.error("Testimonial submission failed:", error);
      setErrors({
        submit: "Failed to submit your testimonial. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
    setErrors({ ...errors, rating: "" });
  };

  const handleTestimonialChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setTestimonial(e.target.value);
    setErrors({ ...errors, testimonial: "" });
  };

  if (isLoading || !currentBrand) {
    return (
      <div className="loader-container">
        <div className="flex items-center">
          <BrandicianLoader />
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
                Share Your Experience
              </h1>
              <p className="text-lg text-neutral-600 mb-6">
                Your brand <strong>{currentBrand.name}</strong> is almost ready!
                We'd love to hear about your experience with Brandician AI.
              </p>
            </div>

            <div className="space-y-8">
              {/* Review Section */}
              <div>
                <h2 className="text-xl font-semibold text-neutral-800 mb-4">
                  How was your experience?
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
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {rating > 0 && `${rating} star${rating !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                  {errors.rating && (
                    <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
                  )}
                </div>

                {/* Testimonial */}
                <div className="mb-4">
                  <label
                    htmlFor="testimonial"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Write a brief review (publicly shareable)
                  </label>
                  <textarea
                    id="testimonial"
                    rows={4}
                    value={testimonial}
                    onChange={handleTestimonialChange}
                    className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.testimonial ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Tell other entrepreneurs about your experience with Brandician AI..."
                  />
                  {errors.testimonial && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.testimonial}
                    </p>
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
                      {showName ? (
                        <Eye className="h-4 w-4 mr-1" />
                      ) : (
                        <EyeOff className="h-4 w-4 mr-1" />
                      )}
                      Show my name as {maskUserName(user?.name || "")} in
                      testimonials
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
                  <label
                    htmlFor="feedback"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
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

              {/* Error Display */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {errors.submit}
                </div>
              )}

              {/* Submit Button */}
              <div className="border-t pt-6">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary w-full inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-2">
                  Your feedback helps us improve Brandician AI for everyone
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialContainer;
