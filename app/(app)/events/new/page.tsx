import { CreateEventForm } from '@/components/events/create-event-form'

export default function NewEventPage() {
  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold mb-6">Add Event</h1>
      <CreateEventForm />
    </div>
  )
}
