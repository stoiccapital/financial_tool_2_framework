'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

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
}

const STORAGE_KEY = 'incomeExpenseTransactions'

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false)
  const [metrics, setMetrics] = useState({
    avgSavings: 0,
    avgSavingsRate: 0,
    avgExpense: 0,
    avgIncome: 0
  })
  const [projections, setProjections] = useState<Projection[]>([])
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const calculateMetrics = () => {
      const savedTransactions = localStorage.getItem(STORAGE_KEY)
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
          avgIncome
        })

        // Calculate projections
        const periods = [
          { period: '1 Year', months: 12 },
          { period: '3 Years', months: 36 },
          { period: '5 Years', months: 60 },
          { period: '10 Years', months: 120 },
          { period: '30 Years', months: 360 }
        ]

        const newProjections = periods.map(({ period, months }) => ({
          period,
          months,
          totalSavings: avgSavings * months,
          totalIncome: avgIncome * months,
          totalExpense: avgExpense * months
        }))

        setProjections(newProjections)
        setHasData(true)
      } catch (error) {
        console.error('Error calculating metrics:', error)
        setHasData(false)
      }
    }

    calculateMetrics()
  }, [])

  if (!isClient) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Financial Dashboard</h1>

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
                ${metrics.avgSavings.toLocaleString(undefined, {
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
                ${metrics.avgExpense.toLocaleString(undefined, {
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
                ${metrics.avgIncome.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              <p className="text-sm text-gray-500 mt-2">per month</p>
            </div>
          </div>

          {/* Projections Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700">Financial Projections</h2>
              <p className="text-sm text-gray-500 mt-1">
                Based on current average monthly metrics
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    {projections.map((projection) => (
                      <th
                        key={projection.period}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {projection.period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Total Savings Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Projected Total Savings
                    </td>
                    {projections.map((projection) => (
                      <td
                        key={`savings-${projection.period}`}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          projection.totalSavings >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ${projection.totalSavings.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                    ))}
                  </tr>
                  {/* Total Income Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Projected Total Income
                    </td>
                    {projections.map((projection) => (
                      <td
                        key={`income-${projection.period}`}
                        className="px-6 py-4 whitespace-nowrap text-sm text-green-600"
                      >
                        ${projection.totalIncome.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                    ))}
                  </tr>
                  {/* Total Expense Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Projected Total Expense
                    </td>
                    {projections.map((projection) => (
                      <td
                        key={`expense-${projection.period}`}
                        className="px-6 py-4 whitespace-nowrap text-sm text-red-600"
                      >
                        ${projection.totalExpense.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Link to Income & Expense Tracker */}
      <div className="mt-8 text-center">
        <Link
          href="/solution"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Manage Income & Expenses
        </Link>
      </div>
    </div>
  )
} 