'use client';

import { motion } from 'framer-motion';
import { Shield, Users, AlertCircle, CheckCircle } from 'lucide-react';

export default function TermsPage() {
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
              Terms & Conditions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                By accessing and using Let'sBet ("the Platform"), you agree to be bound by these Terms & Conditions. 
                If you do not agree to these terms, you must not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Eligibility
              </h2>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>To use our platform, you must:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Be at least 18 years of age or the legal gambling age in your jurisdiction</li>
                  <li>Not be residing in a jurisdiction where online gambling is prohibited</li>
                  <li>Have the legal capacity to enter into binding agreements</li>
                  <li>Provide accurate and complete registration information</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Account Registration & Security
              </h2>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>You are responsible for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                  <li>Providing accurate and up-to-date information</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Betting Rules
              </h2>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>All bets are subject to the following rules:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Bets placed are final and cannot be cancelled once confirmed</li>
                  <li>Minimum bet amount is $1 or equivalent in cryptocurrency</li>
                  <li>Maximum bet amounts vary by sport and market</li>
                  <li>Odds are subject to change and may fluctuate</li>
                  <li>We reserve the right to void any bets placed in error</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Deposits & Withdrawals
              </h2>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>Financial transactions are governed by:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All deposits must be made from accounts in your name</li>
                  <li>Withdrawals may be subject to verification procedures</li>
                  <li>Processing times vary by cryptocurrency and network conditions</li>
                  <li>We reserve the right to charge transaction fees</li>
                  <li>Minimum withdrawal amounts apply</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Privacy & Data Protection
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We are committed to protecting your privacy. Your personal data is handled in accordance 
                with our Privacy Policy and applicable data protection laws. We use industry-standard 
                security measures to protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Responsible Gaming
              </h2>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>We promote responsible gambling by:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Providing self-exclusion options</li>
                  <li>Setting deposit limits upon request</li>
                  <li>Offering cooling-off periods</li>
                  <li>Providing resources for gambling addiction help</li>
                  <li>Monitoring for problem gambling behaviors</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Prohibited Activities
              </h2>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <p>You are strictly prohibited from:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Using automated systems or bots to place bets</li>
                  <li>Exploiting bugs or vulnerabilities in the system</li>
                  <li>Engaging in fraudulent activities</li>
                  <li>Colluding with other users</li>
                  <li>Violating any applicable laws or regulations</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Limitation of Liability
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Let'sBet shall not be liable for any indirect, incidental, special, or consequential damages 
                arising from your use of the platform. Our total liability shall not exceed the amount of 
                your deposits.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Dispute Resolution
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Any disputes shall be resolved through our internal complaint process first. If unresolved, 
                disputes may be submitted to arbitration in accordance with applicable laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Account Termination
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate these terms or engage 
                in fraudulent activities. Termination may result in the forfeiture of funds.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                12. Amendments to Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We reserve the right to modify these terms at any time. Changes will be effective immediately 
                upon posting. Your continued use of the platform constitutes acceptance of any modifications.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                13. Contact Information
              </h2>
              <div className="text-gray-600 dark:text-gray-400">
                <p>For questions about these terms, contact us at:</p>
                <p>Email: legal@letsbet.com</p>
                <p>Support: support@letsbet.com</p>
              </div>
            </section>
          </div>

          {/* Acceptance Checkbox */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="accept-terms"
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="accept-terms" className="text-sm text-gray-700 dark:text-gray-300">
                I have read and agree to the Terms & Conditions of Let'sBet
              </label>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
