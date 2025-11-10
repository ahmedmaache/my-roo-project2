/**
 * Cohort Page - Application Leaderboard
 * 
 * Displays ranked applications with scores and bands.
 */

import { promises as fs } from 'fs';
import path from 'path';
import LeaderBoard from '@/components/LeaderBoard';

interface LeaderboardData {
  generated: string;
  totalApps: number;
  entries: Array<{
    rank: number;
    id: string;
    company: string;
    region?: string;
    stage?: string;
    score: number;
    band: 'GO' | 'WAITLIST' | 'NO_GO';
  }>;
}

async function getLeaderboardData(): Promise<LeaderboardData | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'leaderboard.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch {
    return null;
  }
}

export default async function CohortPage() {
  const data = await getLeaderboardData();

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Current Cohort</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Application Leaderboard
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Ranked applications based on our evaluation criteria. View the current cohort's performance.
          </p>
          {data && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Total Applications: {data.totalApps}</p>
              <p>Last Updated: {new Date(data.generated).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          {data ? (
            <LeaderBoard data={data.entries} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Leaderboard data not yet available.</p>
              <p className="text-sm mt-2">Data will be published after the first scoring batch.</p>
            </div>
          )}
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Understanding the Bands</h3>
          <dl className="mt-4 space-y-2">
            <div className="flex gap-3">
              <dt className="font-medium">✅ GO:</dt>
              <dd className="text-gray-600">Strong candidates invited to interviews (Score ≥ 70)</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-medium">⏸️ WAITLIST:</dt>
              <dd className="text-gray-600">Promising applications requiring follow-up (Score 60-69)</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-medium">❌ NO_GO:</dt>
              <dd className="text-gray-600">Not proceeding at this time (Score &lt; 60 or red flags)</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}