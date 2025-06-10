import { redirect } from 'next/navigation'

export default function SolutionIndexRedirect() {
  redirect('/solution/dashboard')
  return null
} 