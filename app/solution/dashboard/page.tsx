'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '@/app/lib/utils'

interface AggregatedTransaction {
  year: number
  month: string
  income: number
  expense: number
  amount: number
}

interface Projection {
  period: string
  months: number
  totalSavings: number
  totalIncome: number
  totalExpense: number
  projectedAssets: number
}

interface YearlyProjection {
  year: number
  cumulativeSavings: number
  totalAssets: number
}

interface CurrentBalance {
  year: number
  month: string
  amount: number
}

interface NetWorthEntry {
  id: string;
  date: string;
  assets: any[];
  liabilities: any[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  notes?: string;
}

const STORAGE_KEYS = {
  TRANSACTIONS: 'incomeExpenseTransactions',
  CURRENT_BALANCE: 'incomeExpenseCurrentBalance'
}

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false)
  const [metrics, setMetrics] = useState({
    avgSavings: 0,
    avgSavingsRate: 0,
    avgExpense: 0,
    avgIncome: 0,
    currentBalance: 0
  })
  const [projections, setProjections] = useState<Projection[]>([])
  const [hasData, setHasData] = useState(false)
  const [roi, setRoi] = useState(10)
  const [yearlyProjections, setYearlyProjections] = useState<YearlyProjection[]>([])

  // Net Worth Card State
  const [netWorthEntry, setNetWorthEntry] = useState<NetWorthEntry | null>(null)

  useEffect(() => {
    // Load the most recent net worth entry from localStorage
    const savedEntries = localStorage.getItem('netWorthEntries');
    if (savedEntries) {
      const parsedEntries = JSON.parse(savedEntries);
      if (parsedEntries.length > 0) {
        // Entries are sorted by date descending in the tracker
        setNetWorthEntry(parsedEntries[0]);
      }
    }
  }, [isClient]);

  useEffect(() => {
    setIsClient(true)
    const calculateMetrics = () => {
      const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
      const savedBalance = localStorage.getItem(STORAGE_KEYS.CURRENT_BALANCE)
      let currentBalance = 0

      // Load current balance if available
      if (savedBalance) {
        try {
          const balance: CurrentBalance = JSON.parse(savedBalance)
          currentBalance = balance.amount
        } catch (error) {
          console.error('Error loading current balance:', error)
        }
      }

      if (!savedTransactions) {
        setHasData(false)
        return
      }

      try {
        const transactions = JSON.parse(savedTransactions)
        if (transactions.length === 0) {
          setHasData(false)
          return
        }

        // Aggregate transactions by year/month
        const aggregated: { [key: string]: AggregatedTransaction } = {}
        transactions.forEach((transaction: any) => {
          const key = `${transaction.year}-${transaction.month}`
          if (!aggregated[key]) {
            aggregated[key] = {
              year: transaction.year,
              month: transaction.month,
              income: 0,
              expense: 0,
              amount: 0
            }
          }

          if (transaction.type === 'Income') {
            aggregated[key].income += transaction.amount
          } else {
            aggregated[key].expense += transaction.amount
          }
          aggregated[key].amount = aggregated[key].income - aggregated[key].expense
        })

        const monthlyData = Object.values(aggregated)
        const totalMonths = monthlyData.length

        // Calculate metrics
        const totalIncome = monthlyData.reduce((sum, month) => sum + month.income, 0)
        const totalExpense = monthlyData.reduce((sum, month) => sum + month.expense, 0)
        const totalSavings = totalIncome - totalExpense

        const avgIncome = totalIncome / totalMonths
        const avgExpense = totalExpense / totalMonths
        const avgSavings = totalSavings / totalMonths
        const avgSavingsRate = (avgSavings / avgIncome) * 100

        setMetrics({
          avgSavings,
          avgSavingsRate,
          avgExpense,
          avgIncome,
          currentBalance
        })

        // Calculate projections
        const periods = [
          { period: '1 Year', months: 12 },
          { period: '3 Years', months: 36 },
          { period: '5 Years', months: 60 },
          { period: '10 Years', months: 120 },
          { period: '30 Years', months: 360 }
        ]

        const newProjections = periods.map(({ period, months }) => {
          // Calculate projected assets for this period
          let projectedAssets = currentBalance
          const yearlySavings = avgSavings * 12
          const years = months / 12

          for (let year = 1; year <= years; year++) {
            projectedAssets = (projectedAssets * (1 + roi / 100)) + yearlySavings
          }

          return {
            period,
            months,
            totalSavings: (avgSavings * months) + currentBalance,
            totalIncome: avgIncome * months,
            totalExpense: avgExpense * months,
            projectedAssets
          }
        })

        setProjections(newProjections)
        setHasData(true)
      } catch (error) {
        console.error('Error calculating metrics:', error)
        setHasData(false)
      }
    }

    calculateMetrics()
  }, [])

  // Calculate yearly projections whenever ROI or metrics change
  useEffect(() => {
    if (!hasData) return

    const yearlyData: YearlyProjection[] = []
    let totalAssets = metrics.currentBalance // Start with current balance
    const yearlySavings = metrics.avgSavings * 12

    for (let year = 1; year <= 30; year++) {
      const cumulativeSavings = (yearlySavings * year) + metrics.currentBalance
      totalAssets = (totalAssets * (1 + roi / 100)) + yearlySavings

      yearlyData.push({
        year,
        cumulativeSavings,
        totalAssets
      })
    }

    setYearlyProjections(yearlyData)
  }, [roi, metrics.avgSavings, metrics.currentBalance, hasData])

  // Calculate projections whenever ROI or metrics change
  useEffect(() => {
    if (!hasData) return

    const periods = [
      { period: '1 Year', months: 12 },
      { period: '3 Years', months: 36 },
      { period: '5 Years', months: 60 },
      { period: '10 Years', months: 120 },
      { period: '30 Years', months: 360 }
    ]

    const newProjections = periods.map(({ period, months }) => {
      // Calculate projected assets for this period
      let projectedAssets = metrics.currentBalance
      const yearlySavings = metrics.avgSavings * 12
      const years = months / 12

      for (let year = 1; year <= years; year++) {
        projectedAssets = (projectedAssets * (1 + roi / 100)) + yearlySavings
      }

      return {
        period,
        months,
        totalSavings: (metrics.avgSavings * months) + metrics.currentBalance,
        totalIncome: metrics.avgIncome * months,
        totalExpense: metrics.avgExpense * months,
        projectedAssets
      }
    })

    setProjections(newProjections)
  }, [roi, metrics, hasData])

  // Helper to calculate projections based on clarified formulas
  const getProjectionData = () => {
    if (!netWorthEntry) return [];
    const annualSavings = metrics.avgSavings * 12;
    const roiDecimal = roi / 100;
    const periods = [
      { period: '1 Year', years: 1 },
      { period: '3 Years', years: 3 },
      { period: '5 Years', years: 5 },
      { period: '10 Years', years: 10 },
      { period: '30 Years', years: 30 },
    ];
    return periods.map(({ period, years }) => {
      // Projected Savings (linear, no compounding)
      const projectedSavings = netWorthEntry.netWorth + annualSavings * years;
      // Projected Net Worth (compounding)
      let projectedNetWorth = netWorthEntry.netWorth;
      for (let y = 0; y < years; y++) {
        projectedNetWorth = (projectedNetWorth + annualSavings) * (1 + roiDecimal);
      }
      return {
        period,
        years,
        projectedSavings,
        projectedNetWorth,
      };
    });
  };

  const projectionData = getProjectionData();

  if (!isClient) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Financial Dashboard</h1>

      {/* Total Net Worth Card (replaces Current Balance) */}
      <div
        className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-8 text-white cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => window.location.href = '/solution/net-worth'}
        title="Go to Net Worth Tracker"
      >
        <h2 className="text-2xl font-semibold mb-2">Total Net Worth</h2>
        <div className="text-4xl font-bold mb-2">
          {netWorthEntry ? formatCurrency(netWorthEntry.netWorth) : '$0.00'}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <p className="text-blue-200">Total Assets</p>
            <p className="text-xl font-semibold">{netWorthEntry ? formatCurrency(netWorthEntry.totalAssets) : '$0.00'}</p>
          </div>
          <div>
            <p className="text-blue-200">Total Liabilities</p>
            <p className="text-xl font-semibold">{netWorthEntry ? formatCurrency(netWorthEntry.totalLiabilities) : '$0.00'}</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h2>
          <p className="text-gray-600 mb-6">
            Start tracking your income and expenses to see your financial metrics.
          </p>
          <Link
            href="/solution"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Income & Expense Tracker
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Average Savings Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Average Savings</h2>
              <p className={`text-2xl font-bold ${
                metrics.avgSavings >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                €{metrics.avgSavings.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              <p className="text-sm text-gray-500 mt-2">per month</p>
            </div>

            {/* Average Savings Rate Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Savings Rate</h2>
              <p className={`text-2xl font-bold ${
                metrics.avgSavingsRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metrics.avgSavingsRate.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}%
              </p>
              <p className="text-sm text-gray-500 mt-2">of average income</p>
            </div>

            {/* Average Expense Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Average Expense</h2>
              <p className="text-2xl font-bold text-red-600">
                €{metrics.avgExpense.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              <p className="text-sm text-gray-500 mt-2">per month</p>
            </div>

            {/* Average Income Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Average Income</h2>
              <p className="text-2xl font-bold text-green-600">
                €{metrics.avgIncome.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              <p className="text-sm text-gray-500 mt-2">per month</p>
            </div>
          </div>

          {/* ROI Input and Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">30-Year Projection</h2>
              <div className="flex items-center space-x-4">
                <label htmlFor="roi" className="text-sm font-medium text-gray-700">
                  Expected Yearly Return (ROI):
                </label>
                <input
                  type="number"
                  id="roi"
                  value={roi}
                  onChange={(e) => setRoi(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={projectionData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis
                    tickFormatter={(value) => {
                      if (value >= 1000000000) {
                        return `€${(value / 1000000000).toFixed(1)}B`;
                      }
                      if (value >= 1000000) {
                        return `€${(value / 1000000).toFixed(1)}M`;
                      }
                      if (value >= 1000) {
                        return `€${(value / 1000).toFixed(1)}K`;
                      }
                      return `€${value}`;
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `€${value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`,
                      '',
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="projectedSavings"
                    name="Projected Savings (No ROI)"
                    stroke="#10B981"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="projectedNetWorth"
                    name="Projected Net Worth (With ROI)"
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Projection Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700">Projection Table</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                    {projectionData.map((proj) => (
                      <th key={proj.period} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{proj.period}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Projected Savings Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Projected Savings (No ROI)</td>
                    {projectionData.map((proj) => (
                      <td key={`savings-${proj.period}`} className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(proj.projectedSavings)}</td>
                    ))}
                  </tr>
                  {/* Projected Net Worth Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Projected Net Worth (With ROI)</td>
                    {projectionData.map((proj) => (
                      <td key={`networth-${proj.period}`} className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{formatCurrency(proj.projectedNetWorth)}</td>
                    ))}
                  </tr>
                  {/* Projected Total Income Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Projected Total Income</td>
                    {projections.map((projection) => (
                      <td key={`income-${projection.period}`} className="px-6 py-4 whitespace-nowrap text-sm text-green-600">€{projection.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    ))}
                  </tr>
                  {/* Projected Total Expense Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Projected Total Expense</td>
                    {projections.map((projection) => (
                      <td key={`expense-${projection.period}`} className="px-6 py-4 whitespace-nowrap text-sm text-red-600">€{projection.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 