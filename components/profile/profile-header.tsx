import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

type Props = {
  profile: {
    full_name: string
    username: string
    bio: string | null
    phone_verified: boolean
    avatar_url: string | null
  }
}

export function ProfileHeader({ profile }: Props) {
  return (
    <div className="flex flex-col items-center text-center pt-8 pb-6 px-4">
      <Avatar className="w-20 h-20 mb-4">
        {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
        <AvatarFallback className="text-2xl bg-muted">
          {profile.full_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <h1 className="text-xl font-bold">{profile.full_name}</h1>
      <p className="text-muted-foreground text-sm mb-3">@{profile.username}</p>

      {profile.bio && (
        <p className="text-sm text-muted-foreground max-w-xs mb-3">{profile.bio}</p>
      )}

      {profile.phone_verified ? (
        <Badge variant="outline" className="text-xs text-green-400 border-green-800">
          Phone verified
        </Badge>
      ) : (
        <Link
          href="/profile/verify-phone"
          className="text-xs text-muted-foreground underline underline-offset-4"
        >
          Verify phone
        </Link>
      )}
    </div>
  )
}
