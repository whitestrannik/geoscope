import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, type User, type AuthError } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, username?: string) => Promise<{ error?: AuthError }>
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>
  signOut: () => Promise<void>
  updateProfile: (data: { username?: string }) => Promise<{ error?: AuthError }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user as User || null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {

        setSession(session)
        setUser(session?.user as User || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (
    email: string, 
    password: string, 
    username?: string
  ): Promise<{ error?: AuthError }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0] // Default username from email
          }
        }
      })

      if (error) {
        return { error: { message: error.message, status: error.status } }
      }

      return {}
    } catch (err) {
      return { error: { message: 'Sign up failed', status: 500 } }
    }
  }

  const signIn = async (email: string, password: string): Promise<{ error?: AuthError }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: { message: error.message, status: error.status } }
      }

      return {}
    } catch (err) {
      return { error: { message: 'Sign in failed', status: 500 } }
    }
  }

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (data: { username?: string }): Promise<{ error?: AuthError }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        data
      })

      if (error) {
        return { error: { message: error.message, status: error.status } }
      }

      return {}
    } catch (err) {
      return { error: { message: 'Profile update failed', status: 500 } }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
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