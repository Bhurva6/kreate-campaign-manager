import { useEffect } from 'react';
import { useCredits, Plan } from '@/lib/credits';
import { useAuth } from '@/lib/auth';

interface RazorpayHandlerProps {
  plan: Plan;
  onSuccess?: (paymentId: string) => void;
  onFailure?: () => void;
  buttonText?: string;
  customClassName?: string;
}

const RazorpayHandler = ({ 
  plan, 
  onSuccess, 
  onFailure, 
  buttonText = 'Pay Now', 
  customClassName 
}: RazorpayHandlerProps) => {
  const { handleSuccessfulPayment } = useCredits();
  const { user } = useAuth();

  // Load Razorpay script
  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      console.log('Razorpay script already exists');
      return;
    }

    console.log('Loading Razorpay script...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      console.log('Razorpay object available:', !!(window as any).Razorpay);
    };
    script.onerror = (err) => console.error('Error loading Razorpay script:', err);
    document.body.appendChild(script);

    return () => {
      // Don't remove the script on component unmount as it might be needed by other components
    };
  }, []);

  const handlePayment = () => {
    console.log('Payment button clicked!');
    
    if (!user) {
      alert('Please log in to purchase a plan');
      return;
    }

    console.log('Attempting to open Razorpay with plan:', plan, 'User:', user?.email);

    // Check if Razorpay script is loaded
    if (!(window as any).Razorpay) {
      console.error('Razorpay script not loaded! Please check your network connection or try again.');
      console.error('Window object keys:', Object.keys(window));
      alert('Payment gateway is not loaded. Please check your internet connection and try again.');
      
      // Try loading the script again
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('Razorpay script loaded on demand - retrying payment flow');
        setTimeout(() => handlePayment(), 500); // Retry after script is loaded
      };
      script.onerror = (err) => console.error('Error loading Razorpay script on demand:', err);
      document.body.appendChild(script);
      
      if (onFailure) onFailure();
      return;
    }

    // Prepare basic options for Razorpay
    const options = {
      key: 'rzp_live_RCLRfxSb4IfcwU', // Your live Razorpay key
      amount: plan.price * 100, // Amount in paisa (multiply by 100)
      currency: 'INR',
      name: 'GoLoco',
      description: `${plan.name} Plan`,
      image: '/logo.png', // Your logo URL
      
      // Order ID is not required for test payments
      // order_id: "order_DBJOWzybf0sJbb", // Generate this server-side for production
      
      // Payment success handler
      handler: function(response: any) {
        console.log('Payment successful with full response:', response);
        // Validate we have payment ID
        if (response.razorpay_payment_id) {
          handleSuccessfulPayment(plan.id, response.razorpay_payment_id);
          if (onSuccess) onSuccess(response.razorpay_payment_id);
        } else {
          console.error('No payment ID received:', response);
          if (onFailure) onFailure();
        }
      },
      
      // User info prefill
      prefill: {
        name: user.displayName || 'Test User',
        email: user.email || 'test@example.com',
        contact: '9999999999', // Razorpay requires a contact number for Indian payments
      },
      
      // Notes can be used to store additional info
      notes: {
        plan_id: plan.id,
        user_id: user.uid || '',
      },
      
      // Theme customization
      theme: {
        color: '#0171B9',
      },
      
      // Modal callbacks
      modal: {
        ondismiss: function() {
          console.log('Payment modal dismissed by user');
          if (onFailure) onFailure();
        },
        escape: true, // Allow closing with ESC key
      },
      
      // Enable this for international payments
      // method: { netbanking: true, card: true, wallet: true, upi: true }
    };
    
    try {
      console.log('Creating Razorpay instance with options:', JSON.stringify(options, null, 2));
      console.log('Razorpay constructor available:', typeof (window as any).Razorpay);
      
      // Create and configure Razorpay instance
      if (typeof (window as any).Razorpay !== 'function') {
        throw new Error('Razorpay constructor is not available. Script might not be loaded correctly.');
      }
      
      const paymentObject = new (window as any).Razorpay(options);
      console.log('Razorpay instance created successfully:', paymentObject);
      
      // Add additional event listeners for debugging
      paymentObject.on('payment.failed', function (resp: any){
        console.error('Payment failed:', resp.error);
        alert(`Payment failed: ${resp.error.description}`);
        if (onFailure) onFailure();
      });
      
      // Open the payment dialog
      console.log('Opening Razorpay payment dialog');
      paymentObject.open();
      console.log('Razorpay dialog opened');
      
    } catch (error) {
      console.error('Razorpay initialization error:', error);
      alert('Error opening payment window: ' + (error instanceof Error ? error.message : 'Unknown error'));
      if (onFailure) onFailure();
    }
  };

  const buttonClassName = customClassName || 
    'py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all';
  
  return (
    <button 
      onClick={handlePayment}
      className={buttonClassName}
    >
      {buttonText}
    </button>
  );
};

export default RazorpayHandler;
