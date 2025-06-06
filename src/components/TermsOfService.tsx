import React from 'react';

const TermsOfService: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
    <div className="container mx-auto px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: [Insert Date]</p>
      <p className="mb-4">
        Welcome to Brandician.ai (“we”, “our”, or “us”). These Terms of Service (“Terms”) govern your access to and use of our website and services (“Services”). By accessing or using Brandician.ai, you agree to be bound by these Terms.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">1. Services Provided</h2>
      <p className="mb-2">Brandician.ai helps users generate branding for business ideas by offering tools such as:</p>
      <ul className="list-disc list-inside mb-4">
        <li>Brand archetype selection</li>
        <li>User and customer surveys</li>
        <li>Brand asset creation (e.g., logos, names, taglines)</li>
      </ul>
      <p className="mb-4">Our Services are designed to assist with ideation and branding, not to guarantee business success.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">2. User Responsibilities</h2>
      <ul className="list-disc list-inside mb-4">
        <li>You are solely responsible for how you use the branding materials we provide.</li>
        <li>We make no guarantees or warranties about business outcomes, market performance, or the quality of branding results.</li>
        <li>You will not hold us liable for any losses, damages, or failures related to your business, brand, or the use of our materials.</li>
        <li>You also agree not to bring legal claims or disputes against us for dissatisfaction with the outputs, functionality, or performance of our platform.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">3. Data Usage and Privacy</h2>
      <ul className="list-disc list-inside mb-4">
        <li>By using our Services, you consent to our collection and use of your data as described below:</li>
        <li>We collect personal information such as your name, email, and details about your business idea.</li>
        <li>We may store information you provide about your brand concept, target market, and customer survey responses.</li>
        <li>Your data will not be shared with other users.</li>
        <li>However, we may use anonymized or aggregated data to improve our AI models and platform features.</li>
      </ul>
      <p className="mb-4">Your privacy is important to us. Please review our <a href="/privacy" className="text-primary-600 underline">Privacy Policy</a> for details on how we store and protect your data.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">4. Payments and Refund Policy</h2>
      <ul className="list-disc list-inside mb-4">
        <li>You may choose any payment amount you wish when using our Services.</li>
        <li>All payments are final and non-refundable, regardless of outcome or satisfaction.</li>
        <li>We do not offer refunds under any circumstances.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">5. Intellectual Property</h2>
      <p className="mb-4">All AI-generated content (including logos and brand assets) is provided “as is” and is subject to your own review before use. We retain the right to use anonymized outputs for analytics and platform training purposes.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">6. Disclaimer of Warranties</h2>
      <p className="mb-4">Our Services are provided “as-is” and “as-available.” We disclaim all warranties, express or implied, including but not limited to fitness for a particular purpose, merchantability, or non-infringement.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">7. Limitation of Liability</h2>
      <p className="mb-4">To the maximum extent permitted by law, Brandician.ai and its owners shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, data, or business opportunities, even if we were advised of the possibility.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">8. Changes to Terms</h2>
      <p className="mb-4">We reserve the right to update these Terms at any time. Continued use of the site after changes constitutes your acceptance of the revised Terms.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">9. Governing Law</h2>
      <p className="mb-4">These Terms are governed by the laws of the jurisdiction of the State Of Washington, United States, without regard to conflict of law principles.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">10. Contact</h2>
      <p>If you have questions, contact us at: <a href="mailto:contact@brandician.ai" className="text-primary-600 underline">contact@brandician.ai</a></p>
    </div>
  </div>
);

export default TermsOfService; 