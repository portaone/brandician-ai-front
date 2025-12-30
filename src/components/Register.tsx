import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain, CheckCircle, Mail } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  companyName?: string;
  plan?: string;
}

interface RegisterProps {
  onRegister: (data: RegisterFormData) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "";

  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    name: "",
    companyName: "",
    plan: selectedPlan,
  });

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authMethod, setAuthMethod] = useState<"email" | "google">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (authMethod === "email") {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      // Submit the form
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, we would send the data to the server here
      // For now, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onRegister(formData);
      // Navigate to success page
      navigate("/registration-success");
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        submit: "An error occurred during registration. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthMethod("google");
    setIsSubmitting(true);

    try {
      // In a real app, we would trigger Google OAuth here
      // For now, we'll just simulate a delay and move to step 2
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Normally we'd get this from Google's response
      setFormData((prev) => ({
        ...prev,
        email: "google-user@example.com",
      }));

      setStep(2);
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErrors({
        submit: "An error occurred with Google sign-in. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center">
              <Brain className="text-primary-600 h-6 w-6 mr-2" />
              <span className="text-xl font-display font-bold text-neutral-800">
                Brandician.AI
              </span>
            </div>
          </div>

          <motion.div
            className="bg-white rounded-lg shadow-lg p-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`flex items-center ${
                    step === 1 ? "text-primary-600" : "text-neutral-400"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                      step === 1
                        ? "border-primary-600 bg-primary-50"
                        : "border-neutral-300"
                    }`}
                  >
                    1
                  </div>
                  <span className="ml-2 font-medium">Account</span>
                </div>
                <div
                  className={`h-0.5 flex-grow mx-2 ${
                    step >= 2 ? "bg-primary-400" : "bg-neutral-200"
                  }`}
                ></div>
                <div
                  className={`flex items-center ${
                    step === 2 ? "text-primary-600" : "text-neutral-400"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                      step === 2
                        ? "border-primary-600 bg-primary-50"
                        : "border-neutral-300"
                    }`}
                  >
                    2
                  </div>
                  <span className="ml-2 font-medium">Profile</span>
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-neutral-800">
                {step === 1 ? "Create your account" : "Complete your profile"}
              </h2>
              <p className="text-neutral-600">
                {step === 1
                  ? "Start your branding journey with a free account"
                  : "Tell us more about yourself and your business"}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNext();
              }}
              className="space-y-5"
            >
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <p className="text-neutral-700 mb-4">
                      Choose how you'd like to sign up:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAuthMethod("email")}
                        className={`flex items-center justify-center px-4 py-3 border ${
                          authMethod === "email"
                            ? "border-primary-400 bg-primary-50 text-primary-700"
                            : "border-neutral-300 hover:bg-neutral-50 text-neutral-700"
                        } rounded-md focus:outline-none transition-colors`}
                      >
                        <Mail className="h-5 w-5 mr-2" />
                        <span>Email</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className={`flex items-center justify-center px-4 py-3 border ${
                          authMethod === "google"
                            ? "border-primary-400 bg-primary-50 text-primary-700"
                            : "border-neutral-300 hover:bg-neutral-50 text-neutral-700"
                        } rounded-md focus:outline-none transition-colors`}
                        disabled={isSubmitting}
                      >
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                          <path fill="none" d="M1 1h22v22H1z" />
                        </svg>
                        <span>Google</span>
                      </button>
                    </div>
                  </div>

                  {authMethod === "email" && (
                    <div className="mb-4">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-neutral-700 mb-1"
                      >
                        Email address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full p-3 border ${
                          errors.email ? "border-red-500" : "border-neutral-300"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        placeholder="you@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.email}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-neutral-500">
                        We'll send a one-time password to this email address.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-4">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-neutral-700 mb-1"
                    >
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full p-3 border ${
                        errors.name ? "border-red-500" : "border-neutral-300"
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="First and last name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-neutral-700 mb-1"
                    >
                      Company/Project Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full p-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Your business or project name"
                    />
                  </div>

                  {selectedPlan && (
                    <div className="bg-primary-50 p-4 rounded-md mb-4">
                      <div className="flex items-center">
                        <CheckCircle className="text-primary-600 h-5 w-5 mr-2" />
                        <div>
                          <p className="font-medium text-neutral-800">
                            {selectedPlan.charAt(0).toUpperCase() +
                              selectedPlan.slice(1)}{" "}
                            Plan Selected
                          </p>
                          <p className="text-sm text-neutral-600">
                            You can change this later
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {errors.submit && (
                <div className="bg-red-50 p-4 rounded-md mb-4">
                  <p className="text-red-600">{errors.submit}</p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={isSubmitting}
                    className="flex items-center px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 mr-1" />
                    Back
                  </button>
                ) : (
                  <div></div> // Empty div for spacing
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
                >
                  {isSubmitting ? (
                    <span className="inline-block animate-spin mr-2">⟳</span>
                  ) : null}
                  {step === 2 ? "Create Account" : "Next"}
                  {step === 1 && <ArrowRight className="h-5 w-5 ml-1" />}
                </button>
              </div>
            </form>
          </motion.div>

          <div className="mt-6 text-center text-neutral-500 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
