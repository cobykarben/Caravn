import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AIChat } from '@/components/ai/ai-chat'

function truncate(str: string, max = 28): string {
  return str.length <= max ? str : str.slice(0, max - 1) + '…'
}

export default async function AIPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: events } = await supabase
    .from('events')
    .select('name')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(4)

  let suggestions: string[]
  if (events && events.length >= 2) {
    // Alternate find/post prompts so the user sees both use-cases
    suggestions = events.slice(0, 3).map((e, i) => {
      const name = e.name as string
      return i % 2 === 0
        ? `Find a ride to ${truncate(name)}`
        : `Post a ride to ${truncate(name)}`
    })
  } else if (events && events.length === 1) {
    const name = events[0]!.name as string
    suggestions = [
      `Find a ride to ${truncate(name)}`,
      `Post a ride to ${truncate(name)}`,
      'What events are near me?',
    ]
  } else {
    suggestions = ['Find me a ride tonight', 'Post a ride to a game', 'What events are near me?']
  }

  return (
    <div className="h-[calc(100svh-4rem)]">
      <AIChat userId={user.id} suggestions={suggestions} />
    </div>
  )
}
