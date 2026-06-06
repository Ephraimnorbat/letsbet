'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import { User, Wallet, Trophy, Calendar, ShieldCheck, Mail, Phone, Globe, Loader2, Save } from 'lucide-react';

interface CountryOption {
  id: number;
  name: string;
  code: string;
}

export default function ProfilePage() {
  // Pull user data from store, but manage the fresh profile via local state to avoid Zustand mutation crashes
  const authStore = useAuthStore();
  const storeUser = authStore?.user; 
  
  const [localUser, setLocalUser] = useState<any>(storeUser || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countriesList, setCountriesList] = useState<CountryOption[]>([]);

  // Local Form Input States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryId, setCountryId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  useEffect(() => {
    const initProfilePage = async () => {
      try {
        // ✅ FIXED: Using your exact backend paths precisely
        const profileEndpoint = '/auth/profile/';
        const countriesEndpoint = '/auth/countries/'; // Adjust if this lives elsewhere

        // Fetch user data and country configurations cleanly
        const [profileRes, countriesRes] = await Promise.all([
          apiClient.get(profileEndpoint),
          apiClient.get(countriesEndpoint).catch(() => ({ data: [] })) // Fallback if countries endpoint isn't fully ready
        ]);

        const freshUser = profileRes.data || profileRes;
        
        // Save to local view state dynamically
        setLocalUser(freshUser);

        // Map country list options safely
        const cData = Array.isArray(countriesRes) ? countriesRes : countriesRes?.data || countriesRes?.results || [];
        setCountriesList(cData);

        // Hydrate configuration inputs from your model properties
        setPhoneNumber(freshUser.phone_number || '');
        setCountryId(freshUser.country ? freshUser.country.toString() : '');
        setDateOfBirth(freshUser.date_of_birth || '');

      } catch (error) {
        console.error('Profile synchronization failed:', error);
        toast.error('Failed to synchronize profile records.');
      } finally {
        setLoading(false);
      }
    };

    initProfilePage();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateEndpoint = '/auth/profile/'; // Your API allows PATCH directly to this route
      
      const payload = {
        phone_number: phoneNumber || null,
        country_id: countryId ? parseInt(countryId) : null,
        date_of_birth: dateOfBirth || null
      };

      const response = await apiClient.patch(updateEndpoint, payload);
      const updatedUser = response.data || response;
      
      setLocalUser(updatedUser);
      toast.success('Profile details updated successfully!');
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error.response?.data?.error || 'Failed to modify account settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Currency layout values mapped perfectly to your live JSON payload keys
  const userBalance = localUser?.profile?.display_balance || localUser?.balance || 0;
  const currencySymbol = localUser?.currency_details?.symbol || 'KSh';

  const stats = [
    { 
      label: 'Wallet Balance', 
      value: `${currencySymbol} ${Number(userBalance).toLocaleString()}`, 
      icon: Wallet, 
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    { 
      label: 'Total Bets Placed', 
      value: localUser?.total_bets || 0, 
      icon: ShieldCheck, 
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    { 
      label: 'Total Wins', 
      value: localUser?.total_wins || 0, 
      icon: Trophy, 
      color: 'text-amber-400',
      bg: 'bg-amber-500/10' 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl">
          <div className="w-20 h-20 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center text-blue-400">
            <User className="w-10 h-10" />
          </div>
          <div className="text-center md:text-left space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{localUser?.username}</h1>
            <p className="text-gray-400 text-sm flex items-center justify-center md:justify-start gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${localUser?.is_verified ? 'bg-emerald-500' : 'bg-amber-400'} animate-pulse`} />
              {localUser?.is_verified ? 'Verified Active Member' : 'Pending Verification'}
            </p>
          </div>
        </div>

        {/* Dynamic Metric Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, i) => {
            const IconComponent = stat.icon;
            return (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between shadow-md">
                <div className="space-y-1">
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold font-mono">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Update Settings Form */}
        <form onSubmit={handleUpdateProfile} className="bg-gray-900 border border-gray-800 rounded-2xl shadow-md overflow-hidden">
          <div className="border-b border-gray-800 px-6 py-4 bg-gray-950/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-200">Account Profile Management</h2>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-sm font-medium rounded-lg transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </button>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Account Email Field */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-950/20 border border-gray-800/40 opacity-70">
              <Mail className="w-5 h-5 text-gray-500 mt-1" />
              <div className="space-y-1 w-full">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Email Address</p>
                <input 
                  type="text" 
                  value={localUser?.email || ''} 
                  disabled 
                  className="w-full bg-transparent text-sm font-medium text-gray-400 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Mobile Input Field */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-950/40 border border-gray-800 focus-within:border-blue-500/50 transition">
              <Phone className="w-5 h-5 text-gray-400 mt-1" />
              <div className="space-y-1 w-full">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Mobile Number</label>
                <input 
                  type="text" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +254700000000"
                  className="w-full bg-transparent text-sm font-medium text-gray-100 outline-none font-mono placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Country Selector */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-950/40 border border-gray-800 focus-within:border-blue-500/50 transition">
              <Globe className="w-5 h-5 text-gray-400 mt-1" />
              <div className="space-y-1 w-full">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Country Location</label>
                <select
                  value={countryId}
                  onChange={(e) => setCountryId(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-gray-100 outline-none cursor-pointer border-none p-0 [color-scheme:dark]"
                >
                  <option value="">{localUser?.country_details?.name || 'Not selected'}</option>
                  {countriesList.map((c) => (
                    <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date of Birth Field */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-950/40 border border-gray-800 focus-within:border-blue-500/50 transition">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div className="space-y-1 w-full">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Date of Birth</label>
                <input 
                  type="date" 
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-gray-100 outline-none [color-scheme:dark]"
                />
              </div>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
}