'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  Users, 
  Phone, 
  Heart,
  Calculator,
  Calendar,
  PauseCircle,
  Settings
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const selfAssessmentQuestions = [
  {
    question: "Do you gamble to escape problems or relieve feelings of helplessness?",
    weight: 3
  },
  {
    question: "Do you ever lose time from work or education due to gambling?",
    weight: 2
  },
  {
    question: "Does gambling cause you to have difficulty sleeping?",
    weight: 2
  },
  {
    question: "Do you argue with family or friends about money spent on gambling?",
    weight: 3
  },
  {
    question: "Do you ever borrow money or sell possessions to gamble?",
    weight: 4
  },
  {
    question: "Do you feel depressed or suicidal after gambling?",
    weight: 4
  },
  {
    question: "Do you chase losses by gambling more to win back money?",
    weight: 3
  },
  {
    question: "Do you lie to family or friends about your gambling?",
    weight: 3
  }
];

const supportResources = [
  {
    name: "Gamblers Anonymous",
    phone: "1-855-222-5542",
    website: "www.gamblersanonymous.org",
    description: "24/7 support group for problem gamblers"
  },
  {
    name: "National Council on Problem Gambling",
    phone: "1-800-522-4700",
    website: "www.ncpgambling.org",
    description: "Confidential helpline and resources"
  },
  {
    name: "GamCare",
    phone: "1-800-833-8739",
    website: "www.gamcare.org.uk",
    description: "Free information, advice, and support"
  },
  {
    name: "Gambling Therapy",
    phone: "1-800-522-4700",
    website: "www.gamblingtherapy.org",
    description: "Online support and practical advice"
  }
];

