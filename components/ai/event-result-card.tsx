'use client'

import { CalendarDays, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type EventResultData = {
  id: string
  name: string
  venue_name: string
  city: string
  starts_at: string
  category?: string
}

type Props = {
  data: EventResultData
  onSend: (text: string) => void
}

export function EventResultCard({ data, onSend }: Props) {
  const dateStr = new Date(data.starts_at).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
  const timeStr = new Date(data.starts_at).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className="mt-2 rounded-xl border border-border bg-background overflow-hidden">
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight">{data.name}</p>
          {data.category && (
            <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
              {data.category}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>{dateStr} · {timeStr}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{data.venue_name} · {data.city}</span>
        </div>
      </div>
      <div className="flex border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-none rounded-bl-xl text-xs h-9 font-medium"
          onClick={() => onSend("yes, that's the one")}
        >
          That&apos;s the one
        </Button>
        <div className="w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-none rounded-br-xl text-xs h-9 text-muted-foreground"
          onClick={() => onSend('not this one, show me different results')}
        >
          Not this one
        </Button>
      </div>
    </div>
  )
}
