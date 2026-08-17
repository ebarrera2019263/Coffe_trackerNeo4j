'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, LogIn } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/admin'

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError(res.status === 401 ? 'Incorrect password. Try again.' : 'Something went wrong. Try again.')
        return
      }
      router.push(from.startsWith('/') ? from : '/admin')
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-md)',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--cream-mid)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
          }}
        >
          <Lock size={22} color="var(--brown)" />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-dark)' }}>
            Admin access
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-mid)', marginTop: 4 }}>
            Enter the administrator password to manage the graph.
          </div>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 10,
            border: '1px solid var(--border-mid)',
            background: 'var(--cream)',
            fontSize: 14.5,
            color: 'var(--text-dark)',
            outline: 'none',
          }}
        />

        {error && (
          <div style={{ fontSize: 13, color: '#b3261e', textAlign: 'center' }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '11px 14px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--brown)',
            color: 'var(--white)',
            fontSize: 14.5,
            fontWeight: 600,
            cursor: loading || !password ? 'default' : 'pointer',
            opacity: loading || !password ? 0.6 : 1,
          }}
        >
          <LogIn size={16} /> {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
