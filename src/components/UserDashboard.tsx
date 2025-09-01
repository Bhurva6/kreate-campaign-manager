'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useCredits } from '@/lib/credits';
import UsageCounter from './UsageCounter';
import UpgradeCTA from './UpgradeCTA';
import { formatDistanceToNow } from 'date-fns';

interface PaymentRecord {
  id: string;
  date: Date;
  amount: number;
  plan: string;
  status: 'successful' | 'pending' | 'failed';
}

export default function UserDashboard() {
  const { user } = useAuth();
  const { activePlan, isPaidUser } = useCredits();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments'>('overview');
  
  // Calculate subscription end date (30 days from now as an example)
  // In a real app, you would store and retrieve this from your backend
  const subscriptionEnds = user ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
  
  // This would typically come from your backend
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([
    // Example data, in a real app this would come from your API
    {
      id: 'pay_123456789',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      amount: 499,
      plan: 'Basic',
      status: 'successful'
    },
    {
      id: 'pay_987654321',
      date: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000), // 37 days ago
      amount: 499,
      plan: 'Basic',
      status: 'successful'
    }
  ]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Account Dashboard</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{user.displayName || user.email}</h2>
              <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
              
              {isPaidUser && subscriptionEnds && (
                <p className="text-sm mt-2">
                  <span className="font-medium">Plan renews: </span> 
                  <span>{formatDistanceToNow(new Date(subscriptionEnds), { addSuffix: true })}</span>
                </p>
              )}
            </div>
            
            <div className="mt-4 md:mt-0">
              {!isPaidUser && (
                <UpgradeCTA variant="button" showDescription={false} />
              )}
              
              {isPaidUser && (
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center">
                  <span className="mr-2">✓</span> {activePlan?.name} Plan
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-3 px-4 text-center ${
                activeTab === 'overview'
                  ? 'bg-gray-100 dark:bg-gray-700 font-medium'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-3 px-4 text-center ${
                activeTab === 'payments'
                  ? 'bg-gray-100 dark:bg-gray-700 font-medium'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Payment History
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UsageCounter />
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Plan Details</h3>
            
            {isPaidUser ? (
              <div>
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span>Current Plan:</span>
                    <span className="font-semibold">{activePlan?.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Price:</span>
                    <span className="font-semibold">₹{activePlan?.price}/month</span>
                  </div>
                  {subscriptionEnds && (
                    <div className="flex justify-between">
                      <span>Next billing date:</span>
                      <span className="font-semibold">{new Date(subscriptionEnds).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <UpgradeCTA variant="button" preferredPlan="pro" showDescription={false} />
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-4">You are currently on the free plan with limited features.</p>
                <p className="mb-4 text-gray-600 dark:text-gray-400">Upgrade to unlock more features and increase your usage limits.</p>
                <UpgradeCTA variant="button" showDescription={false} />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.date.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {payment.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.plan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        ₹{payment.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${payment.status === 'successful' ? 'bg-green-100 text-green-800' : 
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No payment history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {!isPaidUser && (
            <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <p className="text-center mb-4">Ready to upgrade your experience?</p>
              <div className="flex justify-center">
                <UpgradeCTA variant="button" showDescription={false} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
