
'use client';

import { useState, useEffect } from 'react';
import ResultCard from '@/components/betting/ResultCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sportKey, setSportKey] = useState('soccer_epl');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${baseUrl}/matches/results/${sportKey}/`);
        const data = await response.json();
        if (data.status === 'success') setResults(data.data);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [sportKey]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Settled Results</h1>
            <p className="text-slate-500 text-sm mt-1">Official match outcomes and final scores</p>
          </div>
          
          <select 
            value={sportKey}
            onChange={(e) => setSportKey(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-lg px-4 py-2 outline-none focus:border-blue-500"
          >
            <option value="soccer_epl">Premier League</option>
            <option value="cricket_ipl">IPL Cricket</option>
            <option value="basketball_nba">NBA</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.length > 0 ? (
              results.map((res: any) => <ResultCard key={res.id} result={res} />)
            ) : (
              <div className="col-span-full py-20 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
                <p className="text-slate-500">No settled results found for this category.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}