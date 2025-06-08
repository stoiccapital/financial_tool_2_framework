interface ToolPageProps {
  params: {
    tool: string
  }
}

export default function ToolPage({ params }: ToolPageProps) {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 capitalize">{params.tool}</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Add tool-specific content here */}
      </div>
    </div>
  )
} 