import { VehicleForm } from '@/components/vehicles/vehicle-form'

export default function NewVehiclePage() {
  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold mb-6">Add Vehicle</h1>
      <VehicleForm />
    </div>
  )
}
