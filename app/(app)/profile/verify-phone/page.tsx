'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function VerifyPhonePage() {
  const [step, setStep] = useState<'enter-phone' | 'enter-otp'>('enter-phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const normalised = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ phone: normalised })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep('enter-otp')
    setLoading(false)
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const normalised = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
    const supabase = createClient()

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalised,
      token: otp,
      type: 'phone_change',
    })

    if (verifyError) {
      setError(verifyError.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ phone: normalised, phone_verified: true })
        .eq('id', user.id)
    }

    router.push('/profile')
    router.refresh()
  }

  if (step === 'enter-otp') {
    return (
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold mb-2">Enter code</h1>
        <p className="text-muted-foreground text-sm mb-6">
          We sent a 6-digit code to {phone}
        </p>

        <form onSubmit={verifyOtp} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
            {loading ? 'Verifying…' : 'Verify'}
          </Button>

          <button
            type="button"
            onClick={() => setStep('enter-phone')}
            className="w-full text-sm text-muted-foreground underline underline-offset-4"
          >
            Use a different number
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold mb-2">Verify your phone</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Required to apply for or post rides
      </p>

      <form onSubmit={sendOtp} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            required
            autoComplete="tel"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending code…' : 'Send code'}
        </Button>
      </form>
    </div>
  )
}
