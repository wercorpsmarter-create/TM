import React, { useState } from 'react';
import { ShieldCheck, Zap, Clock, ArrowRight, Loader2 } from 'lucide-react';
import PaymentButtonWithTerms from './PaymentButtonWithTerms';

const SubscriptionPaywall = ({ onSubscribe, onLogin }) => {
    const [loading, setLoading] = useState(false);

    const handleStartTrial = async () => {
        setLoading(true);
        try {
            await onSubscribe();
        } catch (error) {
            console.error('Subscription error:', error);
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-content glass-card subscription-card">
                <div className="login-header">
                    <div className="logo-container">
                        <ShieldCheck size={48} className="logo-icon active-icon" />
                    </div>
                    <h1>Unlock Task Master Pro</h1>
                    <p className="subtitle">Start your 14-day free trial today</p>
                </div>

                <div className="features-grid">
                    <div className="feature-item">
                        <Zap size={20} className="feature-icon" />
                        <div>
                            <h4>Unlimited Power</h4>
                            <p>Manage infinite tasks and habits</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <Clock size={20} className="feature-icon" />
                        <div>
                            <h4>Smart Scheduling</h4>
                            <p>AI-driven calendar synchronization</p>
                        </div>
                    </div>
                </div>

                <div className="trial-details">
                    <div className="trial-badge">14 DAYS FREE</div>
                    <p>After your trial, it's just $19.00/month. Cancel anytime.</p>
                </div>

                <div className="login-actions">
                    <PaymentButtonWithTerms onCheckout={handleStartTrial} />

                    <button
                        className="login-btn"
                        onClick={onLogin}
                        disabled={loading}
                        style={{
                            background: '#000000',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            marginTop: '1rem'
                        }}
                    >
                        <span>Already have an account? Login</span>
                    </button>

                    <p className="login-footer" style={{ color: '#9ca3af' }}>
                        Secure payment processing by Stripe
                        <br />
                        <a href="/privacy" style={{ color: 'inherit', textDecoration: 'underline', fontSize: '0.7rem', opacity: 0.7 }}>
                            Privacy Policy
                        </a>
                        {' • '}
                        <a href="/terms" style={{ color: 'inherit', textDecoration: 'underline', fontSize: '0.7rem', opacity: 0.7 }}>
                            Terms of Service
                        </a>
                    </p>
                </div>
            </div>

            <div className="bg-decorations">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>
        </div>
    );
};

export default SubscriptionPaywall;
