'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Gift, 
  Trophy, 
  Share2, 
  Copy, 
  Check, 
  TrendingUp,
  Target,
  Award,
  Star,
  Zap,
  Crown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface ReferralStats {
  referrals: number;
  earnings: number;
  nextReward: number;
  referralCode: string;
  referralLink: string;
}

const rewardTiers = [
  { referrals: 1, reward: 10, bonus: 'Free Bet $10', icon: Star },
  { referrals: 5, reward: 50, bonus: '$50 Bonus', icon: Gift },
  { referrals: 10, reward: 150, bonus: '$150 Bonus', icon: Trophy },
  { referrals: 25, reward: 500, bonus: '$500 Bonus', icon: Crown },
  { referrals: 50, reward: 1500, bonus: 'VIP Status', icon: Award },
];

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);

  const {
    data: referralData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const [codeStats, referralStats] = await Promise.all([
        apiService.getReferralCode(),
        apiService.getReferralStats(),
      ]);
      
      return {
        ...referralStats.data,
        ...codeStats.data,
      };
    },
  });

  const handleCopyReferralLink = () => {
    if (referralData?.link) {
      navigator.clipboard.writeText(referralData.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Referral link copied to clipboard!');
    }
  };

  const handleClaimReward = async (tierIndex: number) => {
    try {
      await apiService.claimReferralReward();
      setClaimedRewards(prev => [...prev, tierIndex]);
      toast.success('Reward claimed successfully!');
      refetch();
    } catch (error) {
      toast.error('Failed to claim reward');
    }
  };

  const shareOnSocial = (platform: string) => {
    const url = referralData?.link || '';
    const text = 'Join me on Let\'sBet and get a welcome bonus!';
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank');
  };

  const getCurrentTier = () => {
    if (!referralData) return 0;
    const currentReferrals = referralData.referrals;
    for (let i = rewardTiers.length - 1; i >= 0; i--) {
      if (currentReferrals >= rewardTiers[i].referrals) {
        return i;
      }
    }
    return -1;
  };

  const getNextTier = () => {
    const currentTier = getCurrentTier();
    if (currentTier < rewardTiers.length - 1) {
      return currentTier + 1;
    }
    return -1;
  };

  const getProgressToNextTier = () => {
    if (!referralData) return 0;
    const nextTier = getNextTier();
    if (nextTier === -1) return 100;
    
    const currentReferrals = referralData.referrals;
    const currentTierReferrals = rewardTiers[getCurrentTier()]?.referrals || 0;
    const nextTierReferrals = rewardTiers[nextTier].referrals;
    
    const progress = ((currentReferrals - currentTierReferrals) / (nextTierReferrals - currentTierReferrals)) * 100;
    return Math.min(progress, 100);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-500">Failed to load referral data. Please try again.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <LoadingOverlay isLoading={isLoading} text="Loading referral data...">
        <div className="max-w-7xl mx-auto p-4">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4"
            >
              <Users className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Refer & Earn
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Invite friends and earn rewards together
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {referralData?.referrals || 0}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Total Referrals</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <Zap className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                ${referralData?.earnings || 0}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Total Earnings</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Star className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {rewardTiers[getNextTier()]?.referrals || 'MAX'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Next Goal</p>
            </motion.div>
          </div>

          {/* Referral Link Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 mb-8 text-white"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Your Referral Link</h2>
              <p className="text-purple-100">
                Share this link with friends and start earning rewards
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm break-all flex-1 mr-4">
                  {referralData?.link || 'Loading...'}
                </p>
                <button
                  onClick={handleCopyReferralLink}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => shareOnSocial('twitter')}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                Share on Twitter
              </button>
              <button
                onClick={() => shareOnSocial('facebook')}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                Share on Facebook
              </button>
              <button
                onClick={() => shareOnSocial('telegram')}
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                Share on Telegram
              </button>
            </div>
          </motion.div>

          {/* Progress to Next Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Progress to Next Reward
            </h3>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  {rewardTiers[getCurrentTier()]?.bonus || 'Start'}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {rewardTiers[getNextTier()]?.bonus || 'Max Level'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressToNextTier()}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full"
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getNextTier() === -1 
                ? "You've reached the maximum level! 🎉"
                : `${rewardTiers[getNextTier()].referrals - (referralData?.referrals || 0)} more referrals to unlock ${rewardTiers[getNextTier()].bonus}`
              }
            </p>
          </motion.div>

          {/* Reward Tiers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Reward Tiers
            </h3>
            
            <div className="space-y-4">
              {rewardTiers.map((tier, index) => {
                const Icon = tier.icon;
                const isUnlocked = (referralData?.referrals || 0) >= tier.referrals;
                const isCurrentTier = getCurrentTier() === index;
                const isClaimed = claimedRewards.includes(index);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isUnlocked
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isUnlocked
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className={`font-semibold ${
                            isUnlocked
                              ? 'text-green-700 dark:text-green-400'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {tier.referrals} Referrals
                          </h4>
                          <p className={`text-sm ${
                            isUnlocked
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {tier.bonus}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-bold ${
                          isUnlocked
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-gray-500 dark:text-gray-500'
                        }`}>
                          ${tier.reward}
                        </p>
                        
                        {isUnlocked && !isClaimed && (
                          <button
                            onClick={() => handleClaimReward(index)}
                            className="mt-2 px-4 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Claim Reward
                          </button>
                        )}
                        
                        {isClaimed && (
                          <span className="mt-2 inline-block px-4 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded">
                            Claimed
                          </span>
                        )}
                        
                        {!isUnlocked && isCurrentTier && (
                          <span className="mt-2 inline-block px-4 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm rounded">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </LoadingOverlay>
    </div>
  );
}
