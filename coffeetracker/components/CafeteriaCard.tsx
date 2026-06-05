'use client'

import { MapPin } from 'lucide-react'
import type { Cafeteria } from '@/types'

interface Props {
  cafeteria: Cafeteria
  onClick?: () => void
  staggerIndex?: number
}

export default function CafeteriaCard({ cafeteria, onClick, staggerIndex = 0 }: Props) {
  const metodos = Array.isArray(cafeteria.metodos_disponibles)
    ? cafeteria.metodos_disponibles
    : []

  return (
    <div className="cafe-card" onClick={onClick} role="button" tabIndex={0}
      style={{ '--stagger': Math.min(staggerIndex, 10) } as React.CSSProperties}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}>
      <div className="cafe-card-top">
        <div>
          <div className="cafe-card-name">{cafeteria.nombre}</div>
          <div className="cafe-card-city" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} style={{ flexShrink: 0 }} /> {cafeteria.ciudad}
          </div>
        </div>
        <span className="tipo-badge">{cafeteria.tipo}</span>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {metodos.map((m) => (
          <span key={m} className="metodo-tag">{m}</span>
        ))}
      </div>

      <div className="cafe-card-footer">
        <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>Métodos disponibles</span>
        {cafeteria.precio_promedio_taza ? (
          <span className="precio-badge">Q{cafeteria.precio_promedio_taza}/taza</span>
        ) : null}
      </div>
    </div>
  )
}
