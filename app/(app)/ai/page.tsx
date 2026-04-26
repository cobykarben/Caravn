import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AIChat } from '@/components/ai/ai-chat'

export default async function AIPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="h-[calc(100svh-4rem)]">
      <AIChat userId={user.id} />
    </div>
  )
}
