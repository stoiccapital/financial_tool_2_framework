'use client'

import React from 'react'
import Link from 'next/link'

interface ToolCardProps {
  title: string
  description: string
  href: string
}

export default function ToolCard({ title, description, href }: ToolCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  )
} 