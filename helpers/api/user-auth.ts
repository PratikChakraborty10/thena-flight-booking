import { supabase } from "@/lib/supabase"

// Authentication functions
export async function signUpUser(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
  
    if (error) {
      throw error
    }
  
    if (data?.user) {
      // Create a record in the user_profiles table
      await supabase.from("user_profiles").insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
      })
    }
  
    return data
  }
  
  export async function signInUser(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
  
    if (error) {
      throw error
    }
  
    return data
  }
  
  export async function signOutUser() {
    const { error } = await supabase.auth.signOut()
  
    if (error) {
      throw error
    }
  }
  
  export async function getCurrentUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
  
    if (!session) {
      return null
    }
  
    const { data, error } = await supabase.auth.getUser()
  
    if (error || !data?.user) {
      return null
    }
  
    return data.user
  }
  
  export async function getUserProfile(userId: string) {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()
  
    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  
    return data
  }