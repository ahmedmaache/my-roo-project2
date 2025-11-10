/**
 * Root Layout for Gloven Portal
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gloven - Global Venture Network',
  description: 'Where bold ideas rise to go global. Accelerating startups across emerging markets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link href="/" className="flex items-center">
                  <span className="text-2xl font-bold text-gray-900">Gloven</span>
                </Link>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                  <Link
                    href="/"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-600"
                  >
                    Home
                  </Link>
                  <Link
                    href="/cohort"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    Cohort
                  </Link>
                  <Link
                    href="/report"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    Report
                  </Link>
                  <Link
                    href="/faq"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    FAQ
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <a
                  href="https://gloven.org/apply"
                  className="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Apply Now
                </a>
              </div>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <footer className="bg-white border-t mt-16">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Gloven. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}