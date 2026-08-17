'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Cafeteria, Finca, Lote } from '@/types'
import { AlertTriangle, Leaf, Coffee } from 'lucide-react'
import CoffeeLoader from './CoffeeLoader'

interface FincaRow {
  f: Finca
  l: Lote
  cafeterias: Cafeteria[]
}

interface Props { fincaId: string }

export default function FincaDetail({ fincaId }: Props) {
  const [rows, setRows] = useState<FincaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/finca/${encodeURIComponent(fincaId)}`)
        if (res.status === 404) throw new Error('Farm not found')
        if (!res.ok) throw new Error('Error loading farm')
        setRows(await res.json())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fincaId])

  if (loading) return <CoffeeLoader text="Loading farm…" />
  if (error)   return (
    <div className="page">
      <div className="error-state" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} />{error}</div>
      <Link href="/finca" className="btn btn-outline" style={{ marginTop: 12, display: 'inline-block' }}>← Back</Link>
    </div>
  )
  if (rows.length === 0) return (
    <div className="page empty-state">
      <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}><Leaf size={48} color="var(--text-pale)" /></div>
      <p>No batches or coffee shops found for this farm.</p>
      <Link href="/finca" className="btn btn-outline" style={{ marginTop: 16, display: 'inline-block' }}>← Back</Link>
    </div>
  )

  const finca = rows[0].f

  return (
    <div className="page fade-in">
      {/* Header card */}
      <div className="hero" style={{ marginBottom: 24 }}>
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Leaf size={12} /> Farm</div>
          <div className="hero-title">{finca.nombre}</div>
          <div className="hero-sub">
            {finca.region} · {finca.altitud_msnm} msnm
            {finca.organica ? ' · Organic' : ''}
          </div>
          <div className="hero-notes">
            {(finca.variedades_cultivadas || []).map((v, i) => (
              <span key={i} className="note-pill">{v}</span>
            ))}
          </div>
        </div>
        <div className="hero-right" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-sca">{rows.length}</div>
          <div className="hero-sca-label">Active batches</div>
        </div>
      </div>

      <div className="section-title">Batches produced · coffee shops where they are served</div>

      {rows.map((row) => (
        <div key={row.l.lote_id} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div className="lot-card-code">{row.l.codigo_lote}</div>
              <div className="lot-card-name">{finca.nombre}</div>
              <div className="lot-card-region">Harvest: {row.l.fecha_cosecha}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="sca-num">{row.l.puntaje_sca}</div>
              <div className="sca-pts">SCA</div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 8 }}>
            Available at {row.cafeterias.length} {row.cafeterias.length === 1 ? 'coffee shop' : 'coffee shops'}:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {row.cafeterias.map((c) => (
              <div key={c.cafeteria_id} className="metodo-tag" style={{ padding: '5px 12px', fontSize: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Coffee size={13} /> {c.nombre} · {c.ciudad}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <Link
              href={`/trazabilidad/${row.l.lote_id}`}
              className="btn btn-outline"
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              View full traceability →
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
