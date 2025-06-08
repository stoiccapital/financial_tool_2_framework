import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-primary">Finance Tools</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-700 hover:text-primary">
              Dashboard
            </Link>
            <Link href="/tools" className="text-gray-700 hover:text-primary">
              Free Tools
            </Link>
            <Link href="/blogs" className="text-gray-700 hover:text-primary">
              Blogs
            </Link>
            <Link href="/solution" className="text-gray-700 hover:text-primary">
              Solution
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 