import React from 'react';

const Terms = () => {
    const containerStyle = {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: 'sans-serif',
        color: 'white',
        lineHeight: '1.6',
        textAlign: 'left'
    };

    const handleBack = () => {
        window.history.pushState({}, '', '/');
        window.location.reload();
    };

    return (
        <div style={containerStyle}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Terms of Service</h1>
            <p style={{ color: '#999', marginBottom: '2rem' }}>Last Updated: January 22, 2026</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '1rem' }}>Article 1: Introduction</h2>
                <p>These Terms of Service (hereinafter referred to as the "Terms") set forth the terms and conditions for the use of the task management service "Task Master" (hereinafter referred to as the "Service") provided by Task Master (hereinafter referred to as the "Company"). Users agree to these Terms by using the Service.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '1rem' }}>Article 2: Service and Fees</h2>
                <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li style={{ marginBottom: '0.75rem' }}>The Service is a monthly subscription. Users shall pay the usage fees via the designated payment method (e.g., Stripe).</li>
                    <li style={{ marginBottom: '0.75rem' }}><strong>No Refunds:</strong> Usage fees paid are <strong>non-refundable</strong> for any reason whatsoever. No pro-rated refunds will be issued.</li>
                    <li style={{ marginBottom: '0.75rem' }}>The Company may change the fee structure with prior notice to users.</li>
                </ol>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '1rem' }}>Article 3: User Accounts</h2>
                <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li style={{ marginBottom: '0.75rem' }}>Users must register with accurate information and maintain the confidentiality of their account credentials.</li>
                    <li style={{ marginBottom: '0.75rem' }}>Users are responsible for all activities that occur under their account.</li>
                    <li style={{ marginBottom: '0.75rem' }}>Users must not share their account with others or allow unauthorized access.</li>
                </ol>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '1rem' }}>Article 4: Prohibited Acts</h2>
                <p style={{ marginBottom: '0.5rem' }}>Users shall not engage in the following acts:</p>
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}>Illegal acts or criminal activity</li>
                    <li style={{ marginBottom: '0.5rem' }}>Acts that infringe upon the rights of the Company or third parties</li>
                    <li style={{ marginBottom: '0.5rem' }}>Acts that destroy or interfere with the Company's network or systems</li>
                    <li style={{ marginBottom: '0.5rem' }}>Unauthorized access, reverse engineering, or attempts to circumvent security measures</li>
                    <li style={{ marginBottom: '0.5rem' }}>Acts that benefit Anti-Social Forces (organized crime groups)</li>
                    <li style={{ marginBottom: '0.5rem' }}>Distribution of malware, viruses, or harmful code</li>
                    <li style={{ marginBottom: '0.5rem' }}>Harassment, abuse, or threatening behavior toward other users or Company staff</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '1rem' }}>Article 5: Suspension and Termination</h2>
                <p>The Company may suspend or terminate a User's account without prior notice for violation of these Terms, provision of false registration information, failure to pay fees, or any other reason the Company deems appropriate. No refunds will be issued upon termination.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '1rem' }}>Article 6: Disclaimer and Limitation of Liability</h2>
                <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li style={{ marginBottom: '0.75rem' }}><strong>Service Availability:</strong> The Company does not guarantee that the Service will be available at all times without interruption or error.</li>
                    <li style={{ marginBottom: '0.75rem' }}><strong>Data Loss:</strong> The Company shall not be liable for any loss or alteration of data stored by the User. Users are responsible for backing up their own data.</li>
                    <li style={{ marginBottom: '0.75rem' }}><strong>Limitation of Liability:</strong> The Company shall not be liable for damages incurred by the User, except in cases of willful misconduct or gross negligence. However, if the contract falls under the Consumer Contract Act of Japan, this exemption does not apply.</li>
                    <li style={{ marginBottom: '0.75rem' }}>In cases of negligence (excluding gross negligence), compensation for damages shall be limited to the <strong>amount of the usage fee received from the User in the month</strong> in which the damage occurred.</li>
                </ol>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '1rem' }}>Article 7: Intellectual Property</h2>
                <p>All intellectual property rights in the Service, including but not limited to software, design, trademarks, and content, belong to the Company or its licensors. Users are granted a limited, non-exclusive, non-transferable license to use the Service.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '1rem' }}>Article 8: Changes to Terms</h2>
                <p>The Company may modify these Terms at any time. Users will be notified of significant changes via email or through the Service. Continued use of the Service after such changes constitutes acceptance of the modified Terms.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '1rem' }}>Article 9: Governing Law and Jurisdiction</h2>
                <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li style={{ marginBottom: '0.75rem' }}>These Terms shall be interpreted in accordance with the laws of <strong>Japan</strong>.</li>
                    <li style={{ marginBottom: '0.75rem' }}>In the event of any dispute, the <strong>Tokyo District Court</strong> shall be the exclusive agreed court of the first instance.</li>
                </ol>
            </section>

            <section style={{ marginTop: '3rem', borderTop: '2px solid rgba(255,255,255,0.2)', paddingTop: '20px' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Contact Us</h3>
                <p>Email: <a href="mailto:yuma.yoshida.tmc@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>yuma.yoshida.tmc@gmail.com</a></p>
                <button
                    onClick={handleBack}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem',
                        fontWeight: 500
                    }}
                >
                    Back to App
                </button>
            </section>
        </div>
    );
};

export default Terms;