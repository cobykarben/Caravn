import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProfileHeader } from '@/components/profile/profile-header'
import { Button } from '@/components/ui/button'
import { ChevronRight, Car, Users, LogOut } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, username, bio, phone_verified, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profileData) redirect('/login')

  const profile = profileData as {
    full_name: string
    username: string
    bio: string | null
    phone_verified: boolean
    avatar_url: string | null
  }

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="pb-8">
      <ProfileHeader profile={profile} />

      <div className="px-4 space-y-2 mt-2">
        <Link
          href="/profile/edit"
          className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl bg-card border border-border"
        >
          <span className="text-sm font-medium">Edit Profile</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          href="/profile/vehicles"
          className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">My Vehicles</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          href="/profile/friends"
          className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Friends</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <form action={signOut} className="mt-6">
          <Button type="submit" variant="outline" className="w-full gap-2 text-red-400 border-red-900 hover:text-red-300">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}
