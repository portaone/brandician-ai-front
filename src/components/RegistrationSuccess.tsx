import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const RegistrationSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-12 flex items-center">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="text-primary-600 h-10 w-10" />
          </motion.div>

          <h2 className="text-2xl font-display font-bold text-neutral-800 mb-4">
            Account Created Successfully!
          </h2>

          <p className="text-neutral-600 mb-8">
            You're all set to begin your brand creation journey. We're excited
            to help you build a brand that stands out and resonates with your
            audience.
          </p>

          <Link
            to="/questionnaire"
            className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
          >
            Start Brand Questionnaire
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>

          <p className="mt-6 text-sm text-neutral-500">
            We've also sent a confirmation email to your inbox with additional
            information.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
