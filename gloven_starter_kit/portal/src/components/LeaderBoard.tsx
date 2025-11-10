/**
 * LeaderBoard Component
 * 
 * Displays cohort application rankings with emoji badges and band colors.
 */

interface LeaderboardEntry {
  rank: number;
  id: string;
  company: string;
  region?: string;
  stage?: string;
  score: number;
  band: 'GO' | 'WAITLIST' | 'NO_GO';
}

interface LeaderBoardProps {
  data: LeaderboardEntry[];
}

function getRankBadge(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}.`;
}

function getBandColor(band: string): string {
  switch (band) {
    case 'GO':
      return 'text-green-600 bg-green-50';
    case 'WAITLIST':
      return 'text-yellow-600 bg-yellow-50';
    case 'NO_GO':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

function getBandEmoji(band: string): string {
  switch (band) {
    case 'GO':
      return '✅';
    case 'WAITLIST':
      return '⏸️';
    case 'NO_GO':
      return '❌';
    default:
      return '⚪';
  }
}

export default function LeaderBoard({ data }: LeaderBoardProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No leaderboard data available yet.</p>
        <p className="text-sm mt-2">Data will be published after the first scoring batch.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Region
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stage
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Score
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {getRankBadge(entry.rank)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{entry.company}</div>
                <div className="text-sm text-gray-500">{entry.id}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {entry.region || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {entry.stage || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                  {entry.score.toFixed(1)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBandColor(entry.band)}`}>
                  {getBandEmoji(entry.band)} {entry.band}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}