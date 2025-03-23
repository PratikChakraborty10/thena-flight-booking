import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface UserAvatarProps {
  fullName: string
  className?: string
}

export function UserAvatar({ fullName, className }: UserAvatarProps) {
  // Get initials from full name
  const getInitials = (name: string) => {
    if (!name) return ""

    const names = name.split(" ")
    if (names.length === 1) return names[0].charAt(0).toUpperCase()

    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  // Get first name
  const getFirstName = (name: string) => {
    if (!name) return ""
    return name.split(" ")[0]
  }

  return (
    <Avatar className={className}>
      <AvatarFallback className="bg-sky-100 text-sky-600">{getInitials(fullName)}</AvatarFallback>
    </Avatar>
  )
}

