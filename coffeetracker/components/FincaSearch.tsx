'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf } from 'lucide-react'
import Combobox from './Combobox'

export default function FincaSearch() {
  const [query, setQuery] = useState('')
  const [fincas, setFincas] = useState<{ finca_id: string; nombre?: string }[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/nodos?label=Finca')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setFincas(data)
      })
      .catch(() => {})
  }, [])

  const suggestions = useMemo(() =>
    fincas.map(f => ({
      value: f.finca_id,
      label: f.nombre ? `${f.nombre} · ${f.finca_id}` : f.finca_id,
    })),
  [fincas])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const id = query.trim()
    if (id) router.push(`/finca/${encodeURIComponent(id)}`)
  }

  function handleSelect(val: string) {
    router.push(`/finca/${encodeURIComponent(val)}`)
  }

  return (
    <div className="page fade-in">
      <div style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
        <Leaf size={52} color="var(--text-pale)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 500, color: 'var(--text-dark)', marginBottom: 8 }}>
          Vista inversa de finca
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: 24 }}>
          Dado el ID de una finca, descubre en qué cafeterías<br />
          se sirve actualmente el café que produjo.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <Combobox
            value={query}
            onChange={setQuery}
            onSelect={handleSelect}
            suggestions={suggestions}
            placeholder="ID de finca (ej. FINCA-001)"
          />
          <button className="btn btn-fill" type="submit">Buscar</button>
        </form>
      </div>
    </div>
  )
}
