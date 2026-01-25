import React, { useState } from 'react';

export default function PaymentButtonWithTerms({ onCheckout }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
        setIsChecked(false); // Reset checkbox when opening
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsChecked(false);
    };

    const [shake, setShake] = useState(false);

    const handleContinue = () => {
        if (isChecked) {
            handleCloseModal();
            onCheckout();
        } else {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            // Optional: alert('Please agree to the terms to continue.');
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleCloseModal();
        }
    };

    // Handle ESC key
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            handleCloseModal();
        }
    };

    return (
        <>
            {/* Subscribe Button */}
            <button
                onClick={handleOpenModal}
                style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(96, 165, 250, 0.4)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(96, 165, 250, 0.6)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(96, 165, 250, 0.4)';
                }}
            >
                Start My Free Trial →
            </button>

            {/* Modal */}
            {isModalOpen && (
                <div
                    onClick={handleBackdropClick}
                    onKeyDown={handleKeyDown}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '1rem',
                        animation: 'fadeIn 0.2s ease-out',
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '20px',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                            maxWidth: '500px',
                            width: '100%',
                            padding: '2rem',
                            position: 'relative',
                            animation: shake ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'slideUp 0.3s ease-out',
                            transform: shake ? 'translate3d(0, 0, 0)' : 'none',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleCloseModal}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                color: '#999',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#333')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
                            aria-label="Close modal"
                        >
                            ✕
                        </button>

                        {/* Modal Header */}
                        <h2
                            id="modal-title"
                            style={{
                                fontSize: '1.75rem',
                                fontWeight: '700',
                                color: '#1a1a1a',
                                marginBottom: '1rem',
                            }}
                        >
                            Terms of Service Agreement
                        </h2>

                        {/* Terms Summary */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                                Before proceeding, please review:
                            </p>

                            <div
                                style={{
                                    background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%)',
                                    borderRadius: '12px',
                                    padding: '1.25rem',
                                    border: '1px solid #e0e7ff',
                                }}
                            >
                                <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start' }}>
                                    <span style={{ color: '#667eea', marginRight: '0.5rem', fontWeight: 'bold' }}>•</span>
                                    <span style={{ fontSize: '0.95rem', color: '#333' }}>
                                        <strong>Monthly subscription:</strong> $19.00/month
                                    </span>
                                </div>
                                <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start' }}>
                                    <span style={{ color: '#667eea', marginRight: '0.5rem', fontWeight: 'bold' }}>•</span>
                                    <span style={{ fontSize: '0.95rem', color: '#333' }}>
                                        <strong>14-day free trial</strong> included
                                    </span>
                                </div>
                                <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start' }}>
                                    <span style={{ color: '#dc2626', marginRight: '0.5rem', fontWeight: 'bold' }}>•</span>
                                    <span style={{ fontSize: '0.95rem', color: '#333' }}>
                                        <strong>No refunds</strong> for any reason
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <span style={{ color: '#667eea', marginRight: '0.5rem', fontWeight: 'bold' }}>•</span>
                                    <span style={{ fontSize: '0.95rem', color: '#333' }}>
                                        <strong>Automatic renewal</strong> unless canceled
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Checkbox */}
                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                marginBottom: '1.5rem',
                                cursor: 'pointer',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => setIsChecked(e.target.checked)}
                                style={{
                                    marginTop: '0.25rem',
                                    width: '1.25rem',
                                    height: '1.25rem',
                                    cursor: 'pointer',
                                    accentColor: '#60a5fa',
                                }}
                            />
                            <span style={{ marginLeft: '0.75rem', fontSize: '0.95rem', color: '#333' }}>
                                I agree to the{' '}
                                <a
                                    href="/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: '#60a5fa',
                                        textDecoration: 'underline',
                                        fontWeight: '600',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Terms of Service
                                </a>
                            </span>
                        </label>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={handleCloseModal}
                                style={{
                                    flex: 1,
                                    padding: '0.875rem',
                                    border: '2px solid #ddd',
                                    background: 'white',
                                    color: '#555',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f5f5f5';
                                    e.currentTarget.style.borderColor = '#bbb';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.borderColor = '#ddd';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleContinue}
                                style={{
                                    flex: 1,
                                    padding: '0.875rem',
                                    border: 'none',
                                    background: isChecked
                                        ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
                                        : '#e0e0e0',
                                    color: isChecked ? 'white' : '#999',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: isChecked ? '0 4px 15px rgba(96, 165, 250, 0.4)' : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    if (isChecked) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(96, 165, 250, 0.6)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isChecked) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(96, 165, 250, 0.4)';
                                    }
                                }}
                            >
                                Continue to Payment
                            </button>
                        </div>
                    </div>

                    <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes shake {
              10%, 90% { transform: translate3d(-1px, 0, 0); }
              20%, 80% { transform: translate3d(2px, 0, 0); }
              30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
              40%, 60% { transform: translate3d(4px, 0, 0); }
            }
          `}</style>
                </div>
            )}
        </>
    );
}
