'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { X, MapPin, Coffee, Leaf, Calendar, Star, ArrowRight } from 'lucide-react'
import type { Cafeteria, Lote } from '@/types'

export type LoteConFinca = Lote & { finca_nombre?: string | null }

interface Props {
  cafeteria: Cafeteria
  lotes: LoteConFinca[]
  loading: boolean
  onClose: () => void
}

function ScaBadge({ score }: { score: number }) {
  const bg =
    score >= 90 ? 'var(--caramel)' :
    score >= 85 ? 'var(--brown-mid)' :
    'var(--text-light)'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg, color: '#fff',
      borderRadius: 20, padding: '2px 9px', fontSize: 11.5, fontWeight: 600,
    }}>
      <Star size={10} fill="currentColor" strokeWidth={0} />
      {score} pts
    </span>
  )
}

function LoteSkeleton() {
  return (
    <div style={{
      background: 'var(--cream-mid)', borderRadius: 12,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
      animation: 'pulse 1.4s ease-in-out infinite',
    }}>
      {[60, 40, 80, 50].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 14 : 10, width: `${w}%`,
          background: 'var(--cream-deep)', borderRadius: 6,
        }} />
      ))}
    </div>
  )
}

export default function CafeteriaModal({ cafeteria, lotes, loading, onClose }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const metodos = Array.isArray(cafeteria.metodos_disponibles) ? cafeteria.metodos_disponibles : []

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!mounted) return null

  const modal = (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(20, 10, 4, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'scale-fade 200ms var(--ease-out-expo) both',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          borderRadius: 20,
          width: '100%', maxWidth: 700,
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(42,22,8,0.28)',
          animation: 'modal-in 260ms var(--ease-out-expo) both',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22, fontWeight: 600,
                  color: 'var(--text-dark)', lineHeight: 1.2,
                }}>
                  {cafeteria.nombre}
                </h2>
                <span className="tipo-badge">{cafeteria.tipo}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-mid)' }}>
                  <MapPin size={13} style={{ flexShrink: 0 }} /> {cafeteria.ciudad}
                </span>
                {cafeteria.precio_promedio_taza ? (
                  <span className="precio-badge">Q{cafeteria.precio_promedio_taza}/taza</span>
                ) : null}
              </div>
              {metodos.length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
                  {metodos.map((m) => (
                    <span key={m} className="metodo-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Coffee size={10} style={{ flexShrink: 0 }} /> {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
                border: '1px solid var(--border)', background: 'var(--cream-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-mid)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cream-deep)'; e.currentTarget.style.color = 'var(--text-dark)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--cream-mid)'; e.currentTarget.style.color = 'var(--text-mid)' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text-mid)',
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14,
          }}>
            {loading ? 'Cargando lotes…' : `${lotes.length} ${lotes.length === 1 ? 'lote activo' : 'lotes activos'}`}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {[1, 2, 3, 4].map((i) => <LoteSkeleton key={i} />)}
            </div>
          ) : lotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-pale)', fontSize: 13.5 }}>
              No hay lotes registrados para esta cafetería.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {lotes.map((l) => (
                <div
                  key={l.codigo_lote}
                  style={{
                    background: 'var(--cream)',
                    border: '1px solid var(--border)',
                    borderRadius: 14, padding: 16,
                    display: 'flex', flexDirection: 'column', gap: 10,
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-mid)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 13.5, fontWeight: 700, color: 'var(--text-dark)' }}>
                      {l.codigo_lote}
                    </div>
                    {l.puntaje_sca ? <ScaBadge score={l.puntaje_sca} /> : null}
                  </div>

                  {/* Tags row */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {l.proceso && (
                      <span className="metodo-tag">{l.proceso}</span>
                    )}
                    {l.fecha_cosecha && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-mid)', background: 'var(--cream-mid)', borderRadius: 20, padding: '3px 9px' }}>
                        <Calendar size={10} style={{ flexShrink: 0 }} />
                        {l.fecha_cosecha}
                      </span>
                    )}
                  </div>

                  {/* Finca */}
                  {l.finca_nombre && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-mid)' }}>
                      <Leaf size={12} style={{ flexShrink: 0 }} />
                      <span>{l.finca_nombre}</span>
                    </div>
                  )}

                  {/* Notas de cata */}
                  {Array.isArray(l.notas_cata) && l.notas_cata.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {l.notas_cata.map((nota) => (
                        <span key={nota} style={{
                          fontSize: 10.5, color: 'var(--brown-mid)',
                          background: 'rgba(184, 113, 42, 0.08)',
                          border: '1px solid rgba(184,113,42,0.18)',
                          borderRadius: 20, padding: '2px 8px',
                        }}>
                          {nota}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={() => router.push(`/trazabilidad/${encodeURIComponent(l.codigo_lote)}`)}
                    style={{
                      marginTop: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 8, width: '100%',
                      background: 'var(--espresso)', color: '#fff',
                      border: 'none', borderRadius: 9, padding: '8px 14px',
                      cursor: 'pointer', fontSize: 12.5, fontWeight: 500,
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                  >
                    Ver trazabilidad
                    <ArrowRight size={13} style={{ flexShrink: 0 }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
