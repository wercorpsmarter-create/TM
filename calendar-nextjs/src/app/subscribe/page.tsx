// Example usage of PaymentButtonWithTerms in Next.js
// This file demonstrates how to integrate the PaymentButtonWithTerms component
// You can add this to any page where you want to show a subscription/payment button

'use client';

import PaymentButtonWithTerms from '@/components/PaymentButtonWithTerms';

export default function ExampleSubscriptionPage() {
    const handleCheckout = async () => {
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (data.url) {
                // Redirect to Stripe checkout
                window.location.href = data.url;
            } else {
                console.error('Failed to create checkout session:', data.error);
                alert('Failed to create checkout session. Please try again.');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Error connecting to payment service.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Unlock Task Master Pro</h1>
                    <p className="text-gray-300">Start your 14-day free trial today</p>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-start text-white">
                        <span className="mr-2">✓</span>
                        <div>
                            <h3 className="font-semibold">Unlimited Power</h3>
                            <p className="text-sm text-gray-300">Manage infinite tasks and habits</p>
                        </div>
                    </div>
                    <div className="flex items-start text-white">
                        <span className="mr-2">✓</span>
                        <div>
                            <h3 className="font-semibold">Smart Scheduling</h3>
                            <p className="text-sm text-gray-300">AI-driven calendar synchronization</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6 text-center">
                    <div className="inline-block bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-2">
                        14 DAYS FREE
                    </div>
                    <p className="text-gray-300 text-sm">
                        After your trial, it's just $19.00/month. Cancel anytime.
                    </p>
                </div>

                {/* Use the PaymentButtonWithTerms component */}
                <PaymentButtonWithTerms onCheckout={handleCheckout} />

                <p className="text-center text-gray-400 text-xs mt-6">
                    Secure payment processing by Stripe
                </p>
            </div>
        </div>
    );
}
