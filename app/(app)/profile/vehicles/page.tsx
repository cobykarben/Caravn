'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { VehicleCard } from '@/components/vehicles/vehicle-card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Vehicle = {
  id: string
  make: string
  model: string
  year: number
  color: string
  type: string
  capacity: number
  is_default: boolean
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('vehicles')
        .select('id, make, model, year, color, type, capacity, is_default')
        .eq('owner_id', user.id)
        .order('is_default', { ascending: false })
      setVehicles((data ?? []) as Vehicle[])
    }
    load()
  }, [])

  async function setDefault(vehicleId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('vehicles').update({ is_default: false }).eq('owner_id', user.id)
    await supabase.from('vehicles').update({ is_default: true }).eq('id', vehicleId)
    setVehicles(prev => prev.map(v => ({ ...v, is_default: v.id === vehicleId })))
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">My Vehicles</h1>
        <Link
          href="/profile/vehicles/new"
          className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'gap-1.5')}
        >
          <Plus className="h-4 w-4" />
          Add
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground mb-3">No vehicles yet</p>
          <Link
            href="/profile/vehicles/new"
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            Add your first vehicle
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => (
            <VehicleCard key={v.id} vehicle={v} onSetDefault={setDefault} />
          ))}
        </div>
      )}
    </div>
  )
}
