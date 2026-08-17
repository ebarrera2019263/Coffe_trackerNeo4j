'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Coffee } from 'lucide-react'

const navItems = [
  {
    href: '/',
    label: 'Coffee Shops',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1L2 6v9h4v-5h4v5h4V6z" />
      </svg>
    ),
  },
  {
    href: '/trazabilidad',
    label: 'Traceability',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="3" cy="8" r="2" />
        <circle cx="13" cy="8" r="2" />
        <circle cx="8" cy="3" r="2" />
        <line x1="5" y1="8" x2="11" y2="8" />
        <line x1="8" y1="5" x2="8" y2="14" />
      </svg>
    ),
  },
  {
    href: '/finca',
    label: 'Farm view',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M8 2C5 2 2 5 2 8s3 6 6 6 6-3 6-6-3-6-6-6z" />
        <path d="M8 5v3l2 2" />
      </svg>
    ),
  },
  {
    href: '/graph',
    label: 'Graph Explorer',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="4" cy="4" r="2" />
        <circle cx="12" cy="5" r="2" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="13" cy="12" r="1.5" />
        <line x1="5.5" y1="5.2" x2="10.5" y2="5" />
        <line x1="4.8" y1="5.8" x2="5.6" y2="10.4" />
        <line x1="7.8" y1="11.4" x2="11.5" y2="12" />
        <line x1="12.4" y1="6.8" x2="13" y2="10.5" />
      </svg>
    ),
  },
  {
    href: '/impacto',
    label: 'Impact',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M8 2v4M8 10v4M2 8h4M10 8h4" />
        <circle cx="8" cy="8" r="2" />
      </svg>
    ),
  },
  {
    href: '/admin',
    label: 'Administration',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="2" width="5" height="5" rx="1" />
        <rect x="9" y="2" width="5" height="5" rx="1" />
        <rect x="2" y="9" width="5" height="5" rx="1" />
        <rect x="9" y="9" width="5" height="5" rx="1" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-row">
          <div className="logo-cup"><Coffee size={18} color="#fff" /></div>
          <div>
            <div className="logo-name">CoffeTracker</div>
            <div className="logo-tag">From farm to your cup</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Explore</div>
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${isActive(item.href) ? ' active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}

        <div className="nav-label" style={{ marginTop: 8 }}>Analysis</div>
        {navItems.slice(4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${isActive(item.href) ? ' active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

    </aside>
  )
}
