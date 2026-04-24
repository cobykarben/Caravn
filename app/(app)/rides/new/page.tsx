import { Suspense } from 'react'
import { CreateRideWizard } from '@/components/rides/create-ride-wizard'

export default function NewRidePage() {
  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="text-2xl font-bold mb-6">Post a Ride</h1>
      <Suspense fallback={null}>
        <CreateRideWizard />
      </Suspense>
    </div>
  )
}
