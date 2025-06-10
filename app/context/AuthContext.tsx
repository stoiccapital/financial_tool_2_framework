'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

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

  const signInWithGoogle = async () => {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      console.log('Google sign in - redirecting to:', redirectTo)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            next: searchParams.get('redirectedFrom') || '/solution/dashboard'
          }
        }
      })

      if (error) {
        console.error('Google sign in error:', error)
        throw error
      }

      if (data?.url) {
        console.log('Redirecting to Google auth URL:', data.url)
        window.location.href = data.url
      } else {
        console.error('No redirect URL received from Google auth')
        throw new Error('No redirect URL received')
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      throw new Error(error.message || 'Failed to sign in with Google')
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(searchParams.get('redirectedFrom') || '/solution/dashboard')
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
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut
    }}>
      {children}
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