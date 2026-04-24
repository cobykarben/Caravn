import { Car } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type VehicleCardProps = {
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    color: string
    type: string
    capacity: number
    is_default: boolean
  }
  onSetDefault?: (id: string) => void
}

export function VehicleCard({ vehicle, onSetDefault }: VehicleCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {vehicle.color} · {vehicle.type} · {vehicle.capacity} seats
            </p>
          </div>
        </div>
        {vehicle.is_default && (
          <Badge variant="outline" className="text-xs shrink-0">Default</Badge>
        )}
      </div>

      {onSetDefault && !vehicle.is_default && (
        <button
          onClick={() => onSetDefault(vehicle.id)}
          className="mt-3 text-xs text-muted-foreground underline underline-offset-4"
        >
          Set as default
        </button>
      )}
    </div>
  )
}
