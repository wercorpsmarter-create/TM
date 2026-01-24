import React from 'react';

const Privacy = () => {
    const containerStyle = {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 40px',
        fontFamily: 'sans-serif',
        color: '#0f172a', // Black text
        lineHeight: '1.6',
        textAlign: 'left',
        background: 'white',
        borderRadius: '16px',
        marginTop: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    };

    const handleBack = () => {
        window.history.pushState({}, '', '/');
        window.location.reload();
    };

    return (
        <div style={containerStyle}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Privacy Policy</h1>
            <p style={{ color: '#999', marginBottom: '2rem' }}>Last Updated: January 22, 2026</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '1rem' }}>1. Introduction</h2>
                <p>Task Master (hereinafter referred to as "the Company") recognizes the importance of protecting personal information and will observe the Act on the Protection of Personal Information (Japanese Law) and other relevant laws and regulations. We strive to handle personal information appropriately in accordance with this Privacy Policy.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '1rem' }}>2. Information We Collect</h2>
                <p style={{ marginBottom: '0.5rem' }}>We collect the following personal information from users:</p>
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}><strong>Account Information:</strong> Name, email address, and Google account details.</li>
                    <li style={{ marginBottom: '0.5rem' }}><strong>Payment Information:</strong> Credit card information processed securely by Stripe (we do not store raw credit card numbers).</li>
                    <li style={{ marginBottom: '0.5rem' }}><strong>Usage Data:</strong> Tasks, habits, goals, calendar events, and service usage patterns.</li>
                    <li style={{ marginBottom: '0.5rem' }}><strong>Google Calendar Data:</strong> Calendar events from your Google Calendar (read-only access).</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '1rem' }}>3. Purpose of Use</h2>
                <p style={{ marginBottom: '0.5rem' }}>We use the collected information for the following purposes:</p>
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}>To provide and operate the Task Master service.</li>
                    <li style={{ marginBottom: '0.5rem' }}>To sync and display your Google Calendar events.</li>
                    <li style={{ marginBottom: '0.5rem' }}>To process payments for subscription fees.</li>
                    <li style={{ marginBottom: '0.5rem' }}>To respond to user inquiries and support requests.</li>
                    <li style={{ marginBottom: '0.5rem' }}>To send important notifications regarding the service.</li>
                    <li style={{ marginBottom: '0.5rem' }}>To prevent fraud and ensure service security.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '1rem' }}>4. Third-Party Provision</h2>
                <p style={{ marginBottom: '0.5rem' }}>We do not provide personal information to third parties without consent, except in the following cases:</p>
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}><strong>Service Providers:</strong> Stripe for payments, Google for authentication and calendar access.</li>
                    <li style={{ marginBottom: '0.5rem' }}><strong>Legal Compliance:</strong> When required by law or necessary to cooperate with government agencies.</li>
                    <li style={{ marginBottom: '0.5rem' }}><strong>Business Transfer:</strong> In the event of a merger, acquisition, or sale of assets.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '1rem' }}>5. Security Measures</h2>
                <p>We take appropriate security measures to prevent unauthorized access, loss, alteration, or leakage of personal information. However, please note that no method of transmission over the Internet is 100% secure.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '1rem' }}>6. Disclosure, Correction, and Deletion</h2>
                <p>Users may request the disclosure, correction, or deletion of their personal information held by the Company. Upon receiving such a request, we will verify the user's identity and respond promptly in accordance with applicable laws.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '1rem' }}>7. Google API Services User Data Policy</h2>
                <p>
                    Task Master's use of information received from Google APIs will adhere to the{' '}
                    <a
                        href="https://developers.google.com/terms/api-services-user-data-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                    >
                        Google API Services User Data Policy
                    </a>, including the Limited Use requirements.
                </p>
            </section>

            <section style={{ marginTop: '3rem', borderTop: '2px solid rgba(255,255,255,0.2)', paddingTop: '20px' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Contact Us</h3>
                <p>Email: <a href="mailto:wer.corp.smarter@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>wer.corp.smarter@gmail.com</a></p>
                <button
                    onClick={handleBack}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        background: '#0f172a', // Dark button against white bg
                        color: 'white',
                        border: 'none',
                    }}
                >
                    Back to App
                </button>
            </section>
        </div>
    );
};

export default Privacy;