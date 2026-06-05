'use client'

interface Props {
  text?: string
  size?: number
}

export default function CoffeeLoader({ text = 'Cargando…', size = 52 }: Props) {
  return (
    <div className="loading-state" style={{ flexDirection: 'column', gap: 12 }}>
      <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden>
        {/* Steam */}
        <path className="coffee-steam-1" d="M15 16 Q17 11 15 7" stroke="var(--caramel)" strokeWidth="2" strokeLinecap="round" />
        <path className="coffee-steam-2" d="M24 14 Q26 9 24 5" stroke="var(--caramel)" strokeWidth="2" strokeLinecap="round" />
        <path className="coffee-steam-3" d="M33 16 Q35 11 33 7" stroke="var(--caramel)" strokeWidth="2" strokeLinecap="round" />
        {/* Cup body */}
        <rect x="8" y="19" width="30" height="22" rx="5" fill="var(--cream-mid)" stroke="var(--brown)" strokeWidth="2" />
        {/* Handle */}
        <path d="M38 25 Q46 25 46 30 Q46 37 38 37" stroke="var(--brown)" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Liquid inside */}
        <rect x="10" y="29" width="26" height="10" rx="2" fill="var(--caramel-lt)" opacity="0.5" />
        {/* Saucer */}
        <ellipse cx="23" cy="42" rx="17" ry="3" fill="var(--cream-deep)" />
      </svg>
      <span style={{ fontSize: 13, color: 'var(--text-light)' }}>{text}</span>
    </div>
  )
}
