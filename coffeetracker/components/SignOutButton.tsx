'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    if (loading) return
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      title="Sign out"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '8px 14px',
        borderRadius: 10,
        border: '1px solid var(--border-mid)',
        background: 'var(--white)',
        color: 'var(--text-body)',
        fontSize: 13.5,
        fontWeight: 600,
        cursor: loading ? 'default' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      <LogOut size={15} /> {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
