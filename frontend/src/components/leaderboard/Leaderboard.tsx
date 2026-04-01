'use client';

const topUsers = [
  { rank: 1, name: 'John Doe', points: 12500, wins: 45 },
  { rank: 2, name: 'Jane Smith', points: 10800, wins: 38 },
  { rank: 3, name: 'Mike Johnson', points: 9500, wins: 32 },
  { rank: 4, name: 'Sarah Williams', points: 8700, wins: 29 },
  { rank: 5, name: 'David Brown', points: 7600, wins: 25 },
];

export default function Leaderboard() {
  return (
    <div className="container mx-auto px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-6 text-center">Top Bettors</h2>
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-100 dark:bg-gray-700 font-semibold">
          <div>Rank</div>
          <div>Name</div>
          <div>Points</div>
          <div>Wins</div>
        </div>
        {topUsers.map((user) => (
          <div key={user.rank} className="grid grid-cols-4 gap-4 p-4 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <div className="font-bold text-blue-500">#{user.rank}</div>
            <div>{user.name}</div>
            <div>{user.points.toLocaleString()}</div>
            <div>{user.wins}</div>
          </div>
        ))}
      </div>
    </div>
  );
}