/**
 * Report Page - Weekly Health Report
 * 
 * Displays sanitized weekly health report with optional admin protection.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { markdownToHtml } from '@/lib/markdown';
import ReportMD from '@/components/ReportMD';
import { isAuthEnabled } from '@/lib/auth';

async function getReportData(): Promise<{ html: string; error?: string } | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'report.md');
    const markdown = await fs.readFile(filePath, 'utf8');
    const html = await markdownToHtml(markdown);
    return { html };
  } catch (error) {
    return { html: '', error: 'Report not yet available' };
  }
}

async function getHealthMetrics() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'health.json');
    const contents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(contents);
  } catch {
    return null;
  }
}

export default async function ReportPage() {
  const reportData = await getReportData();
  const health = await getHealthMetrics();
  const authEnabled = isAuthEnabled();

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mb-16">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Weekly Update</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Health Report
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Weekly operational metrics and cohort performance summary.
          </p>
          {authEnabled && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                🔒 This report is protected. Administrative access required.
              </p>
            </div>
          )}
        </div>

        {health && (
          <div className="mb-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Total Apps</dt>
              <dd className="mt-2 text-3xl font-bold text-gray-900">{health.totalApps}</dd>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-green-700">GO</dt>
              <dd className="mt-2 text-3xl font-bold text-green-900">{health.goCount}</dd>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-yellow-700">Waitlist</dt>
              <dd className="mt-2 text-3xl font-bold text-yellow-900">{health.waitlistCount}</dd>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <dt className="text-sm font-medium text-gray-500">Avg Score</dt>
              <dd className="mt-2 text-3xl font-bold text-gray-900">{health.avgScore.toFixed(1)}</dd>
            </div>
          </div>
        )}

        <div className="mt-8 bg-gray-50 p-8 rounded-lg">
          {reportData?.error ? (
            <div className="text-center py-12 text-gray-500">
              <p>{reportData.error}</p>
              <p className="text-sm mt-2">Reports are generated weekly by the Gloven CLI.</p>
            </div>
          ) : reportData?.html ? (
            <ReportMD html={reportData.html} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Loading report...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}