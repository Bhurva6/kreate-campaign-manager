'use client';

import { useState } from 'react';
import { signInWithGooglePopup } from '@/lib/google-oauth';

export default function AuthTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const authResult = await signInWithGooglePopup();
      setResult(authResult);
      
      if (authResult.success) {
        console.log('Authentication successful!', authResult.user);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testProtectedRoute = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });
      
      const data = await response.json();
      setUserInfo(data);
    } catch (error) {
      console.error('Protected route test failed:', error);
      setUserInfo({ error: 'Failed to fetch user info' });
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        setResult(null);
        setUserInfo(null);
        console.log('Logged out successfully');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
      
      <div className="space-y-6">
        {/* Google Sign In */}
        <div className="border p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-4">Google OAuth Test</h2>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
          
          {result && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <h3 className="font-semibold">Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Protected Route Test */}
        <div className="border p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-4">Protected Route Test</h2>
          <button
            onClick={testProtectedRoute}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Test /api/auth/me
          </button>
          
          {userInfo && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <h3 className="font-semibold">User Info:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(userInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="border p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-4">Logout Test</h2>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800">Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 mt-2 space-y-1">
          <li>Make sure your environment variables are properly set</li>
          <li>Test Google Sign In first</li>
          <li>If successful, test the protected route to verify JWT cookies work</li>
          <li>Test logout to ensure sessions are properly cleared</li>
        </ol>
      </div>
    </div>
  );
}
