'use client';

import { useEffect } from 'react';

export default function UPITest() {
  // Load Razorpay script when component mounts
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleClick = () => {
    if (!(window as any).Razorpay) {
      alert('Razorpay SDK not loaded yet. Please try again in a moment.');
      return;
    }

    const options = {
      key: 'rzp_live_RCLRfxSb4IfcwU',
      amount: 100, // ₹1
      currency: 'INR',
      name: 'UPI Test',
      description: 'Testing UPI payment',
      prefill: {
        name: 'Test User',
        email: 'test@example.com',
        contact: '9999999999',
      },
      // Force UPI payment method
      config: {
        display: {
          blocks: {
            banks: {
              name: 'Pay using UPI',
              instruments: [
                {
                  method: 'upi'
                }
              ]
            }
          },
          sequence: ['block.banks'],
          preferences: {
            show_default_blocks: false
          }
        }
      },
      handler: function(response: any) {
        console.log('Payment successful:', response);
        alert('Payment succeeded: ' + response.razorpay_payment_id);
      }
    };

    try {
      const razorpayObj = new (window as any).Razorpay(options);
      razorpayObj.on('payment.failed', function (resp: any) {
        console.error('Payment failed. Error:', resp.error);
        alert('Payment failed: ' + resp.error.description);
      });
      razorpayObj.open();
    } catch (error) {
      console.error('Error during Razorpay initialization:', error);
      alert('Error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-2">UPI Payment Test</h2>
      <p className="text-sm text-gray-600 mb-4">Try UPI payment instead of credit card (works better in India)</p>
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        Test UPI Payment (₹1)
      </button>
    </div>
  );
}