export default function ResponsibleGamingPage() {
  const [assessmentAnswers, setAssessmentAnswers] = useState<boolean[]>(new Array(selfAssessmentQuestions.length).fill(false));
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [limits, setLimits] = useState({
    deposit: '',
    loss: '',
    session: '',
    wager: ''
  });
  const [isSettingLimits, setIsSettingLimits] = useState(false);

  const calculateScore = () => {
    let score = 0;
    assessmentAnswers.forEach((answer, index) => {
      if (answer) {
        score += selfAssessmentQuestions[index].weight;
      }
    });
    return score;
  };

  const handleAssessmentSubmit = () => {
    const score = calculateScore();
    setAssessmentScore(score);
    setShowResults(true);
  };

  const getRiskLevel = (score: number) => {
    if (score <= 3) return { level: 'Low Risk', color: 'green', description: 'You appear to be gambling responsibly.' };
    if (score <= 7) return { level: 'Moderate Risk', color: 'yellow', description: 'Consider setting limits and monitoring your gambling.' };
    if (score <= 12) return { level: 'High Risk', color: 'orange', description: 'You may be at risk of problem gambling. Consider seeking help.' };
    return { level: 'Severe Risk', color: 'red', description: 'You should seek professional help immediately.' };
  };

  const handleSetLimits = async () => {
    setIsSettingLimits(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Limits set successfully! They will take effect immediately.');
      setLimits({ deposit: '', loss: '', session: '', wager: '' });
    } catch (error) {
      toast.error('Failed to set limits. Please try again.');
    } finally {
      setIsSettingLimits(false);
    }
  };

  const handleSelfExclude = () => {
    const confirmed = window.confirm(
      'Are you sure you want to self-exclude? This will prevent you from accessing your account for a selected period.'
    );
    if (confirmed) {
      toast('Self-exclusion request submitted. Our team will contact you shortly.');
    }
  };

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
              Responsible Gaming
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your well-being is our priority. Learn about responsible gambling practices.
            </p>
          </div>

          {/* Principles */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Our Responsible Gaming Principles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Player Protection</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We provide tools and resources to help you gamble responsibly.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Prevention</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We actively work to prevent underage and problem gambling.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Support</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We offer confidential support and resources for those who need help.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Education</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We educate players about the risks of gambling and how to stay in control.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Self Assessment */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Self-Assessment Test
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Answer these questions honestly to assess your gambling behavior.
            </p>
            
            <div className="space-y-4">
              {selfAssessmentQuestions.map((question, index) => (
                <div key={index} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`question-${index}`}
                    checked={assessmentAnswers[index]}
                    onChange={(e) => {
                      const newAnswers = [...assessmentAnswers];
                      newAnswers[index] = e.target.checked;
                      setAssessmentAnswers(newAnswers);
                    }}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`question-${index}`} className="text-gray-700 dark:text-gray-300">
                    {question.question}
                  </label>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleAssessmentSubmit}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Calculate Risk Score
            </button>
            
            {showResults && assessmentScore !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                {(() => {
                  const risk = getRiskLevel(assessmentScore);
                  return (
                    <div className={`p-4 bg-${risk.color}-100 dark:bg-${risk.color}-900/20 rounded-lg border border-${risk.color}-300 dark:border-${risk.color}-700`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`w-5 h-5 text-${risk.color}-600 dark:text-${risk.color}-400`} />
                        <h3 className={`font-semibold text-${risk.color}-900 dark:text-${risk.color}-100`}>
                          {risk.level}
                        </h3>
                      </div>
                      <p className={`text-${risk.color}-800 dark:text-${risk.color}-200`}>
                        Your score: {assessmentScore} - {risk.description}
                      </p>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </section>

          {/* Limits & Controls */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Limits & Controls
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Set Your Limits</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Daily Deposit Limit ($)
                    </label>
                    <input
                      type="number"
                      value={limits.deposit}
                      onChange={(e) => setLimits(prev => ({ ...prev, deposit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      placeholder="100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Daily Loss Limit ($)
                    </label>
                    <input
                      type="number"
                      value={limits.loss}
                      onChange={(e) => setLimits(prev => ({ ...prev, loss: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      placeholder="50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Session Time Limit (hours)
                    </label>
                    <input
                      type="number"
                      value={limits.session}
                      onChange={(e) => setLimits(prev => ({ ...prev, session: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                      placeholder="2"
                    />
                  </div>
                  
                  <button
                    onClick={handleSetLimits}
                    disabled={isSettingLimits}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSettingLimits ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Setting Limits...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4" />
                        Set Limits
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Other Controls</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleSelfExclude}
                    className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <PauseCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <div className="text-left">
                        <p className="font-medium text-red-900 dark:text-red-100">Self-Exclusion</p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Temporarily or permanently exclude yourself
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div className="text-left">
                        <p className="font-medium text-blue-900 dark:text-blue-100">Time-Out</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Take a short break from gambling
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <div className="text-left">
                        <p className="font-medium text-purple-900 dark:text-purple-100">Reality Check</p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Set reminders for your gaming sessions
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Support Resources */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Support Resources
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              If you or someone you know is struggling with gambling, these organizations can help.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportResources.map((resource, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">{resource.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{resource.description}</p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span>{' '}
                      <a href={`tel:${resource.phone}`} className="text-blue-600 hover:text-blue-700">
                        {resource.phone}
                      </a>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Website:</span>{' '}
                      <a href={`https://${resource.website}`} className="text-blue-600 hover:text-blue-700">
                        {resource.website}
                      </a>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Warning Signs */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Warning Signs of Problem Gambling
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Spending more money than you can afford
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Lying about gambling activities
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Chasing losses to win back money
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Neglecting responsibilities for gambling
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Borrowing money to gamble
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-1" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Feeling anxious about gambling
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Phone className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  Need Immediate Help?
                </h3>
                <p className="text-red-800 dark:text-red-200 mb-3">
                  If you're experiencing a gambling crisis, don't hesitate to reach out for help.
                </p>
                <div className="space-y-2">
                  <p className="text-red-800 dark:text-red-200">
                    <strong>Crisis Hotline:</strong> 1-800-522-4700 (24/7)
                  </p>
                  <p className="text-red-800 dark:text-red-200">
                    <strong>Text Support:</strong> Text "GAMBLE" to 53342
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
