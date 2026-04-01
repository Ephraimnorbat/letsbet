'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  HelpCircle, 
  Clock, 
  Send,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const faqCategories = [
  {
    name: 'Account & Security',
    icon: <HelpCircle className="w-5 h-5" />,
    questions: [
      {
        q: 'How do I reset my password?',
        a: 'Click on "Forgot Password" on the login page and follow the instructions sent to your email.'
      },
      {
        q: 'Is my account information secure?',
        a: 'Yes, we use industry-standard encryption and security measures to protect your data.'
      },
      {
        q: 'How do I enable two-factor authentication?',
        a: 'Go to Settings > Security and enable 2FA for enhanced account protection.'
      }
    ]
  },
  {
    name: 'Betting & Odds',
    icon: <HelpCircle className="w-5 h-5" />,
    questions: [
      {
        q: 'How are odds calculated?',
        a: 'Odds are calculated based on various factors including team performance, market conditions, and statistical analysis.'
      },
      {
        q: 'What is the minimum bet amount?',
        a: 'The minimum bet amount is $1 or equivalent in your chosen cryptocurrency.'
      },
      {
        q: 'Can I cancel a bet after placing it?',
        a: 'Once a bet is placed and confirmed, it cannot be cancelled. Please review your bets carefully before confirming.'
      }
    ]
  },
  {
    name: 'Deposits & Withdrawals',
    icon: <HelpCircle className="w-5 h-5" />,
    questions: [
      {
        q: 'How long do deposits take?',
        a: 'Deposits typically take 5-30 minutes to reflect in your account, depending on network congestion.'
      },
      {
        q: 'What are the withdrawal limits?',
        a: 'Withdrawal limits vary by cryptocurrency and account verification level. Check your dashboard for specific limits.'
      },
      {
        q: 'Are there any fees for deposits or withdrawals?',
        a: 'We charge minimal network fees. Deposits are free, and withdrawals have a small network fee.'
      }
    ]
  },
  {
    name: 'Technical Issues',
    icon: <HelpCircle className="w-5 h-5" />,
    questions: [
      {
        q: 'The site is not loading properly?',
        a: 'Try clearing your browser cache, disabling ad blockers, or using a different browser.'
      },
      {
        q: 'Live betting is not updating?',
        a: 'Refresh the page and check your internet connection. Live updates require stable connectivity.'
      },
      {
        q: 'I can\'t place a bet?',
        a: 'Ensure you have sufficient balance and that the market is still open. Contact support if issues persist.'
      }
    ]
  }
];

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Support ticket submitted successfully! We\'ll respond within 24 hours.');
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      });
    } catch (error) {
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  const openTelegramSupport = () => {
    window.open('https://t.me/letsbet_support', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LoadingOverlay isLoading={isSubmitting}>
        <div className="max-w-7xl mx-auto p-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Support Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              We're here to help you 24/7
            </p>
          </div>

          {/* Quick Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <MessageCircle className="w-8 h-8" />
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Fastest</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Telegram Support</h3>
              <p className="text-blue-100 mb-4">
                Get instant help from our support team
              </p>
              <button
                onClick={openTelegramSupport}
                className="w-full bg-white text-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Telegram
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm">
                  24-48h
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Email Support
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Send us a detailed message
              </p>
              <a
                href="mailto:support@letsbet.com"
                className="block w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                support@letsbet.com
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <Phone className="w-8 h-8 text-green-600 dark:text-green-400" />
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-sm">
                  Business Hours
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Phone Support
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Mon-Fri, 9AM-6PM EST
              </p>
              <a
                href="tel:+1-555-123-4567"
                className="block w-full bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                +1 (555) 123-4567
              </a>
            </motion.div>
          </div>

          {/* FAQ Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Category Sidebar */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                FAQ Categories
              </h3>
              <div className="space-y-2">
                {faqCategories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedCategory(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedCategory === index
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {category.icon}
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Questions */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {faqCategories[selectedCategory].name}
                </h3>
                <div className="space-y-4">
                  {faqCategories[selectedCategory].questions.map((faq, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <button
                        onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                        className="w-full text-left py-3 flex items-center justify-between hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {faq.q}
                        </span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                          expandedQuestion === index ? 'rotate-180' : ''
                        }`}>
                          <div className="w-2 h-2 border-b-2 border-r-2 border-gray-400 transform rotate-45"></div>
                        </div>
                      </button>
                      
                      {expandedQuestion === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pb-3 text-gray-600 dark:text-gray-400"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Send us a Message
            </h3>
            
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={contactForm.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                >
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing & Payment</option>
                  <option value="account">Account Issue</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  placeholder="Brief description of your issue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message *
                </label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  placeholder="Describe your issue in detail..."
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Response Time Info */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
                  Response Times
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Telegram: Instant during business hours</li>
                  <li>• Email: Within 24-48 hours</li>
                  <li>• Phone: Mon-Fri, 9AM-6PM EST</li>
                  <li>• Critical issues: Immediately via all channels</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </LoadingOverlay>
    </div>
  );
}
