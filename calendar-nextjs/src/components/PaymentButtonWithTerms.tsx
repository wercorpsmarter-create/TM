'use client';

import { useState } from 'react';

interface PaymentButtonWithTermsProps {
    onCheckout: () => void;
}

export default function PaymentButtonWithTerms({ onCheckout }: PaymentButtonWithTermsProps) {
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

    const handleContinue = () => {
        if (isChecked) {
            handleCloseModal();
            onCheckout();
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleCloseModal();
        }
    };

    // Handle ESC key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCloseModal();
        }
    };

    return (
        <>
            {/* Subscribe Button */}
            <button
                onClick={handleOpenModal}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
                Start My Free Trial →
            </button>

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={handleBackdropClick}
                    onKeyDown={handleKeyDown}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
                        {/* Close button */}
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Close modal"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Modal Header */}
                        <h2 id="modal-title" className="text-2xl font-bold text-gray-900 mb-4">
                            Terms of Service Agreement
                        </h2>

                        {/* Terms Summary */}
                        <div className="mb-6 space-y-3 text-gray-700">
                            <p className="text-sm text-gray-600 mb-4">Before proceeding, please review:</p>

                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 space-y-2 border border-blue-100">
                                <div className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    <span className="text-sm"><strong>Monthly subscription:</strong> $19.00/month</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    <span className="text-sm"><strong>14-day free trial</strong> included</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-red-600 mr-2">•</span>
                                    <span className="text-sm"><strong>No refunds</strong> for any reason</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    <span className="text-sm"><strong>Automatic renewal</strong> unless canceled</span>
                                </div>
                            </div>
                        </div>

                        {/* Checkbox */}
                        <label className="flex items-start mb-6 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => setIsChecked(e.target.checked)}
                                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                                I agree to the{' '}
                                <a
                                    href="https://taskmastercorp.org/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Terms of Service
                                </a>
                            </span>
                        </label>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleContinue}
                                disabled={!isChecked}
                                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isChecked
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Continue to Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
