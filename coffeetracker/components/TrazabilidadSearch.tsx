'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, AlertTriangle } from 'lucide-react'
import Combobox from './Combobox'

export default function TrazabilidadSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lotes, setLotes] = useState<{ codigo_lote?: string; lote_id?: string; proceso?: string }[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/nodos?label=Lote')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setLotes(data) })
      .catch(() => {})
  }, [])

  const suggestions = useMemo(() =>
    lotes
      .filter(l => l.codigo_lote)
      .map(l => ({
        value: l.codigo_lote!,
        label: l.proceso ? `${l.codigo_lote} · ${l.proceso}` : l.codigo_lote!,
      })),
  [lotes])

  async function navigate(loteId: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/trazabilidad/${encodeURIComponent(loteId)}`)
      if (res.status === 404) {
        setError('Lote no encontrado. Verifica el código e intenta de nuevo.')
        return
      }
      if (!res.ok) throw new Error('Error al buscar el lote')
      router.push(`/trazabilidad/${encodeURIComponent(loteId)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const loteId = query.trim()
    if (loteId) navigate(loteId)
  }

  return (
    <div className="page fade-in">
      <div style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
        <Search size={52} color="var(--text-pale)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 500, color: 'var(--text-dark)', marginBottom: 8 }}>
          Traza tu café
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: 24 }}>
          Ingresa el código de lote para ver la cadena completa:<br />
          cafetería → tostador → transporte → beneficio → finca → productor
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <Combobox
            value={query}
            onChange={setQuery}
            onSelect={navigate}
            suggestions={suggestions}
            placeholder="Código de lote (ej. GT-FRA-6570)"
            disabled={loading}
          />
          <button className="btn btn-fill" type="submit" disabled={loading}>
            {loading ? '…' : 'Buscar'}
          </button>
        </form>

        {error && (
          <div className="error-state" style={{ display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left', marginBottom: 16 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}
      </div>
    </div>
  )
}
