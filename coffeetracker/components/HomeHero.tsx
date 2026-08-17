'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coffee, Leaf, Package, Award, User, Settings2, Truck, Flame, ChevronRight } from 'lucide-react'

interface Stats {
  cafeterias: number
  fincas: number
  lotes: number
  avg_sca: number | null
}

const CHAIN_STEPS = [
  { icon: User,      label: 'Producer',    href: '/admin' },
  { icon: Leaf,      label: 'Farm',        href: '/finca' },
  { icon: Settings2, label: 'Wet Mill',    href: '/admin' },
  { icon: Truck,     label: 'Transport',   href: '/admin' },
  { icon: Flame,     label: 'Roaster',     href: '/admin' },
  { icon: Coffee,    label: 'Coffee Shop', href: '/' },
]

function AnimatedNumber({ target }: { target: number }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (target === 0) return
    const duration = 900
    const steps = 40
    const increment = target / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      setCurrent(Math.min(Math.round(increment * step), target))
      if (step >= steps) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target])

  return <>{current}</>
}

export default function HomeHero() {
  const [stats, setStats] = useState<Stats | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const statTiles = [
    { icon: Coffee,  label: 'Coffee Shops',  value: stats?.cafeterias ?? null },
    { icon: Leaf,    label: 'Farms',         value: stats?.fincas     ?? null },
    { icon: Package, label: 'Batches',       value: stats?.lotes      ?? null },
    { icon: Award,   label: 'Avg. SCA',      value: stats?.avg_sca    ?? null, decimal: true },
  ]

  return (
    <div style={{ padding: '24px 28px 0' }}>
      {/* ── Stats hero ── */}
      <div className="home-hero">
        <div className="home-hero-left">
          <div className="hero-badge">
            <Coffee size={11} /> Coffee traceability
          </div>
          <div className="home-hero-title">Know the origin<br />of every cup</div>
          <div className="home-hero-sub">
            Trace the full specialty coffee chain in Guatemala — from the farm to your cup.
          </div>
        </div>
        <div className="home-stat-grid">
          {statTiles.map(({ icon: Icon, label, value, decimal }, i) => (
            <div key={label} className="home-stat-tile" style={{ '--i': i } as React.CSSProperties}>
              <Icon size={18} color="var(--caramel-lt)" style={{ marginBottom: 6 }} />
              <div className="home-stat-num">
                {value == null
                  ? '—'
                  : decimal
                    ? value
                    : <AnimatedNumber target={value as number} />
                }
              </div>
              <div className="home-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Supply chain strip ── */}
      <div className="chain-strip">
        <div className="chain-strip-label">Traceability chain</div>
        <div className="chain-steps">
          {CHAIN_STEPS.map(({ icon: Icon, label, href }, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <button
                className="chain-step"
                style={{ '--i': i } as React.CSSProperties}
                onClick={() => router.push(href)}
                title={`View ${label}`}
              >
                <div className="chain-step-icon">
                  <Icon size={17} />
                </div>
                <span className="chain-step-label">{label}</span>
              </button>
              {i < CHAIN_STEPS.length - 1 && (
                <ChevronRight size={14} color="var(--text-pale)" style={{ flexShrink: 0, margin: '0 2px' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
