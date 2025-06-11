'use client'

import { createContext, useContext, useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type User = {
  id: string
  email: string
  avatar_url?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create a client component for handling search params
function SearchParamsHandler({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  return <>{children}</>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      isProduction: process.env.NODE_ENV === 'production'
    })
  }, [])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    console.log('AuthProvider mounted')
    
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Session check:', { session, error })
      if (error) {
        console.error('Session error:', error)
        setLoading(false)
        return
      }
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          avatar_url: session.user.user_metadata.avatar_url
        })
      }
      setLoading(false)
    })

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', { event, session })
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          avatar_url: session.user.user_metadata.avatar_url
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      console.log('AuthProvider unmounting')
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/solution/dashboard')
    } catch (error: any) {
      console.error('Error signing in with email:', error)
      throw new Error(error.message || 'Failed to sign in with email')
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
      router.push('/auth/login?message=Check your email to confirm your account')
    } catch (error: any) {
      console.error('Error signing up with email:', error)
      throw new Error(error.message || 'Failed to sign up')
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/auth/login')
    } catch (error: any) {
      console.error('Error signing out:', error)
      throw new Error(error.message || 'Failed to sign out')
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signOut
    }}>
      <Suspense fallback={<div>Loading...</div>}>
        <SearchParamsHandler>
          {children}
        </SearchParamsHandler>
      </Suspense>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 