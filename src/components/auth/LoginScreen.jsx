import React from 'react';
import { Calendar, Shield, Zap, ArrowRight, CheckCircle } from 'lucide-react';

const LoginScreen = ({ onLogin, isPostPayment }) => {
    return (
        <div className="login-screen">
            <div className="login-content glass-card">
                <div className="login-header">
                    <div className="logo-container">
                        <Calendar size={48} className="logo-icon" />
                    </div>
                    <h1>{isPostPayment ? 'Payment Successful!' : 'Task Master'}</h1>
                    <p className="subtitle">
                        {isPostPayment
                            ? 'Please sign in to finalize your account setup'
                            : 'Master Your Productivity Journey'}
                    </p>
                </div>

                <div className="features-grid">
                    <div className="feature-item">
                        <Zap size={20} className="feature-icon" />
                        <div>
                            <h4>Smart Sync</h4>
                            <p>Automated Google Calendar integration</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <Shield size={20} className="feature-icon" />
                        <div>
                            <h4>Privacy First</h4>
                            <p>Local-first storage for your tasks</p>
                        </div>
                    </div>
                </div>

                <div className="login-actions">
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="terms-check"
                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', accentColor: 'var(--primary)' }}
                            onChange={(e) => {
                                const btn = document.getElementById('google-login-btn');
                                if (btn) {
                                    btn.disabled = !e.target.checked;
                                    btn.style.opacity = e.target.checked ? '1' : '0.5';
                                    btn.style.pointerEvents = e.target.checked ? 'auto' : 'none';
                                }
                            }}
                        />
                        <label htmlFor="terms-check" style={{ fontSize: '0.9rem', color: '#666' }}>
                            I agree to the <a href="/terms" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Terms</a> and <a href="/privacy" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Privacy Policy</a>
                        </label>
                    </div>

                    <button
                        id="google-login-btn"
                        className="login-btn"
                        onClick={onLogin}
                        disabled={true}
                        style={{ opacity: 0.5, pointerEvents: 'none', transition: 'all 0.3s' }}
                    >
                        <span>Sign in with Google</span>
                        <ArrowRight size={18} />
                    </button>
                    <p className="login-footer">
                        Secure authentication powered by Google OAuth
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

export default LoginScreen;
