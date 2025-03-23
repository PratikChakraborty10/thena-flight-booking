"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export function LogoutButton() {
  const { signOut } = useAuth()

  return (
    <Button variant="outline" onClick={() => signOut()}>
      Logout
    </Button>
  )
}

