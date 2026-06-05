'use client'

import { useState, useEffect, useMemo } from 'react'
import type { ImpactoResult } from '@/types'
import { AlertTriangle, Leaf, Coffee } from 'lucide-react'
import LottiePlayer from './LottiePlayer'
import Combobox from './Combobox'

export default function ImpactoView() {
  const [fincaId, setFincaId] = useState('')
  const [resultados, setResultados] = useState<ImpactoResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buscado, setBuscado] = useState(false)
  const [fincas, setFincas] = useState<{ finca_id?: string; nombre?: string; region?: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/nodos?label=Finca')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFincas(data) })
      .catch(() => {})
  }, [])

  const suggestions = useMemo(() =>
    fincas
      .filter(f => f.finca_id)
      .map(f => ({
        value: f.finca_id!,
        label: f.nombre ? `${f.nombre} · ${f.region ?? f.finca_id}` : f.finca_id!,
      })),
  [fincas])

  async function runSearch(id: string) {
    const trimmed = id.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setBuscado(false)
    try {
      const res = await fetch(`/api/impacto?finca_id=${encodeURIComponent(trimmed)}`)
      if (!res.ok) throw new Error('Error al consultar impacto')
      const data = await res.json()
      setResultados(data)
      setBuscado(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    runSearch(fincaId)
  }

  return (
    <div className="page fade-in">
      {/* Intro */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 12, background: 'var(--cream-mid)', flexShrink: 0 }}>
            <AlertTriangle size={28} color="var(--caramel)" />
          </div>
          <div>
            <div className="section-title" style={{ marginBottom: 4 }}>Análisis de impacto por plaga</div>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7 }}>
              Si una finca sufre una plaga o problema fitosanitario, este análisis identifica
              qué cafeterías sirven café de <strong>fincas vecinas</strong> que comparten microclima o fuente de agua,
              y por lo tanto podrían verse afectadas.
            </p>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24, maxWidth: 520 }}>
        <Combobox
          value={fincaId}
          onChange={setFincaId}
          onSelect={runSearch}
          suggestions={suggestions}
          placeholder="Buscar finca (nombre o ID)"
          disabled={loading}
        />
        <button className="btn btn-fill" type="submit" disabled={loading}>
          {loading ? '…' : 'Analizar'}
        </button>
      </form>

      {error && <div className="error-state" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} style={{ flexShrink: 0 }} />{error}</div>}

      {/* Resultados */}
      {buscado && !loading && (
        resultados.length === 0 ? (
          <div className="empty-state">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <LottiePlayer src="https://assets9.lottiefiles.com/packages/lf20_jbrw3hcz.json" size={120} />
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--text-dark)', marginBottom: 8 }}>
              Sin impacto detectado
            </h3>
            <p>No se encontraron fincas vecinas con microclima compartido que tengan lotes activos en cafeterías.</p>
          </div>
        ) : (
          <>
            <div className="section-title">
              {resultados.length} {resultados.length === 1 ? 'finca vecina afectada' : 'fincas vecinas afectadas'}
            </div>
            {resultados.map((r, i) => (
              <div key={i} className="impacto-result">
                <div className="impacto-finca" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Leaf size={15} color="var(--text-mid)" /> {r.finca_vecina}</div>
                <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>
                  {r.lotes} {r.lotes === 1 ? 'lote activo' : 'lotes activos'} en cafeterías
                </div>
                <div className="impacto-cafes">
                  {r.cafeterias_afectadas.map((c, j) => (
                    <span key={j} className="metodo-tag" style={{ padding: '4px 12px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Coffee size={12} style={{ flexShrink: 0 }} /> {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </>
        )
      )}
    </div>
  )
}
