'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'

// Budget planning types
const BUDGET_STORAGE_KEY = 'planningBudgetData'
const frequencies = [
  { label: 'Monthly', value: 'monthly', factor: 1 },
  { label: 'Quarterly', value: 'quarterly', factor: 1 / 3 },
  { label: 'Yearly', value: 'yearly', factor: 1 / 12 },
]

interface RecurringCost {
  id: string
  name: string
  amount: number
  frequency: 'monthly' | 'quarterly' | 'yearly'
}

interface OneTimeCost {
  id: string
  name: string
  amount: number
}

interface PlanningBudget {
  needs: {
    recurring: RecurringCost[]
    oneTime: OneTimeCost[]
  }
  wants: {
    recurring: RecurringCost[]
    oneTime: OneTimeCost[]
  }
}

function getMonthlyAmount(cost: RecurringCost) {
  if (cost.frequency === 'monthly') return cost.amount
  if (cost.frequency === 'quarterly') return cost.amount / 3
  if (cost.frequency === 'yearly') return cost.amount / 12
  return 0
}

export default function PlanningBudget() {
  const [isClient, setIsClient] = useState(false)
  const [planningBudget, setPlanningBudget] = useState<PlanningBudget>({
    needs: { recurring: [], oneTime: [] },
    wants: { recurring: [], oneTime: [] }
  })
  const [showForm, setShowForm] = useState<{
    category: 'needs' | 'wants'
    type: 'recurring' | 'oneTime'
  } | null>(null)
  const [budgetForm, setBudgetForm] = useState({
    category: 'needs' as 'needs' | 'wants',
    type: 'recurring' as 'recurring' | 'oneTime',
    name: '',
    amount: '',
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    editId: null as string | null,
  })

  // Handle hydration
  useEffect(() => {
    setIsClient(true)
    const savedBudget = localStorage.getItem(BUDGET_STORAGE_KEY)
    if (savedBudget) {
      try {
        const parsed = JSON.parse(savedBudget)
        // MIGRATION/SANITIZATION: ensure structure is always correct
        const safeBudget: PlanningBudget = {
          needs: {
            recurring: Array.isArray(parsed?.needs?.recurring)
              ? parsed.needs.recurring
              : Array.isArray(parsed?.needs)
                ? parsed.needs // migrate from old array
                : [],
            oneTime: Array.isArray(parsed?.needs?.oneTime) ? parsed.needs.oneTime : [],
          },
          wants: {
            recurring: Array.isArray(parsed?.wants?.recurring)
              ? parsed.wants.recurring
              : Array.isArray(parsed?.wants)
                ? parsed.wants // migrate from old array
                : [],
            oneTime: Array.isArray(parsed?.wants?.oneTime) ? parsed.wants.oneTime : [],
          },
        }
        setPlanningBudget(safeBudget)
      } catch {}
    }
  }, [])

  // Save planning budget to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(planningBudget))
    }
  }, [planningBudget, isClient])

  const handleBudgetInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setBudgetForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { category, type, name, amount, frequency, editId } = budgetForm
    if (!name.trim() || !amount) return
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount < 0) return

    if (type === 'recurring') {
      if (editId) {
        setPlanningBudget((prev) => ({
          ...prev,
          [category]: {
            ...prev[category],
            recurring: prev[category].recurring.map((cost) =>
              cost.id === editId ? { ...cost, name, amount: parsedAmount, frequency } : cost
            ),
          },
        }))
      } else {
        setPlanningBudget((prev) => ({
          ...prev,
          [category]: {
            ...prev[category],
            recurring: [
              ...prev[category].recurring,
              { id: Date.now().toString(), name, amount: parsedAmount, frequency },
            ],
          },
        }))
      }
    } else {
      if (editId) {
        setPlanningBudget((prev) => ({
          ...prev,
          [category]: {
            ...prev[category],
            oneTime: prev[category].oneTime.map((cost) =>
              cost.id === editId ? { ...cost, name, amount: parsedAmount } : cost
            ),
          },
        }))
      } else {
        setPlanningBudget((prev) => ({
          ...prev,
          [category]: {
            ...prev[category],
            oneTime: [
              ...prev[category].oneTime,
              { id: Date.now().toString(), name, amount: parsedAmount },
            ],
          },
        }))
      }
    }
    setBudgetForm({ category, type, name: '', amount: '', frequency: 'monthly', editId: null })
    setShowForm(null)
  }

  const handleBudgetEdit = (category: 'needs' | 'wants', type: 'recurring' | 'oneTime', cost: RecurringCost | OneTimeCost) => {
    setBudgetForm({
      category,
      type,
      name: cost.name,
      amount: cost.amount.toString(),
      frequency: type === 'recurring' ? (cost as RecurringCost).frequency : 'monthly',
      editId: cost.id,
    })
    setShowForm({ category, type })
  }

  const handleBudgetDelete = (category: 'needs' | 'wants', type: 'recurring' | 'oneTime', id: string) => {
    if (window.confirm('Are you sure you want to delete this cost?')) {
      setPlanningBudget((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [type]: prev[category][type].filter((cost) => cost.id !== id),
        },
      }))
      if (budgetForm.editId === id) {
        setBudgetForm({ ...budgetForm, name: '', amount: '', frequency: 'monthly', editId: null })
        setShowForm(null)
      }
    }
  }

  const totalMonthlyRecurring = (category: 'needs' | 'wants') =>
    planningBudget[category].recurring.reduce((sum, cost) => sum + getMonthlyAmount(cost), 0)

  const totalOneTime = (category: 'needs' | 'wants') =>
    planningBudget[category].oneTime.reduce((sum, cost) => sum + cost.amount, 0)

  // Don't render anything until we're on the client side
  if (!isClient) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Planning Budget</h1>

      {/* Needs Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Needs</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setBudgetForm({ category: 'needs', type: 'recurring', name: '', amount: '', frequency: 'monthly', editId: null })
                setShowForm({ category: 'needs', type: 'recurring' })
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus size={20} />
              Add Recurring Cost
            </button>
            <button
              onClick={() => {
                setBudgetForm({ category: 'needs', type: 'oneTime', name: '', amount: '', frequency: 'monthly', editId: null })
                setShowForm({ category: 'needs', type: 'oneTime' })
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Plus size={20} />
              Add One-Time Cost
            </button>
          </div>
        </div>

        {/* Needs Form */}
        {showForm?.category === 'needs' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {budgetForm.editId ? 'Edit Cost' : `Add ${showForm.type === 'recurring' ? 'Recurring' : 'One-Time'} Cost`}
            </h3>
            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={budgetForm.name}
                  onChange={handleBudgetInputChange}
                  placeholder="Enter description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={budgetForm.amount}
                    onChange={handleBudgetInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {showForm.type === 'recurring' && (
                  <div>
                    <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <select
                      id="frequency"
                      name="frequency"
                      value={budgetForm.frequency}
                      onChange={handleBudgetInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {frequencies.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(null)
                    setBudgetForm({ category: 'needs', type: 'recurring', name: '', amount: '', frequency: 'monthly', editId: null })
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {budgetForm.editId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recurring Costs List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Recurring Costs</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {planningBudget.needs.recurring.map((cost) => (
              <div key={cost.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{cost.name}</h4>
                    <p className="text-sm text-gray-500">
                      €{cost.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      <span className="text-gray-400">
                        ({frequencies.find((f) => f.value === cost.frequency)?.label})
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleBudgetEdit('needs', 'recurring', cost)}
                      className="text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleBudgetDelete('needs', 'recurring', cost.id)}
                      className="text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {planningBudget.needs.recurring.length === 0 && (
              <div className="p-4 text-center text-gray-500">No recurring costs added yet</div>
            )}
          </div>
        </div>

        {/* One-Time Costs List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">One-Time Costs</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {planningBudget.needs.oneTime.map((cost) => (
              <div key={cost.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{cost.name}</h4>
                    <p className="text-sm text-gray-500">
                      €{cost.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleBudgetEdit('needs', 'oneTime', cost)}
                      className="text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleBudgetDelete('needs', 'oneTime', cost.id)}
                      className="text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {planningBudget.needs.oneTime.length === 0 && (
              <div className="p-4 text-center text-gray-500">No one-time costs added yet</div>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Totals</h3>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total Monthly Recurring:</span>
              <span className="text-lg font-semibold text-blue-600">
                €{totalMonthlyRecurring('needs').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total One-Time:</span>
              <span className="text-lg font-semibold text-green-600">
                €{totalOneTime('needs').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Wants Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Wants</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setBudgetForm({ category: 'wants', type: 'recurring', name: '', amount: '', frequency: 'monthly', editId: null })
                setShowForm({ category: 'wants', type: 'recurring' })
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus size={20} />
              Add Recurring Cost
            </button>
            <button
              onClick={() => {
                setBudgetForm({ category: 'wants', type: 'oneTime', name: '', amount: '', frequency: 'monthly', editId: null })
                setShowForm({ category: 'wants', type: 'oneTime' })
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Plus size={20} />
              Add One-Time Cost
            </button>
          </div>
        </div>

        {/* Wants Form */}
        {showForm?.category === 'wants' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {budgetForm.editId ? 'Edit Cost' : `Add ${showForm.type === 'recurring' ? 'Recurring' : 'One-Time'} Cost`}
            </h3>
            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div>
                <label htmlFor="wants-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="wants-name"
                  name="name"
                  value={budgetForm.name}
                  onChange={handleBudgetInputChange}
                  placeholder="Enter description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wants-amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    id="wants-amount"
                    name="amount"
                    value={budgetForm.amount}
                    onChange={handleBudgetInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {showForm.type === 'recurring' && (
                  <div>
                    <label htmlFor="wants-frequency" className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <select
                      id="wants-frequency"
                      name="frequency"
                      value={budgetForm.frequency}
                      onChange={handleBudgetInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {frequencies.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(null)
                    setBudgetForm({ category: 'wants', type: 'recurring', name: '', amount: '', frequency: 'monthly', editId: null })
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {budgetForm.editId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recurring Costs List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Recurring Costs</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {planningBudget.wants.recurring.map((cost) => (
              <div key={cost.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{cost.name}</h4>
                    <p className="text-sm text-gray-500">
                      €{cost.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      <span className="text-gray-400">
                        ({frequencies.find((f) => f.value === cost.frequency)?.label})
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleBudgetEdit('wants', 'recurring', cost)}
                      className="text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleBudgetDelete('wants', 'recurring', cost.id)}
                      className="text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {planningBudget.wants.recurring.length === 0 && (
              <div className="p-4 text-center text-gray-500">No recurring costs added yet</div>
            )}
          </div>
        </div>

        {/* One-Time Costs List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">One-Time Costs</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {planningBudget.wants.oneTime.map((cost) => (
              <div key={cost.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{cost.name}</h4>
                    <p className="text-sm text-gray-500">
                      €{cost.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleBudgetEdit('wants', 'oneTime', cost)}
                      className="text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleBudgetDelete('wants', 'oneTime', cost.id)}
                      className="text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {planningBudget.wants.oneTime.length === 0 && (
              <div className="p-4 text-center text-gray-500">No one-time costs added yet</div>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Totals</h3>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total Monthly Recurring:</span>
              <span className="text-lg font-semibold text-blue-600">
                €{totalMonthlyRecurring('wants').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total One-Time:</span>
              <span className="text-lg font-semibold text-green-600">
                €{totalOneTime('wants').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 