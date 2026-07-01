'use client';

import { Search } from 'lucide-react';

interface AdminSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function AdminSearch({ value, onChange, placeholder }: AdminSearchProps) {
  return (
    <div className="flex items-center gap-3 bg-[#0c101b] border border-slate-800 rounded-xl px-4 py-3 max-w-md">
      <Search size={16} className="text-slate-500" />
      <input
        type="text"
        placeholder={placeholder || 'Search database by username or email reference...'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full"
      />
    </div>
  );
}