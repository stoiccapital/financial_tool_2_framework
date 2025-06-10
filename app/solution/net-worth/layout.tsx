import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Net Worth Tracker | Finance Tool',
  description: 'Track and analyze your net worth over time with detailed breakdowns of assets and liabilities.',
};

export default function NetWorthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 