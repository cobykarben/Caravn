'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Car } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export function FAB() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleFindRide() {
    setOpen(false)
    router.push('/rides?find=1')
  }

  function handlePostRide() {
    setOpen(false)
    router.push('/rides/new')
  }

  return (
    <>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-16 z-50 pointer-events-none">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open actions"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-xl transition-transform active:scale-95 pointer-events-auto"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-10">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left">What would you like to do?</SheetTitle>
          </SheetHeader>

          <div className="space-y-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start gap-4 h-16 text-base"
              onClick={handleFindRide}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Search className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Find a Ride</div>
                <div className="text-xs text-muted-foreground font-normal">I need a ride to an event</div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start gap-4 h-16 text-base"
              onClick={handlePostRide}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Car className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Post a Ride</div>
                <div className="text-xs text-muted-foreground font-normal">I have seats to offer</div>
              </div>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
