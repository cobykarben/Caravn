import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProfileHeader } from '../profile-header'

describe('ProfileHeader', () => {
  const profile = {
    full_name: 'Dana Miller',
    username: 'danamiller',
    bio: 'Love live music and road trips',
    phone_verified: true,
    avatar_url: null,
  }

  it('renders full name and username', () => {
    render(<ProfileHeader profile={profile} />)
    expect(screen.getByText('Dana Miller')).toBeInTheDocument()
    expect(screen.getByText('@danamiller')).toBeInTheDocument()
  })

  it('renders bio when present', () => {
    render(<ProfileHeader profile={profile} />)
    expect(screen.getByText('Love live music and road trips')).toBeInTheDocument()
  })

  it('shows phone verified badge when phone_verified is true', () => {
    render(<ProfileHeader profile={profile} />)
    expect(screen.getByText('Phone verified')).toBeInTheDocument()
  })

  it('shows verify phone prompt when phone not verified', () => {
    render(<ProfileHeader profile={{ ...profile, phone_verified: false }} />)
    expect(screen.getByText('Verify phone')).toBeInTheDocument()
  })
})
