"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

type User = {
  id: string
  email: string
  name: string | null
}

type UserProfile = {
  id: string
  user_id: string
  name: string
  created_at: string
}

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true)

      try {
        // Check if there's an existing session
        const { data: { session } } = await supabase.auth.getSession()
        
        // Get user from the session or directly
        const {
          data: { user },
          error: userError,
        } = session 
          ? { data: { user: session.user }, error: null } 
          : await supabase.auth.getUser()

        if (userError) {
          console.error("Error getting user:", userError)
          setIsLoading(false)
          return
        }

        if (user) {
          setUser({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || null,
          })

          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (profileError && profileError.code !== "PGRST116") {
            // PGRST116 is the error for no rows returned
            console.error("Error getting profile:", profileError)
          }

          if (profileData) {
            setProfile(profileData)
            setUser((prev) => (prev ? { ...prev, name: profileData.name } : null))
          }
        }
      } catch (error) {
        console.error("Error in auth context:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || null,
        })

        // Get user profile
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
          setUser((prev) => (prev ? { ...prev, name: profileData.name } : null))
        }
        
        router.refresh()
      } else {
        setUser(null)
        setProfile(null)
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name, // Store name in auth metadata
          },
        },
      });
  
      if (error) throw error;
  
      // Create user profile - this might need to be done in a server-side function after email confirmation
      if (data.user) {
        try {
          const { error: profileError } = await supabase.from("user_profiles").insert({
            user_id: data.user.id,
            name,
          })
          
          if (profileError) console.error("Error creating profile:", profileError)
        } catch (profileError) {
          console.error("Error creating profile:", profileError)
        }
      }
      
      router.push("/login?message=Check your email to confirm your account. Please check the SPAM Folder")
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      // First clear the user state
      setUser(null)
      setProfile(null)

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      // Navigate after state is cleared
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const value = {
    user,
    profile,
    isLoading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}