import React from 'react'
import ToolCard from '@/components/ToolCard'
import { tools } from '@/lib/tools-data'

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