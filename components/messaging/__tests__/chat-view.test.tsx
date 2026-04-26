import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ChatView } from '../chat-view'

const messages = [
  { id: 'm1', content: 'Hello everyone!', created_at: '2026-07-10T10:00:00Z',
    sender: { id: 'u2', full_name: 'Dana', avatar_url: null } },
  { id: 'm2', content: "Can't wait for the show", created_at: '2026-07-10T10:01:00Z',
    sender: { id: 'u3', full_name: 'Ray', avatar_url: null } },
]

const mockChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      then: (cb: (v: { data: typeof messages; error: null }) => void) =>
        Promise.resolve(cb({ data: messages, error: null })),
    })),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  })),
}))

describe('ChatView', () => {
  it('renders the chat container', () => {
    render(<ChatView chatId="chat-1" currentUserId="u1" initialMessages={messages} />)
    expect(screen.getByRole('log')).toBeInTheDocument()
  })

  it('renders initial messages', () => {
    render(<ChatView chatId="chat-1" currentUserId="u1" initialMessages={messages} />)
    expect(screen.getByText('Hello everyone!')).toBeInTheDocument()
    expect(screen.getByText("Can't wait for the show")).toBeInTheDocument()
  })

  it('renders sender names', () => {
    render(<ChatView chatId="chat-1" currentUserId="u1" initialMessages={messages} />)
    expect(screen.getByText('Dana')).toBeInTheDocument()
    expect(screen.getByText('Ray')).toBeInTheDocument()
  })

  it('renders the message input and send button', () => {
    render(<ChatView chatId="chat-1" currentUserId="u1" initialMessages={messages} />)
    expect(screen.getByPlaceholderText(/message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('send button is disabled when input is empty', () => {
    render(<ChatView chatId="chat-1" currentUserId="u1" initialMessages={messages} />)
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('send button is enabled after typing a message', async () => {
    const user = userEvent.setup()
    render(<ChatView chatId="chat-1" currentUserId="u1" initialMessages={messages} />)
    await user.type(screen.getByPlaceholderText(/message/i), 'Hello!')
    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()
  })
})
