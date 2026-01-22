import React from 'react';
import { Calendar, Shield, Zap, ArrowRight } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
    return (
        <div className="login-screen">
            <div className="login-content glass-card">
                <div className="login-header">
                    <div className="logo-container">
                        <Calendar size={48} className="logo-icon" />
                    </div>
                    <h1>Task Master</h1>
                    <p className="subtitle">Master Your Productivity Journey</p>
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
                    <button className="login-btn" onClick={onLogin}>
                        <span>Get Started with Google</span>
                        <ArrowRight size={18} />
                    </button>
                    <p className="login-footer">
                        Secure authentication powered by Google OAuth
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
