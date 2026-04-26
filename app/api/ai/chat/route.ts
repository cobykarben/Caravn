import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { AI_TOOLS } from '@/lib/ai/tools'
import { executeToolCall } from '@/lib/ai/tool-handlers'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Cached system prompt — stable content up front, no dynamic values.
// cache_control marks this block for prompt caching (ephemeral, 5-min TTL).
const SYSTEM_PROMPT = `You are Caravn's AI assistant — a concise, friendly helper for event ride-sharing.
You help users create rides to events and find rides from other drivers.

Rules:
- ALWAYS call search_events before confirming an event. Never assume.
- ALWAYS call get_user_profile (no arguments needed) before prefilling ride creation details.
- ALWAYS show a ride_preview card and ask for confirmation before calling create_ride.
- Keep responses short and mobile-friendly (this is a phone UI).
- Never make up event names, venues, or times. Use only what the tools return.
- When a ride is created successfully, include the URL from the tool result so the user can tap it.
- For create_ride: use the vehicle_id from get_user_profile default_vehicle.id.

Rich cards — embed these XML tags verbatim in your response text where shown:

After confirming an event, output:
<action type="event_result">{"id":"ID","name":"NAME","venue_name":"VENUE","city":"CITY","starts_at":"ISO"}</action>

After find_rides, output one per ride (max 3):
<action type="ride_suggestion">{"id":"ID","driver_name":"NAME","departure_address":"ADDR","departure_time":"ISO","cost_per_person":0,"is_paid":false,"available_seats":2,"available_seat_ids":["SEAT_ID"]}</action>

Before asking the user to confirm ride creation, output:
<action type="ride_preview">{"event_name":"NAME","vehicle":"YEAR MAKE MODEL","departure_address":"ADDR","departure_time":"ISO","cost_per_person":0,"available_seats":N}</action>

When the user's message says "apply to ride ID seat SEAT_ID", call apply_to_ride with ride_id=ID and seat_ids=[SEAT_ID].`

type MessageParam = Anthropic.MessageParam

export async function POST(req: NextRequest) {
  const { messages, userId } = (await req.json()) as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    userId: string
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Convert incoming messages to Anthropic format
        let apiMessages: MessageParam[] = messages.map(m => ({
          role: m.role,
          content: m.content,
        }))

        // Agentic loop: run until no more tool calls
        for (let iteration = 0; iteration < 10; iteration++) {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: [
              {
                type: 'text',
                text: SYSTEM_PROMPT,
                // Prompt caching: the system prompt is stable across all requests
                cache_control: { type: 'ephemeral' },
              },
            ],
            tools: AI_TOOLS,
            messages: apiMessages,
          })

          // Stream any text content from this iteration
          for (const block of response.content) {
            if (block.type === 'text' && block.text) {
              send({ type: 'text', text: block.text })
            }
          }

          // If no tool use, we're done
          if (response.stop_reason !== 'tool_use') {
            break
          }

          // Collect tool use blocks
          const toolUseBlocks = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
          )

          // Add assistant turn (with tool calls) to history
          apiMessages = [
            ...apiMessages,
            { role: 'assistant', content: response.content },
          ]

          // Execute all tool calls
          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const toolUse of toolUseBlocks) {
            send({ type: 'tool_call', name: toolUse.name })

            const result = await executeToolCall(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
              userId,
            )

            send({ type: 'tool_result', name: toolUse.name, result })

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(result),
            })
          }

          // Add tool results as a user turn and continue the loop
          apiMessages = [
            ...apiMessages,
            { role: 'user', content: toolResults },
          ]
        }

        send({ type: 'done' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
