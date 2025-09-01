'use client';

import { useEffect } from 'react';

export default function MinimalTest() {
  // Load Razorpay script when component mounts
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    // Clean up
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleClick = () => {
    if (!(window as any).Razorpay) {
      alert('Razorpay SDK not loaded yet. Please try again in a moment.');
      return;
    }

    const options = {
      key: 'rzp_live_RCLRfxSb4IfcwU', // Different Razorpay test key
      amount: 100, // ₹1
      currency: 'INR',
      name: 'Minimal Test',
      description: 'Simplest possible test',
      prefill: {
        name: 'Test User',
        email: 'test@example.com',
        contact: '9999999999',
      },
      handler: function(response: any) {
        console.log('Payment successful:', response);
        alert('Payment succeeded: ' + response.razorpay_payment_id);
      }
    };

    try {
      // Initialize Razorpay
      const razorpayObj = new (window as any).Razorpay(options);
      
      // Add specific error handler
      razorpayObj.on('payment.failed', function (resp: any) {
        console.error('Payment failed. Error:', resp.error);
        alert('Payment failed: ' + resp.error.description);
      });
      
      // Open payment form
      razorpayObj.open();
    } catch (error) {
      console.error('Error during Razorpay initialization:', error);
      alert('Error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-lg shadow-lg my-8 text-center">
      <h2 className="text-xl font-bold mb-4">Minimal Razorpay Test</h2>
      <p className="mb-6 text-gray-600">This is the simplest possible Razorpay implementation with minimal code.</p>
      
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Test ₹1 Payment
      </button>
      
      <div className="mt-6 pt-4 border-t text-sm text-gray-500 text-left">
        <p className="font-medium">Test Card Details:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Card Number: <span className="font-mono">4111 1111 1111 1111</span></li>
          <li>Expiry: Any future date</li>
          <li>CVV: Any 3 digits</li>
          <li>Name: Any name</li>
          <li>3D Secure Password: <span className="font-mono">1234</span></li>
        </ul>
      </div>
    </div>
  );
}
