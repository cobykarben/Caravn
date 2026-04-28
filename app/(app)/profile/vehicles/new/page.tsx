import { VehicleForm } from '@/components/vehicles/vehicle-form'

export default async function NewVehiclePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { returnTo } = await searchParams
  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold mb-6">Add Vehicle</h1>
      <VehicleForm returnTo={returnTo} />
    </div>
  )
}
