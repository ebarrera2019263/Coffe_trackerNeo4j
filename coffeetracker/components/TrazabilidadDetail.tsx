'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Coffee, Flame, Truck, Settings2, Leaf, User, AlertTriangle, Check, X } from 'lucide-react'
import CoffeeLoader from './CoffeeLoader'
import BatchQR from './BatchQR'
import type { TrazabilidadData } from '@/types'

function getProcesoCls(p: string) {
  const m: Record<string, string> = {
    lavado: 'tag-lavado',
    natural: 'tag-natural',
    honey: 'tag-honey',
    anaeróbico: 'tag-anaerobico',
    experimental: 'tag-natural',
  }
  return m[p.toLowerCase()] || 'tag-lavado'
}

interface Props { loteId: string }

export default function TrazabilidadDetail({ loteId }: Props) {
  const [data, setData] = useState<TrazabilidadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [view, setView] = useState<'flow' | 'timeline'>('flow')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/trazabilidad/${encodeURIComponent(loteId)}`)
        if (res.status === 404) throw new Error('Batch not found')
        if (!res.ok) throw new Error('Error loading traceability')
        setData(await res.json())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [loteId])

  if (loading) return <CoffeeLoader text="Loading traceability…" />
  if (error)   return (
    <div className="page">
      <div className="error-state" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} />{error}</div>
      <Link href="/trazabilidad" className="btn btn-outline" style={{ marginTop: 12, display: 'inline-block' }}>← Back to search</Link>
    </div>
  )
  if (!data)   return null

  const { cafe, lote, tostador, beneficio, finca, productor, transportes, certificaciones } = data

  const steps = [
    {
      key: 'cafeteria', icon: <Coffee size={22} color="var(--brown)" />, label: 'Your coffee shop', name: cafe.nombre,
      detail: `${cafe.ciudad} · ${cafe.tipo}`, extra: `Q${cafe.precio_promedio_taza}/cup`,
      data: { 'Coffee Shop': cafe.nombre, 'City': cafe.ciudad, 'Type': cafe.tipo, 'Methods': (cafe.metodos_disponibles || []).join(', '), 'Price per cup': `Q${cafe.precio_promedio_taza}` },
    },
    {
      key: 'tostador', icon: <Flame size={22} color="var(--brown)" />, label: 'Roaster', name: tostador.nombre,
      detail: `Profile ${tostador.perfil_preferido}`, extra: tostador.pais,
      data: { 'Roaster': tostador.nombre, 'Country': tostador.pais, 'Profile': tostador.perfil_preferido },
    },
    ...(transportes.length > 0 ? [{
      key: 'transporte', icon: <Truck size={22} color="var(--brown)" />, label: 'Transport', name: transportes[0].medio,
      detail: `${transportes[0].distancia_km} km`, extra: transportes[0].fecha_salida,
      data: { 'Mode': transportes[0].medio, 'Departure': transportes[0].fecha_salida, 'Arrival': transportes[0].fecha_llegada, 'Distance': `${transportes[0].distancia_km} km` },
    }] : []),
    {
      key: 'beneficio', icon: <Settings2 size={22} color="var(--brown)" />, label: 'Wet Mill', name: beneficio.nombre,
      detail: `${beneficio.tipo} · ${beneficio.municipio}`, extra: beneficio.tipo,
      data: { 'Name': beneficio.nombre, 'Type': beneficio.tipo, 'Municipality': beneficio.municipio },
    },
    {
      key: 'finca', icon: <Leaf size={22} color="var(--brown)" />, label: 'Farm', name: finca.nombre,
      detail: `${finca.region} · ${finca.altitud_msnm} masl`, extra: (finca.variedades_cultivadas || []).join(', '),
      data: { 'Farm': finca.nombre, 'Region': finca.region, 'Altitude': `${finca.altitud_msnm} masl`, 'Organic': finca.organica ? 'Yes' : 'No', 'Varieties': (finca.variedades_cultivadas || []).join(', ') },
    },
    {
      key: 'productor', icon: <User size={22} color="var(--brown)" />, label: 'Producer', name: productor.nombre,
      detail: productor.tipo, extra: productor.activo ? 'Active' : 'Inactive',
      data: { 'Producer': productor.nombre, 'Type': productor.tipo, 'Status': productor.activo ? 'Active' : 'Inactive' },
    },
  ]

  const activeStepData = steps.find((s) => s.key === activeStep)
  const notas = Array.isArray(lote.notas_cata) ? lote.notas_cata : []

  return (
    <div className="page fade-in">
      {/* Header */}
      <div className="journey-header">
        <Link href="/trazabilidad" className="journey-back">
          ← Back
        </Link>
        <div style={{ flex: 1 }}>
          <div className="journey-code">Batch code</div>
          <div className="journey-name">{finca.nombre}</div>
          <div className="journey-meta">{lote.codigo_lote} · {finca.region}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {certificaciones.map((c, i) => (
              <span key={i} style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: '3px 10px', fontSize: 11 }}>
                <Check size={11} style={{ flexShrink: 0 }} /> {c.nombre}
              </span>
            ))}
            <span className={`proceso-tag ${getProcesoCls(lote.proceso)}`} style={{ marginLeft: 4 }}>
              {lote.proceso}
            </span>
          </div>
        </div>
        <BatchQR codigo={lote.codigo_lote} />
        <div className="journey-sca-big">
          <div className="journey-sca-num">{lote.puntaje_sca}</div>
          <div className="journey-sca-label">SCA Score</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
            {notas.map((n, i) => (
              <span key={i} style={{ background: 'rgba(201,146,74,0.25)', color: '#e8c88a', borderRadius: 20, padding: '2px 8px', fontSize: 10 }}>
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab${view === 'flow' ? ' active' : ''}`} onClick={() => setView('flow')}>Chain</button>
        <button className={`tab${view === 'timeline' ? ' active' : ''}`} onClick={() => setView('timeline')}>Timeline</button>
      </div>

      {view === 'flow' ? (
        <>
          {/* Flow */}
          <div className="journey-flow" style={{ marginBottom: 20 }}>
            {steps.map((step) => (
              <div
                key={step.key}
                className={`jf-step${activeStep === step.key ? ' active' : ''}`}
                onClick={() => setActiveStep(activeStep === step.key ? null : step.key)}
              >
                <div className="jf-inner">
                  <div className="jf-icon">{step.icon}</div>
                  <div className="jf-label">{step.label}</div>
                  <div className="jf-name">{step.name}</div>
                  <div className="jf-detail">{step.detail}</div>
                  <div className="jf-extra">{step.extra}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {activeStepData && (
            <div className="detail-panel">
              <div className="dp-header">
                <div className="dp-icon">{activeStepData.icon}</div>
                <div>
                  <div className="dp-title">{activeStepData.name}</div>
                  <div className="dp-sub">{activeStepData.detail}</div>
                </div>
                <button className="btn btn-outline" style={{ marginLeft: 'auto', fontSize: 12, padding: '6px 12px' }} onClick={() => setActiveStep(null)}>
                  Close <X size={12} />
                </button>
              </div>
              <div className="dp-grid">
                {Object.entries(activeStepData.data).map(([k, v]) => (
                  <div key={k}>
                    <div className="dp-label">{k}</div>
                    <div className="dp-val">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certificaciones.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6 }}>Farm certifications:</div>
              <div>
                {certificaciones.map((c, i) => (
                  <span key={i} className="cert-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={11} /> {c.nombre}</span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Timeline view */
        <TimelineView data={data} steps={steps} />
      )}
    </div>
  )
}

function TimelineView({ data, steps }: { data: TrazabilidadData; steps: { key: string; icon: ReactNode; label: string; name: string; detail: string; data: Record<string, string | undefined> }[] }) {
  const { lote, finca } = data
  const notas = Array.isArray(lote.notas_cata) ? lote.notas_cata : []

  return (
    <div className="tl-wrap">
      <div>
        <div className="section-title" style={{ marginBottom: 6 }}>The journey of your coffee</div>
        <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 24, lineHeight: 1.6 }}>
          From its harvest in {finca.region} to your cup.
        </div>
        <div className="timeline">
          <div className="tl-line" />
          {steps.slice().reverse().map((step, i) => (
            <div key={step.key} className="tl-ev" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="tl-dot done" />
              <div className="tl-date">{step.icon} {step.label}</div>
              <div className="tl-title">{step.name}</div>
              <div className="tl-desc">{step.detail}</div>
              <div className="tl-mini">
                {Object.entries(step.data).filter(([, v]) => v !== undefined).map(([k, v]) => (
                  <div key={k}>
                    <div className="tl-prop-label">{k}</div>
                    <div className="tl-prop-val">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary card */}
      <div>
        <div className="summary-card">
          <div className="sum-title">{finca.nombre}</div>
          <div className="sum-quote">&quot;{notas.join(' · ')}&quot;</div>
          <div className="sum-sca">{lote.puntaje_sca}</div>
          <div className="sum-sca-label">SCA Points</div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />
          <div className="sum-grid">
            {[
              ['Region', finca.region],
              ['Altitude', `${finca.altitud_msnm} masl`],
              ['Process', lote.proceso],
              ['Harvest', lote.fecha_cosecha],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="sum-item-label">{l}</div>
                <div className="sum-item-val">{v}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 14 }} />
          <div className="sum-notes">
            {notas.map((n, i) => (
              <span key={i} className="sum-note">{n}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
