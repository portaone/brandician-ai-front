import { AlertCircle, LayoutDashboard } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GetHelpButton from "./common/GetHelpButton";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
      <motion.div
        className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <AlertCircle className="h-16 w-16 text-primary-500 mx-auto mb-4" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/brands")}
            className="w-full inline-flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </button>

          <GetHelpButton variant="secondary" size="lg" className="w-full" />
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
