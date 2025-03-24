"use client"

import { Suspense, useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

function EmailConfirmation() {
  const { signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const tokenHash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (!tokenHash || !type) {
          setError("Invalid confirmation link")
          setIsLoading(false)
          return
        }

        // Exchange the token hash for a session
        const { error } = await supabase.auth.verifyOtp({
          type: "email",
          token_hash: tokenHash,
        })

        if (error) {
          setError(error.message)
        } else {
          setSuccess(true)
          signOut();
          setTimeout(() => {
            router.push("/")
          }, 3000)
        }
      } catch (err) {
        console.error("Error confirming email:", err)
        setError("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    confirmEmail()
  }, [searchParams, router, supabase.auth])

  return (
    <div className="mt-8 space-y-6">
      {isLoading && (
        <div className="text-center">
          <p className="text-lg">Confirming your email...</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <div className="mt-4">
            <Link href="/login" className="text-blue-600 hover:text-blue-800 underline">
              Return to login
            </Link>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">Email confirmed successfully!</p>
          <p className="mt-2">Redirecting you to the dashboard...</p>
        </div>
      )}
    </div>
  )
}

// Main component with suspense boundary
export default function ConfirmPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Email Confirmation</h2>
        </div>

        <Suspense fallback={
          <div className="text-center mt-8">
            <p className="text-lg">Loading confirmation page...</p>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          </div>
        }>
          <EmailConfirmation />
        </Suspense>
      </div>
    </div>
  )
}