import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatListItem } from '../chat-list-item'

const chat = {
  id: 'chat-1',
  ride: {
    id: 'ride-1',
    departure_time: '2026-07-15T17:00:00Z',
    event: { name: 'Taylor Swift — Eras Tour' },
  },
  lastMessage: {
    content: 'See everyone at the north gate!',
    sender_name: 'Dana',
    created_at: '2026-07-10T12:00:00Z',
  },
}

describe('ChatListItem', () => {
  it('renders the event name', () => {
    render(<ChatListItem chat={chat} />)
    expect(screen.getByText('Taylor Swift — Eras Tour')).toBeInTheDocument()
  })

  it('renders a preview of the last message', () => {
    render(<ChatListItem chat={chat} />)
    expect(screen.getByText(/See everyone at the north gate!/)).toBeInTheDocument()
  })

  it('renders sender name prefix in last message', () => {
    render(<ChatListItem chat={chat} />)
    expect(screen.getByText(/Dana:/)).toBeInTheDocument()
  })

  it('renders "No messages yet" when lastMessage is null', () => {
    render(<ChatListItem chat={{ ...chat, lastMessage: null }} />)
    expect(screen.getByText(/No messages yet/)).toBeInTheDocument()
  })

  it('links to the chat detail page', () => {
    render(<ChatListItem chat={chat} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/inbox/chat-1')
  })
})
