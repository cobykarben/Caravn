import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'

export default async function AIPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <Suspense fallback={null}>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">AI chat coming soon.</p>
            <p className="text-xs text-muted-foreground mt-1">User: {user.id}</p>
          </div>
        </div>
      </Suspense>
    </div>
  )
}
