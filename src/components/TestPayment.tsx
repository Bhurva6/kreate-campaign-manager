import React, { useState } from 'react';
import RazorpayHandler from './RazorpayHandler';
import { PLANS } from '@/lib/credits';

export default function TestPayment() {
  const [logs, setLogs] = useState<Array<{type: 'success'|'error'|'info', message: string}>>([]);

  const addLog = (type: 'success'|'error'|'info', message: string) => {
    setLogs(prev => [...prev, { type, message }]);
  };

  const handleSuccess = () => {
    console.log('Payment successful!');
    addLog('success', 'Payment completed successfully!');
    alert('Payment successful! You now have access to the paid plan.');
  };

  const handleFailure = () => {
    console.log('Payment failed or was cancelled');
    addLog('error', 'Payment was cancelled or failed');
  };
  
  // Simple plan for direct Razorpay testing
  const testPlan = {
    id: 'test',
    name: 'Test',
    price: 1, // Just ₹1 for testing
    imageGenerations: 0,
    imageEdits: 0,
    description: 'Minimal amount for testing',
    features: ['Test payment of ₹1']
  };

  const testRazorpayManually = () => {
    addLog('info', 'Testing manual Razorpay implementation...');
    
    try {
      if (!(window as any).Razorpay) {
        addLog('error', 'Razorpay SDK not loaded! Check your network connection.');
        return;
      }

      const options = {
        key: 'rzp_test_WyK93y9mvps7SJ', // Standard test key
        amount: 100, // ₹1
        currency: 'INR',
        name: 'Test Payment',
        description: 'Testing Razorpay Integration',
        handler: function(response: any) {
          addLog('success', `Direct implementation worked! Payment ID: ${response.razorpay_payment_id}`);
        },
        modal: {
          ondismiss: function() {
            addLog('info', 'Direct test modal dismissed');
          }
        }
      };

      addLog('info', 'Creating Razorpay instance manually...');
      const razorpayObj = new (window as any).Razorpay(options);
      addLog('info', 'Opening Razorpay checkout...');
      razorpayObj.open();
    } catch (error) {
      addLog('error', `Manual test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Manual Razorpay test error:', error);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md my-6">
      <h2 className="text-xl font-bold mb-4">Test Razorpay Integration</h2>
      
      {/* Direct test button */}
      <div className="mb-6 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
        <h3 className="font-semibold text-md mb-2">Quick Test (₹1)</h3>
        <p className="text-sm text-gray-600 mb-3">
          Use this minimal test first to check if Razorpay works in your browser
        </p>
        
        <div className="flex space-x-2">
          <button
            onClick={testRazorpayManually}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Direct Razorpay Integration (₹1)
          </button>
        </div>
      </div>
      
      {/* Regular plans */}
      <div className="space-y-4">
        {PLANS.map((plan) => (
          <div key={plan.id} className="p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">{plan.name} - ₹{plan.price}</h3>
            <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
            
            <RazorpayHandler
              plan={plan}
              onSuccess={handleSuccess}
              onFailure={handleFailure}
              buttonText={`Test Pay ₹${plan.price}`}
            />
          </div>
        ))}
      </div>
      
      {/* Debug logs */}
      {logs.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h3 className="font-semibold mb-2">Debug Logs:</h3>
          <div className="bg-gray-100 p-3 rounded max-h-40 overflow-y-auto text-sm">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`mb-1 pl-2 border-l-4 ${
                  log.type === 'success' ? 'border-green-500 text-green-700' : 
                  log.type === 'error' ? 'border-red-500 text-red-700' : 
                  'border-blue-500 text-blue-700'
                }`}
              >
                {log.message}
              </div>
            ))}
          </div>
          <button 
            onClick={() => setLogs([])}
            className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded"
          >
            Clear Logs
          </button>
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t text-sm text-gray-500">
        <p className="font-medium">Test Card Details:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Card Number: 4111 1111 1111 1111</li>
          <li>Expiry: Any future date (e.g. 12/29)</li>
          <li>CVV: Any 3 digits (e.g. 123)</li>
          <li>Name: Any name</li>
        </ul>
      </div>
    </div>
  );
}
