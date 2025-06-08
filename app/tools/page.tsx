'use client'

import React from 'react'
import ToolCard from '@/components/ToolCard'

const tools = [
  {
    title: 'Strategy Comparison',
    description: 'Compare different investment strategies and their potential outcomes over time.',
    href: '/tools/strategy-comparison'
  },
  {
    title: 'Buy, Borrow, Die',
    description: 'Analyze the tax-efficient strategy of borrowing against appreciating assets.',
    href: '/tools/buy-borrow-die'
  },
  {
    title: 'Income from Assets',
    description: 'Calculate potential income streams from various asset classes and investments.',
    href: '/tools/income-from-assets'
  },
  {
    title: 'Selling Assets',
    description: 'Plan and optimize the sale of assets with tax implications in mind.',
    href: '/tools/selling-assets'
  },
  {
    title: 'Retirement Calculator',
    description: 'Project your retirement needs and analyze different savings strategies.',
    href: '/tools/retirement-calculator'
  }
]

export default function Tools() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Free Tools</h1>
      <p className="text-gray-600 mb-8">
        Explore our collection of financial tools designed to help you make informed decisions.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <ToolCard
            key={tool.href}
            title={tool.title}
            description={tool.description}
            href={tool.href}
          />
        ))}
      </div>
    </div>
  )
} 