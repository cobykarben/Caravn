import type Anthropic from '@anthropic-ai/sdk'

export const AI_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_events',
    description:
      'Search for events by name, artist, team, venue, or city. ' +
      'Always call this before confirming an event — never assume which event the user means.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query: event name, artist, team, venue name, or city',
        },
        date: {
          type: 'string',
          description: 'Optional date filter in YYYY-MM-DD format',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_user_profile',
    description:
      'Get the current user\'s profile including their default vehicle (make, model, capacity) ' +
      'and any saved departure address. Call before prefilling ride details. No arguments needed.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'find_rides',
    description:
      'Find available rides for an event. Returns rides sorted by proximity if lat/lng are provided, ' +
      'otherwise sorted by departure time. Shows driver name, pickup address, time, cost, and open seats.',
    input_schema: {
      type: 'object' as const,
      properties: {
        event_id: {
          type: 'string',
          description: 'The event UUID to find rides for',
        },
        lat: {
          type: 'number',
          description: 'User\'s latitude for proximity sorting (optional)',
        },
        lng: {
          type: 'number',
          description: 'User\'s longitude for proximity sorting (optional)',
        },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'create_ride',
    description:
      'Create and publish a new ride. Only call this after the user has explicitly confirmed ' +
      'all the details (event, vehicle, departure address, departure time). ' +
      'Returns the new ride ID and a link.',
    input_schema: {
      type: 'object' as const,
      properties: {
        event_id: { type: 'string', description: 'The event UUID' },
        vehicle_id: { type: 'string', description: 'The vehicle UUID from get_user_profile' },
        departure_address: { type: 'string', description: 'Full pickup address' },
        departure_time: {
          type: 'string',
          description: 'Departure time in ISO 8601 format (e.g. 2026-07-15T17:00:00)',
        },
        return_time: {
          type: 'string',
          description: 'Optional return time in ISO 8601 format',
        },
        cost_per_person: {
          type: 'number',
          description: 'Total trip cost in dollars (0 for free). Split equally among riders.',
        },
        notes: { type: 'string', description: 'Optional notes for riders' },
        pickup_radius_miles: {
          type: 'number',
          description: 'Optional flexible pickup radius in miles',
        },
      },
      required: [
        'event_id',
        'vehicle_id',
        'departure_address',
        'departure_time',
        'cost_per_person',
      ],
    },
  },
  {
    name: 'apply_to_ride',
    description:
      'Apply for a seat on a ride. Only call after the user taps Apply on a specific ride card. ' +
      'Returns confirmation of the pending application.',
    input_schema: {
      type: 'object' as const,
      properties: {
        ride_id: { type: 'string', description: 'The ride UUID to apply to' },
        seat_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of seat IDs being requested (e.g. ["r0s1", "r1s0"])',
        },
        message: {
          type: 'string',
          description: 'Optional message to the driver',
        },
      },
      required: ['ride_id', 'seat_ids'],
    },
  },
]
