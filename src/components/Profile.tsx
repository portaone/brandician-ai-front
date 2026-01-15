import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuthStore } from "../store/auth";
import Button from "./common/Button";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    setName(user?.name || "");
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.put("/api/v1.0/users/me", {
        name: name.trim(),
      });

      // Update the user in the auth store
      const updatedUser = response.data;
      useAuthStore.setState({ user: updatedUser });

      setIsEditing(false);
      setSuccess("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setIsEditing(false);
    setError(null);
  };

  if (!user) {
    return null;
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="bg-white rounded-lg shadow-md p-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Account</h1>

            {error && (
              <motion.div
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-red-600">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-green-600">{success}</p>
              </motion.div>
            )}

            <div className="space-y-6">
              {/* Email Field (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              {/* Name Field (Editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FD615E] focus:border-transparent"
                    placeholder="Enter your name"
                    disabled={isLoading}
                  />
                ) : (
                  <div className="flex items-center gap-4 flex-wrap">
                    <input
                      type="text"
                      value={user.name}
                      disabled
                      className="flex-1 min-w-[268px] px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                    />
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="secondary"
                      size="md"
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              {/* Account Info */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Account Information
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    Member since:{" "}
                    {new Date(user.created_at || "").toLocaleDateString()}
                  </p>
                  {user.updated_at && (
                    <p>
                      Last updated:{" "}
                      {new Date(user.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-200">
                {isEditing ? (
                  <div className="flex gap-4">
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="secondary"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => navigate("/brands")}
                      variant="secondary"
                      className="flex-1"
                    >
                      My Brands
                    </Button>
                    <Button
                      onClick={handleLogout}
                      variant="danger"
                      className="flex-1"
                    >
                      Log Out
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
