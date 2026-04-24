import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 text-center">
      <div className="text-5xl mb-6">✉️</div>
      <h1 className="text-2xl font-bold tracking-tight mb-3">Check your email</h1>
      <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
        We sent a verification link to your inbox. Click it to activate your account.
      </p>
      <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'mx-auto')}>
        Back to sign in
      </Link>
    </div>
  )
}
