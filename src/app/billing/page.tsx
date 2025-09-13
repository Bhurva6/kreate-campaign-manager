"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { useCredits, Plan, PLANS } from "../../lib/credits";
import Link from "next/link";
import RazorpayHandler from "../../components/RazorpayHandler";
import { FiArrowLeft, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

// Metadata is defined in layout.tsx

export default function BillingPage() {
  // State to track if component has mounted
  const [hasMounted, setHasMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Mark the component as mounted after initial render
  useEffect(() => {
    setHasMounted(true);
    
    // Check for dark mode preference from system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const darkModeFromSystem = mediaQuery.matches;
    
    // Check if body has dark mode class which may be set by the app
    const bodyHasDarkClass = document.body.classList.contains('dark') || 
                            document.documentElement.classList.contains('dark');
    
    setIsDarkMode(darkModeFromSystem || bodyHasDarkClass);
    
    // Listen for changes in theme
    const handleThemeChange = () => {
      const isDark = document.body.classList.contains('dark') || 
                   document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    // Set up observer for theme changes
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  const { user } = useAuth();
  const { activePlan, imageGenerationsUsed, imageEditsUsed, imageGenerationsLimit, imageEditsLimit } = useCredits();
  
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(false);
  
  interface Transaction {
    id: string;
    date: string;
    planName: string;
    amount: number;
    status: string;
  }
  
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Define the pricing plans for the billing page
  const billingPlans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      imageGenerations: 10,
      imageEdits: 10,
      description: "Quick start",
      features: [
        '10 image generations',
        'Basic tools',
        'Download & share'
      ]
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 700,
      imageGenerations: 140,
      imageEdits: 140,
      description: "Get started",
      features: [
        '140 image generations',
        'Basic editing tools',
        'HD quality',
        'Download & share'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 2200,
      imageGenerations: 600,
      imageEdits: 600,
      description: "For creators",
      features: [
        '600 image generations',
        'Priority processing',
        'Advanced editing tools',
        '4K quality',
        'AI style transfer'
      ]
    },
    {
      id: 'max',
      name: 'Max',
      price: 6000,
      imageGenerations: 1000,
      imageEdits: 1000,
      description: "Power user",
      features: [
        '1000 image generations',
        'Fastest processing',
        'All editing tools',
        '8K quality',
        'Batch processing',
        'API access'
      ]
    },
  ];

  // Handle successful payment
  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setPaymentError(false);
    // Show success message for 3 seconds
    setTimeout(() => setPaymentSuccess(false), 3000);
    // Refresh transaction history after payment
    fetchTransactionHistory();
  };
  
  // Handle payment failure
  const handlePaymentFailure = () => {
    setPaymentError(true);
    setPaymentSuccess(false);
    // Show error message for 3 seconds
    setTimeout(() => setPaymentError(false), 3000);
  };

  // Mock function to fetch transaction history - in a real app this would call an API
  const fetchTransactionHistory = async () => {
    setLoading(true);
    try {
      // Mock data - this would be replaced with an actual API call
      const mockTransactions = [
        {
          id: 'txn_123456',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          planName: 'Pro Plan',
          amount: 2200,
          status: 'completed'
        },
        {
          id: 'txn_123455',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          planName: 'Basic Plan',
          amount: 700,
          status: 'completed'
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTransactionHistory(mockTransactions);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactionHistory();
    }
  }, [user]);

  // hasMounted is already handling the initial render check

  // Only render content after client-side hydration is complete
  if (!hasMounted) {
    return null; // Return empty on server-side or first render
  }
  
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        isDarkMode ? 'bg-[#1E1E1E]' : 'bg-gradient-to-br from-gray-50 to-gray-100'
      }`}>
        <div className={`max-w-md w-full rounded-xl shadow-lg p-8 text-center transition-colors duration-300 ${
          isDarkMode ? 'bg-[#2A2A2A]' : 'bg-white'
        }`}>
          <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>Authentication Required</h2>
          <p className={`mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Please sign in to access your billing information.</p>
          <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Theme detection is handled in the first useEffect

  return (
    <div className={`min-h-screen py-12 px-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#1E1E1E] text-white' 
        : 'bg-gradient-to-br from-gray-50 to-gray-100'
    }`}>
      {/* Success and error notifications */}
      {paymentSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg flex items-center">
          <FiCheckCircle className="mr-2" size={20} />
          Payment successful! Your plan has been activated.
        </div>
      )}
      
      {paymentError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg flex items-center">
          <FiAlertCircle className="mr-2" size={20} />
          Payment failed. Please try again.
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center">
          <Link href="/" className={`flex items-center transition mr-4 ${
            isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'
          }`}>
            <FiArrowLeft className="mr-2" />
            Back to Home
          </Link>
          <h1 className={`text-3xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>Billing & Subscriptions</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Plan Section */}
          <div className={`col-span-1 rounded-xl shadow-md p-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-[#2A2A2A] text-white' : 'bg-white text-gray-800'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>Current Plan</h2>
            
            <div className={`rounded-lg p-4 mb-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'
            }`}>
              <h3 className={`text-lg font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-800'
              }`}>
                {activePlan ? activePlan.name : 'Free'} Plan
              </h3>
              <p className={`mt-1 text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-700'
              }`}>
                {activePlan ? `${activePlan.imageGenerations} credits` : '3 free generations, 7 free edits'}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Generations Used:</span>
                <span className="font-medium">{imageGenerationsUsed} / {imageGenerationsLimit}</span>
              </div>
              
              <div className="flex justify-between">
                <span className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Edits Used:</span>
                <span className="font-medium">{imageEditsUsed} / {imageEditsLimit}</span>
              </div>
              
              <div className={`h-2 rounded-full overflow-hidden transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(imageGenerationsUsed / imageGenerationsLimit) * 100}%` }}
                ></div>
              </div>
              
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Plan renews automatically every 30 days. Cancel anytime.
              </p>
            </div>
          </div>
          
          {/* Plan Selection */}
          <div className="col-span-1 lg:col-span-2">
            <h2 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>Available Plans</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {billingPlans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`border rounded-xl shadow-sm p-5 transition-all duration-300 hover:shadow-md ${
                    isDarkMode 
                      ? `bg-[#2A2A2A] ${activePlan?.id === plan.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-700'}` 
                      : `bg-white ${activePlan?.id === plan.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200'}`
                  }`}
                >
                  <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>{plan.name}</h3>
                  <p className={`text-sm mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>{plan.description}</p>
                  
                  <div className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    ₹{plan.price.toLocaleString()}
                    <span className={`text-sm font-normal transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>/month</span>
                  </div>
                  
                  <ul className={`text-sm mb-5 space-y-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <RazorpayHandler 
                    plan={plan}
                    buttonText={activePlan?.id === plan.id ? 'Current Plan' : 'Choose Plan'}
                    customClassName={`w-full py-2 px-4 rounded-lg text-sm font-medium transition ${
                      activePlan?.id === plan.id 
                        ? isDarkMode
                          ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Transaction History */}
          <div className={`col-span-1 lg:col-span-3 rounded-xl shadow-md p-6 mt-8 transition-colors duration-300 ${
            isDarkMode ? 'bg-[#2A2A2A]' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>Transaction History</h2>
            
            {loading ? (
              <div className="py-10 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                <p className={`mt-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Loading transactions...</p>
              </div>
            ) : transactionHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b transition-colors duration-300 ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <th className={`pb-3 font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>Date</th>
                      <th className={`pb-3 font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>Transaction ID</th>
                      <th className={`pb-3 font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>Plan</th>
                      <th className={`pb-3 font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>Amount</th>
                      <th className={`pb-3 font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionHistory.map((transaction) => (
                      <tr key={transaction.id} className={`border-b transition-colors duration-300 ${
                        isDarkMode ? 'border-gray-800' : 'border-gray-100'
                      }`}>
                        <td className={`py-3 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className={`py-3 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {transaction.id}
                        </td>
                        <td className={`py-3 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {transaction.planName}
                        </td>
                        <td className={`py-3 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          ₹{transaction.amount.toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>No transactions found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
