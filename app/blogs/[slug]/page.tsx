interface BlogPostProps {
  params: {
    slug: string
  }
}

export default function BlogPost({ params }: BlogPostProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <article className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold mb-4 capitalize">{params.slug}</h1>
        <div className="prose max-w-none">
          {/* Add blog post content here */}
        </div>
      </article>
    </div>
  )
} 