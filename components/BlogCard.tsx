import Link from 'next/link'

interface BlogCardProps {
  title: string
  excerpt: string
  date: string
  slug: string
}

export default function BlogCard({ title, excerpt, date, slug }: BlogCardProps) {
  return (
    <Link href={`/blogs/${slug}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{excerpt}</p>
        <p className="text-sm text-gray-500">{date}</p>
      </div>
    </Link>
  )
} 