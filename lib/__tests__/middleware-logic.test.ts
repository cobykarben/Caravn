import { describe, it, expect } from 'vitest'

const PROTECTED_PREFIXES = ['/events', '/rides', '/inbox', '/profile']
const PUBLIC_PATHS = ['/login', '/signup', '/verify-email']

function isProtected(path: string) {
  return PROTECTED_PREFIXES.some(p => path.startsWith(p))
}

function isPublicAuth(path: string) {
  return PUBLIC_PATHS.some(p => path.startsWith(p))
}

describe('middleware redirect logic', () => {
  it('protects /events', () => expect(isProtected('/events')).toBe(true))
  it('protects /rides/abc-123', () => expect(isProtected('/rides/abc-123')).toBe(true))
  it('protects /inbox', () => expect(isProtected('/inbox')).toBe(true))
  it('does not protect /login', () => expect(isProtected('/login')).toBe(false))
  it('recognises /signup as public auth page', () => expect(isPublicAuth('/signup')).toBe(true))
  it('does not treat /events as public auth page', () => expect(isPublicAuth('/events')).toBe(false))
})
