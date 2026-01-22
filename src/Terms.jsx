import React from 'react';

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6 text-gray-800">
            <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
            <p className="text-gray-600 mb-8">Last Updated: January 22, 2026</p>

            <div className="space-y-8 leading-relaxed">

                {/* 1. Introduction */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">Article 1 (Introduction)</h2>
                    <p>
                        These Terms of Service (hereinafter referred to as the "Terms") set forth the terms and conditions for the use of the task management service "Task Master" (hereinafter referred to as the "Service") provided by Task Master (hereinafter referred to as the "Company").
                        Users (hereinafter referred to as "Users") agree to these Terms by using the Service.
                    </p>
                </section>

                {/* 2. Definitions */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">Article 2 (Definitions)</h2>
                    <p>The following terms used in these Terms shall have the meanings set forth below:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>"Service" refers to the web application "Task Master" operated by the Company.</li>
                        <li>"User" refers to any individual or entity that has registered to use the Service.</li>
                        <li>"Agreement" refers to the service agreement concluded between the Company and the User under the provisions of these Terms.</li>
                    </ul>
                </section>

                {/* 3. Service & Payment */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">Article 3 (Service and Fees)</h2>
                    <ol className="list-decimal pl-5 mt-2 space-y-2">
                        <li>The Service provides functions to assist Users with task and schedule management.</li>
                        <li>The Service is a monthly subscription. Users shall pay the usage fees determined by the Company via the designated payment method (e.g., Stripe).</li>
                        <li><strong>No Refunds:</strong> Usage fees paid are <strong>non-refundable</strong> for any reason whatsoever. No pro-rated refunds will be issued for partial usage or cancellations mid-month.</li>
                    </ol>
                </section>

                {/* 4. Prohibited Acts */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">Article 4 (Prohibited Acts)</h2>
                    <p>Users shall not engage in the following acts when using the Service:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Acts that violate laws, regulations, or public order and morals.</li>
                        <li>Acts related to criminal activity.</li>
                        <li>Acts that destroy or interfere with the functions of the Company's server or network.</li>
                        <li>Collecting or accumulating personal information of other Users.</li>
                        <li>Impersonating other Users.</li>
                        <li>Acts that directly or indirectly provide benefits to Anti-Social Forces (organized crime groups).</li>
                        <li>Any other acts deemed inappropriate by the Company.</li>
                    </ul>
                </section>

                {/* 5. Termination */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">Article 5 (Suspension and Termination)</h2>
                    <p>
                        The Company may, without prior notice, suspend the User's use of the Service or terminate the User's registration if the User falls under any of the following:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Violation of any provision of these Terms.</li>
                        <li>Discovery of false information in the registration details.</li>
                        <li>Failure to pay usage fees.</li>
                        <li>Any other case where the Company deems the use of the Service inappropriate.</li>
                    </ul>
                </section>

                {/* 6. Intellectual Property */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">Article 6 (Intellectual Property)</h2>
                    <p>
                        Intellectual property rights regarding the programs, designs, images, etc., constituting the Service belong to the Company.
                        The User grants the Company permission to use data posted or saved by the User to the extent necessary for the operation of the Service.
                    </p>
                </section>

                {/* 7. Disclaimer & Liability */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">Article 7 (Disclaimer and Limitation of Liability)</h2>
                    <ol className="list-decimal pl-5 mt-2 space-y-2">
                        <li>
                            The Company makes no warranty, express or implied, regarding the Service (including defects in safety, reliability, accuracy, integrity, effectiveness, fitness for a particular purpose, security, errors, bugs, or infringement of rights).
                        </li>
                        <li>
                            <strong>Data Loss:</strong> The Company shall not be liable for any loss or alteration of data stored by the User for any reason. Users are responsible for backing up their own data.
                        </li>
                        <li>
                            <strong>Limitation of Liability:</strong> The Company shall not be liable for any damages incurred by the User regarding the Service, except in cases of willful misconduct or gross negligence by the Company.
                            However, if the contract between the Company and the User falls under a "Consumer Contract" as defined by the Consumer Contract Act of Japan, this total exemption clause shall not apply.
                        </li>
                        <li>
                            Even in the case provided in the proviso of the preceding paragraph, the Company shall not be liable for damages arising from special circumstances caused by the Company's negligence (excluding gross negligence).
                            Furthermore, compensation for damages caused by the Company's negligence shall be limited to the <strong>amount of the usage fee received from the User in the month</strong> in which the damage occurred.
                        </li>
                    </ol>
                </section>

                {/* 8. Governing Law & Jurisdiction */}
                <section>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">Article 8 (Governing Law and Jurisdiction)</h2>
                    <ol className="list-decimal pl-5 mt-2 space-y-2">
                        <li>These Terms shall be interpreted in accordance with the laws of <strong>Japan</strong>.</li>
                        <li>In the event of any dispute regarding the Service, the <strong>Tokyo District Court</strong> shall be the exclusive agreed court of the first instance.</li>
                    </ol>
                </section>

                <section className="mt-8 border-t pt-4">
                    <h3 className="font-bold">Contact Us</h3>
                    <p>For inquiries regarding these Terms, please contact:</p>
                    <p className="mt-2 text-blue-600">[INSERT YOUR EMAIL ADDRESS HERE]</p>
                </section>

            </div>
        </div>
    );
}