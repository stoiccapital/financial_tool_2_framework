'use client'

import React, { useState } from 'react'

type CalculationMode = 'percentage' | 'income'

interface YearlyResult {
  year: number
  assetValue: number
  amountBorrowed: number
  cumulativeBorrowed: number
  ltvRatio: number
  interestPaid: number
  monthlyBorrowAmount: number
}

export default function BuyBorrowDieCalculator() {
  const [formData, setFormData] = useState({
    currentAssetValue: '',
    expectedAnnualReturn: '',
    loanToValueRatio: '',
    interestRate: '',
    calculationMode: 'percentage' as CalculationMode,
    desiredAnnualBorrowRate: '',
    desiredMonthlyIncome: '',
    adjustForInflation: false,
    inflationRate: ''
  })

  const [results, setResults] = useState<YearlyResult[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const calculateResults = (e: React.FormEvent) => {
    e.preventDefault()
    
    const {
      currentAssetValue,
      expectedAnnualReturn,
      loanToValueRatio,
      interestRate,
      calculationMode,
      desiredAnnualBorrowRate,
      desiredMonthlyIncome,
      adjustForInflation,
      inflationRate
    } = formData

    // Convert string inputs to numbers
    const assetValue = parseFloat(currentAssetValue)
    const annualReturn = parseFloat(expectedAnnualReturn) / 100
    const ltv = parseFloat(loanToValueRatio) / 100
    const interestRateDecimal = parseFloat(interestRate) / 100
    const inflation = adjustForInflation ? parseFloat(inflationRate) / 100 : 0

    // Calculate real return rate (adjusted for inflation)
    const realReturnRate = (1 + annualReturn) / (1 + inflation) - 1

    // Calculate yearly results
    const yearlyResults: YearlyResult[] = []
    let cumulativeBorrowed = 0

    for (let year = 1; year <= 50; year++) {
      // Calculate asset value for this year
      const assetValueThisYear = assetValue * Math.pow(1 + realReturnRate, year)

      // Calculate amount borrowed this year
      let amountBorrowedThisYear = 0
      let monthlyBorrowAmount = 0

      if (calculationMode === 'percentage') {
        const borrowRate = parseFloat(desiredAnnualBorrowRate) / 100
        amountBorrowedThisYear = assetValueThisYear * borrowRate
        monthlyBorrowAmount = amountBorrowedThisYear / 12
      } else {
        monthlyBorrowAmount = parseFloat(desiredMonthlyIncome)
        if (adjustForInflation) {
          monthlyBorrowAmount *= Math.pow(1 + inflation, year - 1)
        }
        amountBorrowedThisYear = monthlyBorrowAmount * 12
      }

      cumulativeBorrowed += amountBorrowedThisYear

      // Calculate LTV ratio for this year
      const ltvRatio = (cumulativeBorrowed / assetValueThisYear) * 100

      // Calculate interest paid for this year
      const interestPaid = cumulativeBorrowed * interestRateDecimal

      yearlyResults.push({
        year,
        assetValue: assetValueThisYear,
        amountBorrowed: amountBorrowedThisYear,
        cumulativeBorrowed,
        ltvRatio,
        interestPaid,
        monthlyBorrowAmount
      })
    }

    setResults(yearlyResults)
  }

  const isInflationDisabled = formData.calculationMode === 'percentage'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Buy, Borrow, Die Calculator</h1>
      <p className="text-gray-600 mb-8">
        Calculate the potential outcomes of the Buy, Borrow, Die strategy based on your inputs.
      </p>

      <form onSubmit={calculateResults} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Asset Value */}
          <div>
            <label htmlFor="currentAssetValue" className="block text-sm font-medium text-gray-700 mb-1">
              Current Asset Value
            </label>
            <input
              type="number"
              id="currentAssetValue"
              name="currentAssetValue"
              value={formData.currentAssetValue}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Enter current asset value"
            />
          </div>

          {/* Expected Annual Return */}
          <div>
            <label htmlFor="expectedAnnualReturn" className="block text-sm font-medium text-gray-700 mb-1">
              Expected Annual Return (%)
            </label>
            <input
              type="number"
              id="expectedAnnualReturn"
              name="expectedAnnualReturn"
              value={formData.expectedAnnualReturn}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Enter expected annual return"
            />
          </div>

          {/* Loan-to-Value Ratio */}
          <div>
            <label htmlFor="loanToValueRatio" className="block text-sm font-medium text-gray-700 mb-1">
              Loan-to-Value Ratio (%)
            </label>
            <input
              type="number"
              id="loanToValueRatio"
              name="loanToValueRatio"
              value={formData.loanToValueRatio}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Enter loan-to-value ratio"
            />
          </div>

          {/* Interest Rate */}
          <div>
            <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">
              Interest Rate (%)
            </label>
            <input
              type="number"
              id="interestRate"
              name="interestRate"
              value={formData.interestRate}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Enter interest rate"
            />
          </div>

          {/* Calculation Mode */}
          <div>
            <label htmlFor="calculationMode" className="block text-sm font-medium text-gray-700 mb-1">
              Calculation Mode
            </label>
            <select
              id="calculationMode"
              name="calculationMode"
              value={formData.calculationMode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="percentage">Based on %</option>
              <option value="income">Based on Desired Income</option>
            </select>
          </div>

          {/* Conditional Inputs based on Mode */}
          {formData.calculationMode === 'percentage' ? (
            <div>
              <label htmlFor="desiredAnnualBorrowRate" className="block text-sm font-medium text-gray-700 mb-1">
                Desired Annual Borrow Rate (%)
              </label>
              <input
                type="number"
                id="desiredAnnualBorrowRate"
                name="desiredAnnualBorrowRate"
                value={formData.desiredAnnualBorrowRate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter desired annual borrow rate"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="desiredMonthlyIncome" className="block text-sm font-medium text-gray-700 mb-1">
                Desired Monthly Income
              </label>
              <input
                type="number"
                id="desiredMonthlyIncome"
                name="desiredMonthlyIncome"
                value={formData.desiredMonthlyIncome}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter desired monthly income"
              />
            </div>
          )}
        </div>

        {/* Adjust for Inflation */}
        <div className={`space-y-4 ${isInflationDisabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="adjustForInflation"
              name="adjustForInflation"
              checked={formData.adjustForInflation}
              onChange={handleInputChange}
              disabled={isInflationDisabled}
              className={`h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded ${
                isInflationDisabled ? 'cursor-not-allowed' : ''
              }`}
            />
            <label 
              htmlFor="adjustForInflation" 
              className={`ml-2 block text-sm text-gray-700 ${
                isInflationDisabled ? 'cursor-not-allowed' : ''
              }`}
            >
              Adjust for Inflation
            </label>
          </div>

          {formData.adjustForInflation && (
            <div>
              <label 
                htmlFor="inflationRate" 
                className={`block text-sm font-medium text-gray-700 mb-1 ${
                  isInflationDisabled ? 'cursor-not-allowed' : ''
                }`}
              >
                Inflation Rate (%)
              </label>
              <input
                type="number"
                id="inflationRate"
                name="inflationRate"
                value={formData.inflationRate}
                onChange={handleInputChange}
                required
                disabled={isInflationDisabled}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                  isInflationDisabled ? 'cursor-not-allowed bg-gray-100' : ''
                }`}
                placeholder="Enter inflation rate"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full md:w-auto px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Calculate
        </button>
      </form>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Borrowed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cumulative Borrowed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LTV Ratio (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Paid (Year)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Borrow</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.year} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${result.assetValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${result.amountBorrowed.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${result.cumulativeBorrowed.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.ltvRatio.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${result.interestPaid.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${result.monthlyBorrowAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 