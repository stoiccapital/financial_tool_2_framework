'use client'

import React, { useState, useEffect } from 'react'

interface Transaction {
  id: string
  year: number
  month: string
  type: 'Income' | 'Expense'
  amount: number
}

interface AggregatedTransaction {
  year: number
  month: string
  income: number
  expense: number
  amount: number
}

interface CurrentBalance {
  year: number
  month: string
  amount: number
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Local storage keys
const STORAGE_KEYS = {
  TRANSACTIONS: 'incomeExpenseTransactions',
  LAST_YEAR: 'incomeExpenseLastYear',
  LAST_MONTH: 'incomeExpenseLastMonth',
  CURRENT_BALANCE: 'incomeExpenseCurrentBalance'
}

// Helper function to safely parse JSON
const safeJSONParse = <T,>(data: string | null, fallback: T): T => {
  if (!data) return fallback
  try {
    return JSON.parse(data) as T
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return fallback
  }
}

// Helper function to aggregate transactions
const aggregateTransactions = (transactions: Transaction[]): AggregatedTransaction[] => {
  const aggregated: { [key: string]: AggregatedTransaction } = {}

  transactions.forEach(transaction => {
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

  return Object.values(aggregated).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return months.indexOf(b.month) - months.indexOf(a.month)
  })
}

export default function IncomeExpenseTracker() {
  const [isClient, setIsClient] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showBalanceForm, setShowBalanceForm] = useState(false)
  const [lastUsedYear, setLastUsedYear] = useState(new Date().getFullYear())
  const [lastUsedMonth, setLastUsedMonth] = useState(months[new Date().getMonth()])
  const [currentBalance, setCurrentBalance] = useState<CurrentBalance | null>(null)
  const [formData, setFormData] = useState({
    year: lastUsedYear,
    month: lastUsedMonth,
    type: 'Income' as 'Income' | 'Expense',
    amount: ''
  })
  const [balanceFormData, setBalanceFormData] = useState({
    amount: ''
  })

  // Handle hydration
  useEffect(() => {
    setIsClient(true)
    // Load data from localStorage
    const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions))
      } catch (error) {
        console.error('Error loading transactions:', error)
      }
    }

    const savedYear = localStorage.getItem(STORAGE_KEYS.LAST_YEAR)
    if (savedYear) {
      const year = parseInt(savedYear)
      setLastUsedYear(year)
      setFormData(prev => ({ ...prev, year }))
    }

    const savedMonth = localStorage.getItem(STORAGE_KEYS.LAST_MONTH)
    if (savedMonth) {
      setLastUsedMonth(savedMonth)
      setFormData(prev => ({ ...prev, month: savedMonth }))
    }

    const savedBalance = localStorage.getItem(STORAGE_KEYS.CURRENT_BALANCE)
    if (savedBalance) {
      try {
        setCurrentBalance(JSON.parse(savedBalance))
      } catch (error) {
        console.error('Error loading current balance:', error)
      }
    }
  }, [])

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (isClient && transactions.length > 0) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions))
    }
  }, [transactions, isClient])

  // Save last used year and month to localStorage whenever they change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(STORAGE_KEYS.LAST_YEAR, lastUsedYear.toString())
      localStorage.setItem(STORAGE_KEYS.LAST_MONTH, lastUsedMonth)
    }
  }, [lastUsedYear, lastUsedMonth, isClient])

  // Save current balance to localStorage whenever it changes
  useEffect(() => {
    if (isClient && currentBalance) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_BALANCE, JSON.stringify(currentBalance))
    }
  }, [currentBalance, isClient])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBalanceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setBalanceFormData(prev => ({
      ...prev,
      amount: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      year: formData.year,
      month: formData.month,
      type: formData.type,
      amount: parseFloat(formData.amount)
    }

    setTransactions(prev => [...prev, newTransaction])
    setLastUsedYear(formData.year)
    setLastUsedMonth(formData.month)
    setFormData(prev => ({
      ...prev,
      amount: ''
    }))
    setShowForm(false)
  }

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newBalance: CurrentBalance = {
      year: new Date().getFullYear(),
      month: months[new Date().getMonth()],
      amount: parseFloat(balanceFormData.amount)
    }

    setCurrentBalance(newBalance)
    setBalanceFormData({ amount: '' })
    setShowBalanceForm(false)
  }

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all transactions?')) {
      setTransactions([])
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS)
    }
  }

  const handleDeleteMonth = (year: number, month: string) => {
    if (window.confirm(`Are you sure you want to delete all transactions for ${month} ${year}?`)) {
      setTransactions(prev => 
        prev.filter(t => !(t.year === year && t.month === month))
      )
    }
  }

  const handleImport = () => {
    // Placeholder for import functionality
    alert('Import functionality will be implemented here')
  }

  const handleExport = () => {
    // Placeholder for export functionality
    alert('Export functionality will be implemented here')
  }

  const openForm = () => {
    setFormData(prev => ({
      ...prev,
      year: lastUsedYear,
      month: lastUsedMonth
    }))
    setShowForm(true)
  }

  const openBalanceForm = () => {
    setBalanceFormData({ amount: '' })
    setShowBalanceForm(true)
  }

  // Don't render anything until we're on the client side
  if (!isClient) {
    return null
  }

  const aggregatedTransactions = aggregateTransactions(transactions)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Income & Expense Tracker</h1>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <button
          onClick={openForm}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add new Transaction
        </button>
        <button
          onClick={handleClearData}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Clear all data
        </button>
        <button
          onClick={handleImport}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Import Excel/CSV
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Export Excel/CSV
        </button>
      </div>

      {/* Transaction Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add New Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  id="month"
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map(month => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Income
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expense
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {aggregatedTransactions.map((transaction) => (
                <tr key={`${transaction.year}-${transaction.month}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.month} {transaction.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    €{transaction.income.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    €{transaction.expense.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    €{transaction.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDeleteMonth(transaction.year, transaction.month)}
                      className="text-red-600 hover:text-red-900 focus:outline-none focus:underline"
                    >
                      Delete Month
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 