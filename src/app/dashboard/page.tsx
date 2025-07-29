"use client";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FaStar, FaUser, FaEnvelope, FaSignOutAlt, FaCheck } from "react-icons/fa";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <FaStar className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Kreate</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Kreate! 🎉
            </h1>
            <p className="text-lg text-gray-600">
              You've successfully logged in to your dashboard.
            </p>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <FaUser className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.name || 'Welcome User'}
              </h2>
              
              <div className="flex items-center justify-center space-x-2">
                <FaEnvelope className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{user?.email}</span>
                {user?.isEmailVerified && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <FaCheck className="w-3 h-3" />
                    <span className="text-xs">Verified</span>
                  </div>
                )}
              </div>

              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Authentication Method: {user?.provider === 'google' ? 'Google SSO' : 'Email/Password'}
              </div>
            </div>
          </div>

          {/* Authentication Status */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Security Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email Verified</span>
                  <div className={`inline-flex items-center space-x-1 ${user?.isEmailVerified ? 'text-green-600' : 'text-orange-600'}`}>
                    <FaCheck className="w-3 h-3" />
                    <span className="text-sm font-medium">
                      {user?.isEmailVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Active</span>
                  <div className="inline-flex items-center space-x-1 text-green-600">
                    <FaCheck className="w-3 h-3" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Two-Factor Auth</span>
                  <div className="inline-flex items-center space-x-1 text-gray-500">
                    <span className="text-sm font-medium">Available Soon</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">
                  Create New Campaign
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors">
                  View Analytics
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors">
                  Account Settings
                </button>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheck className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Authentication Complete!
                </h4>
                <p className="text-gray-600 mt-1">
                  Your account is now fully set up and secure. You can now access all features of the Kreate platform.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
