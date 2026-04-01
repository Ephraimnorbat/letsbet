'use client';

import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Database } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Privacy Policy
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Information We Collect
              </h2>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>We collect the following types of information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth</li>
                  <li><strong>Account Information:</strong> Username, password, cryptocurrency wallet addresses</li>
                  <li><strong>Transaction Data:</strong> Deposit/withdrawal history, betting activity</li>
                  <li><strong>Technical Data:</strong> IP address, device information, browser data</li>
                  <li><strong>Usage Data:</strong> Pages visited, time spent, interaction patterns</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                2. How We Use Your Information
              </h2>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>We use your information to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and maintain our betting services</li>
                  <li>Process transactions and manage your account</li>
                  <li>Verify your identity and prevent fraud</li>
                  <li>Communicate with you about your account</li>
                  <li>Improve our services and user experience</li>
                  <li>Comply with legal and regulatory requirements</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Data Security
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600 dark:text-gray-400">
                <li>256-bit SSL encryption for all data transmissions</li>
                <li>Secure storage of sensitive information</li>
                <li>Regular security audits and penetration testing</li>
                <li>Multi-factor authentication for account access</li>
                <li>Strict access controls for employee data access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Data Sharing & Third Parties
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600 dark:text-gray-400">
                <li><strong>Payment Processors:</strong> For processing cryptocurrency transactions</li>
                <li><strong>Regulatory Authorities:</strong> When required by law or regulation</li>
                <li><strong>Service Providers:</strong> For technical support and infrastructure</li>
                <li><strong>Legal Advisors:</strong> For legal proceedings and compliance</li>
              </ul>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                We never sell your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Cookies & Tracking
              </h2>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Remember your preferences and settings</li>
                  <li>Analyze website traffic and usage patterns</li>
                  <li>Provide personalized content and recommendations</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>
                <p>You can control cookies through your browser settings.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Your Rights
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600 dark:text-gray-400">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Restrict processing of your data</li>
                <li>Data portability</li>
                <li>Object to processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Data Retention
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We retain your information only as long as necessary to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600 dark:text-gray-400">
                <li>Fulfill the purposes for which it was collected</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Fraud prevention and security purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                8. International Data Transfers
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your data in accordance with 
                applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Children's Privacy
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Our services are not intended for individuals under the age of 18. We do not knowingly 
                collect personal information from children. If we become aware of such collection, we 
                will take immediate steps to delete the information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Changes to This Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We may update this privacy policy from time to time. Changes will be posted on this 
                page with an updated revision date. Your continued use of our services constitutes 
                acceptance of any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Contact Information
              </h2>
              <div className="text-gray-600 dark:text-gray-400">
                <p>For privacy-related questions, contact us at:</p>
                <p>Email: privacy@letsbet.com</p>
                <p>Data Protection Officer: dpo@letsbet.com</p>
              </div>
            </section>
          </div>

          {/* Privacy Commitment */}
          <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div className="text-sm text-green-800 dark:text-green-300">
                <p className="font-semibold mb-1">Our Privacy Commitment</p>
                <p>
                  We are committed to protecting your privacy and maintaining the highest standards 
                  of data protection. Your trust is important to us, and we will always be transparent 
                  about how we handle your information.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
