import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  MessageCircle,
  Shield,
  Users,
  HelpCircle,
  ChevronUp
} from 'lucide-react';

const cryptoCurrencies = [
  { name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
  { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
  { name: 'Tether', symbol: 'USDT', icon: '₮' },
  { name: 'Solana', symbol: 'SOL', icon: '◎' },
];

const footerLinks = {
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Contact', href: '/contact' },
  ],
  betting: [
    { name: 'Sports Betting', href: '/sports' },
    { name: 'Live Betting', href: '/live' },
    { name: 'Odds', href: '/odds' },
    { name: 'Results', href: '/results' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Live Chat', href: '/chat' },
    { name: 'Support', href: '/support' },
  ],
  legal: [
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Responsible Gaming', href: '/responsible-gaming' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
};

const socialLinks = [
  { name: 'Twitter', href: '#', icon: MessageCircle },
  { name: 'Facebook', href: '#', icon: MessageCircle },
  { name: 'Instagram', href: '#', icon: MessageCircle },
  { name: 'YouTube', href: '#', icon: MessageCircle },
  { name: 'Telegram', href: '#', icon: MessageCircle },
];

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Mobile Crypto Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-40 md:hidden">
        <div className="flex items-center justify-around py-2">
          {cryptoCurrencies.map((crypto) => (
            <Link
              key={crypto.symbol}
              href={`/deposit/${crypto.symbol.toLowerCase()}`}
              className="flex flex-col items-center gap-1 p-2 hover:bg-gray-700 rounded transition-colors"
            >
              <span className="text-lg font-bold text-blue-400">{crypto.icon}</span>
              <span className="text-xs text-gray-300">{crypto.symbol}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Footer */}
      <div className="pt-16 pb-8 md:pb-12">
        <div className="container mx-auto px-4">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">LB</span>
                </div>
                <span className="font-bold text-xl">Let'sBet</span>
              </div>
              <p className="text-gray-400 mb-6">
                Your trusted platform for sports betting with cryptocurrency. 
                Safe, secure, and transparent gaming experience.
              </p>
              
              {/* Social Links */}
              <div className="flex gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                      aria-label={social.name}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Betting</h3>
              <ul className="space-y-2">
                {footerLinks.betting.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Crypto Section */}
          <div className="border-t border-gray-800 pt-8 mb-8">
            <h3 className="font-semibold mb-4 text-center">Supported Cryptocurrencies</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {cryptoCurrencies.map((crypto) => (
                <motion.div
                  key={crypto.symbol}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <span className="text-xl font-bold text-blue-400">{crypto.icon}</span>
                  <div>
                    <p className="font-medium">{crypto.name}</p>
                    <p className="text-sm text-gray-400">{crypto.symbol}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="border-t border-gray-800 pt-8 mb-8">
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Secure & Licensed</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-5 h-5 text-blue-400" />
                <span>100,000+ Users</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-400 text-sm">
                © 2024 Let'sBet. All rights reserved.
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">
                  18+ | Gamble Responsibly
                </span>
                <button
                  onClick={scrollToTop}
                  className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  aria-label="Scroll to top"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
