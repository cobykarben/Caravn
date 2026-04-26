import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { UserSearch } from '../user-search'

const mockUser = { id: 'u2', full_name: 'Ray Rider', username: 'rayrider', avatar_url: null }

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn((table: string) => {
      const chain: Record<string, unknown> = {}
      const methods = ['select', 'eq', 'neq', 'ilike', 'or', 'limit', 'single']
      methods.forEach(m => { chain[m] = vi.fn(() => chain) })
      if (table === 'profiles') {
        Object.assign(chain, {
          then: (cb: (v: { data: typeof mockUser[]; error: null }) => void) =>
            Promise.resolve(cb({ data: [mockUser], error: null })),
        })
      } else {
        Object.assign(chain, {
          then: (cb: (v: { data: null; error: null }) => void) =>
            Promise.resolve(cb({ data: null, error: null })),
        })
        chain['insert'] = vi.fn(() => ({
          then: (cb: (v: { error: null }) => void) =>
            Promise.resolve(cb({ error: null })),
        }))
      }
      return chain
    }),
  })),
}))

describe('UserSearch', () => {
  it('renders a search input', () => {
    render(<UserSearch currentUserId="u1" existingFriendIds={[]} pendingIds={[]} />)
    expect(screen.getByPlaceholderText(/search by username/i)).toBeInTheDocument()
  })

  it('shows no results before typing', () => {
    render(<UserSearch currentUserId="u1" existingFriendIds={[]} pendingIds={[]} />)
    expect(screen.queryByText('Ray Rider')).not.toBeInTheDocument()
  })

  it('displays results after typing 2+ characters', async () => {
    const user = userEvent.setup()
    render(<UserSearch currentUserId="u1" existingFriendIds={[]} pendingIds={[]} />)
    await user.type(screen.getByPlaceholderText(/search by username/i), 'ray')
    await waitFor(() => expect(screen.getByText('Ray Rider')).toBeInTheDocument())
  })

  it('shows Add button for users who are not yet friends', async () => {
    const user = userEvent.setup()
    render(<UserSearch currentUserId="u1" existingFriendIds={[]} pendingIds={[]} />)
    await user.type(screen.getByPlaceholderText(/search by username/i), 'ray')
    await waitFor(() => expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument())
  })

  it('shows Friends label instead of Add button for existing friends', async () => {
    const user = userEvent.setup()
    render(<UserSearch currentUserId="u1" existingFriendIds={['u2']} pendingIds={[]} />)
    await user.type(screen.getByPlaceholderText(/search by username/i), 'ray')
    await waitFor(() => expect(screen.getByText('Friends')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument()
  })

  it('shows Pending label for already-requested users', async () => {
    const user = userEvent.setup()
    render(<UserSearch currentUserId="u1" existingFriendIds={[]} pendingIds={['u2']} />)
    await user.type(screen.getByPlaceholderText(/search by username/i), 'ray')
    await waitFor(() => expect(screen.getByText('Pending')).toBeInTheDocument())
  })
})
