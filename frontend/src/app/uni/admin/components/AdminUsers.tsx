'use client';

import { useState } from 'react';
import { Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { AdminUserPayload } from '../types/admin.types';
import AdminSearch from './AdminSearch';

interface AdminUsersProps {
  users: AdminUserPayload[];
  onRefresh: () => void;
}

export default function AdminUsers({ users, onRefresh }: AdminUsersProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleUpdatePassword = async (userId: number, username: string) => {
    const newPassword = prompt(`Enter a new secure password string for account: [ ${username} ]`);
    if (!newPassword || newPassword.trim().length < 6) {
      return toast.error('Password specification must contain at least 6 characters.');
    }
    try {
      await apiClient.post(`/auth/profiles/${userId}/admin-change-password/`, { password: newPassword });
      toast.success(`Credentials overwritten for ${username}`);
    } catch (err) {
      toast.error('Failed to change password. Verify your admin session privileges.');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <AdminSearch
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search database by username or email reference..."
      />

      <div className="bg-[#0c101b] border border-slate-800/80 rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-left text-xs text-slate-300">
          <thead className="bg-[#111726] text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">UID</th>
              <th className="p-4">Profile Identity</th>
              <th className="p-4">Operational Status</th>
              <th className="p-4">Activity Volume</th>
              <th className="p-4 text-right">Action Gateways</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredUsers.map((item) => (
              <tr key={item.id} className="hover:bg-slate-900/30 transition">
                <td className="p-4 font-bold text-slate-500">#{item.id}</td>
                <td className="p-4">
                  <div className="font-bold text-white font-sans text-sm">{item.username}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{item.email}</div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-tighter ${
                    item.is_active
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {item.is_active ? 'Active Node' : 'Suspended'}
                  </span>
                </td>
                <td className="p-4 font-sans text-slate-200 font-medium">{item.total_bets} Placed Bets</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleUpdatePassword(item.id, item.username)}
                    className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-black px-3 py-2 border border-slate-800 rounded-lg transition"
                  >
                    <Key size={12} className="text-amber-400" /> Overwrite Pass
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}