import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6 text-gray-800">
            <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-gray-600 mb-8">Last Updated: January 22, 2026</p>

            <div className="space-y-8 leading-relaxed">

                {/* 1. Introduction */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">1. Introduction</h2>
                    <p>
                        Task Master (hereinafter referred to as "the Company") recognizes the importance of protecting personal information and will observe the Act on the Protection of Personal Information (Japanese Law) and other relevant laws and regulations. We strive to handle personal information appropriately in accordance with this Privacy Policy.
                    </p>
                </section>

                {/* 2. Information We Collect */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">2. Information We Collect</h2>
                    <p>We collect the following personal information from users:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Account Information:</strong> Name, email address, and password.</li>
                        <li><strong>Payment Information:</strong> Credit card information and billing address (processed securely by Stripe; we do not store raw credit card numbers).</li>
                        <li><strong>Usage Data:</strong> Logs, device information, and information about how you use our service (tasks created, schedules, etc.).</li>
                    </ul>
                </section>

                {/* 3. Purpose of Use */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">3. Purpose of Use</h2>
                    <p>We use the collected information for the following purposes:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>To provide and operate the Task Master service.</li>
                        <li>To process payments for subscription fees.</li>
                        <li>To respond to user inquiries and support requests.</li>
                        <li>To send important notifications regarding the service (maintenance, updates, etc.).</li>
                        <li>To prevent fraud and ensure the security of the service.</li>
                    </ul>
                </section>

                {/* 4. Third-Party Provision */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">4. Third-Party Provision</h2>
                    <p>
                        We do not provide personal information to third parties without the user's consent, except in the following cases:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Service Providers:</strong> We share data with trusted third-party service providers necessary for operation (e.g., Stripe for payments, Vercel for hosting, Google for authentication).</li>
                        <li><strong>Legal Compliance:</strong> When required by law or necessary to cooperate with government agencies.</li>
                        <li><strong>Business Transfer:</strong> In the event of a merger, acquisition, or sale of assets.</li>
                    </ul>
                </section>

                {/* 5. Security Measures */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">5. Security Measures</h2>
                    <p>
                        We take appropriate security measures to prevent access, loss, alteration, or leakage of personal information. However, please note that no method of transmission over the Internet is 100% secure.
                    </p>
                </section>

                {/* 6. User Rights (Japan Law Compliance) */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">6. Disclosure, Correction, and Deletion</h2>
                    <p>
                        Users may request the disclosure, correction, or deletion of their personal information held by the Company. Upon receiving such a request, we will verify the user's identity and respond promptly in accordance with applicable laws.
                    </p>
                </section>

                {/* 7. Contact Us */}
                <section className="mt-8 border-t pt-4">
                    <h3 className="font-bold">Contact Us</h3>
                    <p>For inquiries regarding this Privacy Policy, please contact:</p>
                    <p className="mt-2 text-blue-600">[INSERT YOUR EMAIL ADDRESS HERE]</p>
                </section>

            </div>
        </div>
    );
}