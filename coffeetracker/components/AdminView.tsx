'use client'

import { useEffect, useState, useCallback, useMemo, useRef, Fragment } from 'react'
import Combobox from './Combobox'
import { AlertTriangle, X, Plus, Check } from 'lucide-react'

const LABELS = ['Cafeteria', 'Finca', 'Lote', 'Productor', 'Tostador', 'Beneficio', 'Transporte', 'Certificacion'] as const
type Label = typeof LABELS[number]

const REL_TYPES = ['AUDITA','CERTIFICA','COMPETENCIA_DE','COMPRO','CULTIVA','MEZCLADO_CON','PROCESO','PRODUJO','SIRVE','TOSTO','TRANSPORTO','VECINA_DE']

type NodeRecord = Record<string, unknown>
type KVPair = { key: string; val: string; remove?: boolean }
type RelRecord = { eid: string; props: NodeRecord; from_label: string; from_node: NodeRecord; to_label: string; to_node: NodeRecord }

function getIdField(label: string): string {
  const m: Record<string, string> = {
    Cafeteria:'cafeteria_id', Finca:'finca_id', Lote:'lote_id', Productor:'productor_id',
    Tostador:'tostador_id', Beneficio:'beneficio_id', Transporte:'transporte_id', Certificacion:'cert_id',
  }
  return m[label] || 'id'
}

function parseValue(v: string): unknown {
  if (v === '') return null
  if (v === 'true') return true
  if (v === 'false') return false
  const n = Number(v)
  if (!isNaN(n) && v.trim() !== '') return n
  return v
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (Array.isArray(val)) return (val as unknown[]).join(', ')
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  return String(val)
}

function nodeToKV(node: NodeRecord): KVPair[] {
  return Object.entries(node).map(([key, val]) => ({
    key,
    val: Array.isArray(val) ? (val as unknown[]).join(', ') : String(val ?? ''),
  }))
}

function getNodeId(node: NodeRecord, label: string): string {
  return String(node[getIdField(label)] ?? '')
}

// Llave estable para selección/edición — usa el campo de ID si existe, si no el elementId de Neo4j
function getSelectKey(node: NodeRecord, label: string): string {
  return getNodeId(node, label) || String(node._eid ?? '')
}

function getNodeName(node: NodeRecord): string {
  return String(node.nombre ?? node.name ?? Object.values(node)[0] ?? '')
}

const LABEL_DISPLAY_COLS: Record<string, string[]> = {
  Cafeteria:    ['cafeteria_id',   'nombre',    'ciudad',        'tipo',           'precio_promedio_taza'],
  Finca:        ['finca_id',       'nombre',    'region',        'altitud_msnm',   'organica'],
  Lote:         ['lote_id',        'codigo_lote','proceso',      'puntaje_sca',    'peso_kg'],
  Productor:    ['productor_id',   'nombre',    'tipo',          'activo',         'num_miembros'],
  Tostador:     ['tostador_id',    'nombre',    'pais',          'perfil_preferido','capacidad_kg_mes'],
  Beneficio:    ['beneficio_id',   'nombre',    'tipo',          'municipio',      'capacidad_qq_dia'],
  Transporte:   ['transporte_id',  'medio',     'fecha_salida',  'fecha_llegada',  'distancia_km'],
  Certificacion:['cert_id',        'nombre',    'entidad_emisora','año_creacion',  'costo_usd'],
}

function getDisplayColumns(label: string, nodes: NodeRecord[]): string[] {
  if (!nodes.length) return []
  const available = new Set(Object.keys(nodes[0]).filter(k => k !== '_eid'))
  const priority = LABEL_DISPLAY_COLS[label] ?? []
  const cols = priority.filter(c => available.has(c))
  // fill remaining slots with any leftover keys not already included
  for (const k of available) {
    if (cols.length >= 5) break
    if (!cols.includes(k)) cols.push(k)
  }
  return cols.slice(0, 5)
}

function emptyKV(n = 5): KVPair[] {
  return Array(n).fill(null).map(() => ({ key: '', val: '' }))
}

const LABEL_SCHEMA: Record<string, { key: string; placeholder: string }[]> = {
  Cafeteria: [
    { key: 'cafeteria_id',        placeholder: 'C999' },
    { key: 'nombre',              placeholder: 'Example Café' },
    { key: 'ciudad',              placeholder: 'Antigua' },
    { key: 'tipo',                placeholder: 'Especialidad' },
    { key: 'precio_promedio_taza',placeholder: '45' },
    { key: 'abierta',             placeholder: 'true' },
    { key: 'metodos_disponibles', placeholder: 'V60, Chemex' },
  ],
  Finca: [
    { key: 'finca_id',             placeholder: 'F999' },
    { key: 'nombre',               placeholder: 'Example Farm' },
    { key: 'region',               placeholder: 'Huehuetenango' },
    { key: 'altitud_msnm',         placeholder: '1800' },
    { key: 'organica',             placeholder: 'true' },
    { key: 'variedades_cultivadas',placeholder: 'Bourbon, Caturra' },
  ],
  Lote: [
    { key: 'lote_id',    placeholder: 'L99999' },
    { key: 'codigo_lote',placeholder: 'GT-HUE-9999' },
    { key: 'proceso',    placeholder: 'Natural' },
    { key: 'puntaje_sca',placeholder: '86' },
    { key: 'peso_kg',    placeholder: '300' },
    { key: 'notas_cata', placeholder: 'chocolate, caramelo' },
  ],
  Productor: [
    { key: 'productor_id', placeholder: 'P999' },
    { key: 'nombre',       placeholder: 'Juan Pérez' },
    { key: 'tipo',         placeholder: 'Independiente' },
  ],
  Tostador: [
    { key: 'tostador_id',     placeholder: 'T999' },
    { key: 'nombre',          placeholder: 'Example Roaster' },
    { key: 'pais',            placeholder: 'Guatemala' },
    { key: 'perfil_preferido',placeholder: 'Medio' },
  ],
  Beneficio: [
    { key: 'beneficio_id',    placeholder: 'B999' },
    { key: 'nombre',          placeholder: 'Example Wet Mill' },
    { key: 'tipo',            placeholder: 'Húmedo' },
    { key: 'municipio',       placeholder: 'San Marcos' },
    { key: 'capacidad_qq_dia',placeholder: '100' },
    { key: 'usa_agua_reciclada', placeholder: 'true' },
  ],
  Transporte: [
    { key: 'transporte_id', placeholder: 'TR999' },
    { key: 'medio',         placeholder: 'Camion' },
    { key: 'fecha_salida',  placeholder: '2025-01-10' },
    { key: 'fecha_llegada', placeholder: '2025-01-12' },
    { key: 'distancia_km',  placeholder: '320' },
  ],
  Certificacion: [
    { key: 'cert_id',        placeholder: 'CRT-999' },
    { key: 'nombre',         placeholder: 'Rainforest Alliance' },
    { key: 'entidad_emisora',placeholder: 'SAN' },
  ],
}

function schemaToKV(labels: Set<Label>): KVPair[] {
  const seen = new Set<string>()
  const result: KVPair[] = []
  for (const l of labels) {
    for (const field of (LABEL_SCHEMA[l] ?? [])) {
      if (!seen.has(field.key)) {
        seen.add(field.key)
        result.push({ key: field.key, val: '' })
      }
    }
  }
  return result
}

function getSchemaPlaceholder(labels: Set<Label>, key: string): string {
  for (const l of labels) {
    const field = (LABEL_SCHEMA[l] ?? []).find(f => f.key === key)
    if (field) return field.placeholder
  }
  return 'value'
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminView() {
  const [mainTab, setMainTab] = useState<'nodos' | 'relaciones' | 'csv'>('nodos')

  return (
    <div className="page fade-in">
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab${mainTab === 'nodos' ? ' active' : ''}`} onClick={() => setMainTab('nodos')}>Nodes</button>
        <button className={`tab${mainTab === 'relaciones' ? ' active' : ''}`} onClick={() => setMainTab('relaciones')}>Relationships</button>
        <button className={`tab${mainTab === 'csv' ? ' active' : ''}`} onClick={() => setMainTab('csv')}>Import CSV</button>
      </div>
      {mainTab === 'nodos' ? <NodosPanel /> : mainTab === 'relaciones' ? <RelacionesPanel /> : <CsvPanel />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NODOS
// ─────────────────────────────────────────────────────────────────────────────

function NodosPanel() {
  const [activeLabel, setActiveLabel] = useState<Label>('Cafeteria')
  const [nodos, setNodos]     = useState<NodeRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Create form
  const [showCreate, setShowCreate]     = useState(false)
  const [createLabels, setCreateLabels] = useState<Set<Label>>(new Set(['Cafeteria']))
  const [createProps, setCreateProps]   = useState<KVPair[]>(emptyKV(5))
  const [creating, setCreating]         = useState(false)

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editProps, setEditProps] = useState<KVPair[]>([])
  const [saving, setSaving]       = useState(false)

  // Bulk
  const [bulkKey, setBulkKey]           = useState('')
  const [bulkVal, setBulkVal]           = useState('')
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Búsqueda libre por cualquier campo
  const [search, setSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const idf = getIdField(activeLabel)

  const load = useCallback(async (searchTerm?: string) => {
    setLoading(true); setError(null); setSelected(new Set()); setEditingId(null)
    try {
      const params = new URLSearchParams({ label: activeLabel })
      if (searchTerm) params.set('search', searchTerm)
      const res = await fetch(`/api/admin/nodos?${params}`)
      if (!res.ok) throw new Error('Failed to load')
      setNodos(await res.json())
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [activeLabel])

  // Reload cuando cambia el label (cancela debounce pendiente y limpia búsqueda)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearch('')
    load()
  }, [load])

  // Re-fetch en el servidor cuando el usuario escribe (debounce 400ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      load(search.trim() || undefined)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])
  useEffect(() => {
    const labels = new Set([activeLabel]) as Set<Label>
    setCreateLabels(labels)
    setCreateProps(schemaToKV(labels))
    setShowCreate(false)
  }, [activeLabel])

  async function handleCreate() {
    const labels = Array.from(createLabels)
    const props: Record<string, unknown> = {}
    // Excluir valores vacíos/null en CREATE (null es para eliminar props en PUT, no para crear)
    createProps.forEach(({ key, val }) => {
      if (key.trim()) {
        const parsed = parseValue(val)
        if (parsed !== null && parsed !== undefined && val.trim() !== '') {
          props[key.trim()] = parsed
        }
      }
    })
    if (!Object.keys(props).length) { setError('Fill in at least the ID field to create the node'); return }
    // El campo de ID es obligatorio: sin él, el nodo no se puede borrar/editar después
    const requiredIds = labels.map(l => getIdField(l))
    const missingId = requiredIds.find(idKey => !(idKey in props) || props[idKey] === '' || props[idKey] === null || props[idKey] === undefined)
    if (missingId) { setError(`Missing field "${missingId}" — it is required to identify the node`); return }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/nodos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels, properties: props }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create')
      setShowCreate(false)
      setCreateProps(schemaToKV(createLabels))
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to create') }
    finally { setCreating(false) }
  }

  function startEdit(node: NodeRecord) {
    const key = getSelectKey(node, activeLabel)
    if (editingId === key) { setEditingId(null); return }
    setEditingId(key); setEditProps(nodeToKV(node).filter(p => p.key !== '_eid'))
  }

  async function handleSave(idVal: string) {
    const props: Record<string, unknown> = {}
    editProps.forEach(({ key, val, remove }) => { if (key.trim()) props[key.trim()] = remove ? null : parseValue(val) })
    setSaving(true)
    try {
      const res = await fetch('/api/admin/nodos', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: activeLabel, id_value: idVal, properties: props }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setEditingId(null); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  async function handleDelete(node: NodeRecord) {
    if (!confirm('Delete this node?')) return
    try {
      const idValue = getNodeId(node, activeLabel)
      const eid = node._eid as string | undefined
      // Si el nodo no tiene su campo de ID, fallback a borrar por elementId de Neo4j
      const body = idValue ? { label: activeLabel, id_value: idValue } : { label: activeLabel, element_id: eid }
      const res = await fetch('/api/admin/nodos', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to delete')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
  }

  async function handleBulkUpdate(remove = false) {
    if (!bulkKey.trim()) return
    const ids = Array.from(selected)
    try {
      const res = await fetch('/api/admin/nodos', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: activeLabel, id_values: ids, properties: { [bulkKey.trim()]: remove ? null : parseValue(bulkVal) } }),
      })
      if (!res.ok) throw new Error('Bulk update error')
      setBulkKey(''); setBulkVal(''); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Bulk update error') }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected).filter(Boolean)
    if (!ids.length || !confirm(`Delete ${ids.length} node(s)?`)) return
    setBulkDeleting(true)
    try {
      // Si un id seleccionado coincide con un _eid (formato Neo4j "4:uuid:n"), borramos por elementId; si no, por campo de negocio
      const looksLikeEid = (s: string) => /^\d+:[0-9a-f-]+:\d+$/i.test(s)
      const eids = ids.filter(looksLikeEid)
      const idValues = ids.filter(s => !looksLikeEid(s))
      const body: Record<string, unknown> = { label: activeLabel }
      if (eids.length) body.element_ids = eids
      if (idValues.length) body.id_values = idValues
      const res = await fetch('/api/admin/nodos', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Bulk delete error')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setBulkDeleting(false) }
  }

  function toggleSel(id: string) {
    setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    // Selecciona/deselecciona los nodos visibles (respeta el filtro de búsqueda)
    const target = visibles.length > 0 ? visibles : nodos
    selected.size === target.length ? setSelected(new Set()) : setSelected(new Set(target.map(n => getSelectKey(n, activeLabel))))
  }

  const columns = getDisplayColumns(activeLabel, nodos)

  const searchSuggestions = useMemo(() =>
    nodos.map(n => {
      const id = getNodeId(n, activeLabel)
      const name = getNodeName(n)
      return { value: id || name, label: name && name !== id ? `${name} · ${id}` : id || name }
    }).filter(s => s.value),
  [nodos, activeLabel])

  // Filtro client-side: busca el query en cualquier valor del nodo (case-insensitive)
  const q = search.trim().toLowerCase()
  const visibles = q
    ? nodos.filter(n =>
        Object.entries(n)
          .filter(([k]) => k !== '_eid')
          .some(([, v]) => {
            if (v == null) return false
            const s = Array.isArray(v) ? v.join(' ') : String(v)
            return s.toLowerCase().includes(q)
          })
      )
    : nodos

  return (
    <div>
      {/* Label tabs */}
      <div className="tabs" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        {LABELS.map(l => (
          <button key={l} className={`tab${activeLabel === l ? ' active' : ''}`} onClick={() => setActiveLabel(l)}>{l}</button>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <span className="section-title" style={{ marginBottom: 0 }}>{activeLabel}s {!loading && `· ${q ? `${visibles.length}/${nodos.length}` : nodos.length}`}</span>
        <Combobox
          value={search}
          onChange={setSearch}
          suggestions={searchSuggestions}
          placeholder={`Search ${activeLabel}s — name, id, city…`}
          className="trace-input"
        />
        <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={toggleAll}>
          {selected.size === nodos.length && nodos.length > 0 ? 'Deselect all' : 'Select all'}
        </button>
        <button className="btn btn-fill" style={{ fontSize: 11 }} onClick={() => setShowCreate(v => !v)}>
          {showCreate ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Create Node</>}
        </button>
        <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => load()}>↻</button>
      </div>

      {error && (
        <div className="error-state" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Create Node</div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>
              Labels — usually just 1. Enable more to create a node with multiple types at once (e.g. Finca + Productor when the owner is the same):
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {LABELS.map(l => {
                const on = createLabels.has(l)
                return (
                  <label key={l} style={{ cursor: 'pointer', fontSize: 12, padding: '4px 12px', borderRadius: 20, userSelect: 'none', background: on ? 'var(--caramel)' : 'var(--border)', color: on ? '#fff' : 'var(--text-mid)' }}>
                    <input type="checkbox" style={{ display: 'none' }} checked={on} onChange={e => {
                      setCreateLabels(prev => {
                        const next = new Set(prev) as Set<Label>
                        e.target.checked ? next.add(l) : next.delete(l)
                        if (next.size === 0) return prev
                        setCreateProps(schemaToKV(next))
                        return next
                      })
                    }} />
                    {l}
                  </label>
                )
              })}
            </div>
            {createLabels.size >= 2 && (
              <div style={{ fontSize: 11, color: 'var(--caramel)', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /> 1 node will be created with labels: {Array.from(createLabels).join(' + ')}</div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6 }}>
              Properties — fill in the value for each field. Numbers and true/false are detected automatically:
            </div>
            {createProps.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <div style={{ flex: 1, fontSize: 12, color: 'var(--text-dark)', fontWeight: 500, padding: '0 4px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.key || <span style={{ color: 'var(--text-light)' }}>field</span>}
                </div>
                <input className="trace-input" style={{ flex: 2 }}
                  placeholder={getSchemaPlaceholder(createLabels, p.key)}
                  value={p.val}
                  onChange={e => setCreateProps(pr => pr.map((x, j) => j === i ? { ...x, val: e.target.value } : x))} />
                <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 8px' }}
                  onClick={() => setCreateProps(pr => pr.filter((_, j) => j !== i))}><X size={13} /></button>
              </div>
            ))}
            <button className="btn btn-outline" style={{ fontSize: 11 }}
              onClick={() => setCreateProps(pr => [...pr, { key: '', val: '' }])}>+ Extra field</button>
          </div>

          <button className="btn btn-fill" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : `Create (${createLabels.size} label${createLabels.size > 1 ? 's' : ''})`}
          </button>
        </div>
      )}

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="card" style={{ marginBottom: 12, padding: 12, background: '#fff8f0', border: '1px solid var(--caramel)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--caramel)' }}>{selected.size} selected</span>
            <input className="trace-input" style={{ width: 120 }} placeholder="property" value={bulkKey} onChange={e => setBulkKey(e.target.value)} />
            <input className="trace-input" style={{ width: 140 }} placeholder="new value" value={bulkVal} onChange={e => setBulkVal(e.target.value)} />
            <button className="btn btn-fill" style={{ fontSize: 11 }} onClick={() => handleBulkUpdate(false)}>Update prop</button>
            <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => handleBulkUpdate(true)}>Remove prop</button>
            <button className="btn btn-outline" style={{ fontSize: 11, color: '#c00', borderColor: '#ffcccc' }}
              onClick={handleBulkDelete} disabled={bulkDeleting}>{bulkDeleting ? '…' : 'Delete selection'}</button>
            <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => setSelected(new Set())}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-state">Loading {activeLabel}s…</div>
      ) : nodos.length === 0 ? (
        <div className="empty-state"><p>No {activeLabel}s found.</p></div>
      ) : visibles.length === 0 ? (
        <div className="empty-state"><p>No {activeLabel} matches &ldquo;{search}&rdquo;.</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}><input type="checkbox" checked={selected.size === visibles.length && visibles.length > 0} onChange={toggleAll} /></th>
                  {columns.map(c => <th key={c}>{c}</th>)}
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((node, i) => {
                  const selKey  = getSelectKey(node, activeLabel) || String(i)
                  const idVal   = getNodeId(node, activeLabel)
                  const isSel   = selected.has(selKey)
                  const isEdit  = editingId === selKey
                  return (
                    <Fragment key={selKey}>
                      <tr style={{ background: isSel ? '#fff8f0' : isEdit ? '#faf5ef' : undefined }}>
                        <td><input type="checkbox" checked={isSel} onChange={() => toggleSel(selKey)} /></td>
                        {columns.map(c => (
                          <td key={c} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {formatCell(node[c])}
                          </td>
                        ))}
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-outline" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => startEdit(node)}>
                              {isEdit ? 'Close' : 'Edit'}
                            </button>
                            <button className="btn btn-outline" style={{ fontSize: 11, padding: '3px 8px', color: '#c00', borderColor: '#ffcccc' }}
                              onClick={() => handleDelete(node)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                      {isEdit && (
                        <tr>
                          <td colSpan={columns.length + 2} style={{ background: '#faf5ef', padding: 16 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 8 }}>
                              Edit properties — an empty value or × removes the property:
                            </div>
                            {editProps.map((p, pi) => (
                              <div key={pi} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                                <input className="trace-input" style={{ flex: 1, opacity: p.remove ? 0.4 : 1, textDecoration: p.remove ? 'line-through' : 'none' }}
                                  value={p.key} onChange={e => setEditProps(pr => pr.map((x, j) => j === pi ? { ...x, key: e.target.value } : x))} />
                                <input className="trace-input" style={{ flex: 2, opacity: p.remove ? 0.4 : 1 }}
                                  value={p.val} disabled={!!p.remove}
                                  onChange={e => setEditProps(pr => pr.map((x, j) => j === pi ? { ...x, val: e.target.value } : x))} />
                                <button className="btn btn-outline" style={{ fontSize: 11, padding: '3px 8px', color: p.remove ? 'green' : '#c00', borderColor: p.remove ? '#cfc' : '#ffcccc' }}
                                  onClick={() => setEditProps(pr => pr.map((x, j) => j === pi ? { ...x, remove: !x.remove } : x))}>
                                  {p.remove ? '↩' : '×'}
                                </button>
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <button className="btn btn-outline" style={{ fontSize: 11 }}
                                onClick={() => setEditProps(pr => [...pr, { key: '', val: '' }])}>+ Property</button>
                              <button className="btn btn-fill" style={{ fontSize: 11 }} onClick={() => handleSave(idVal)} disabled={saving}>
                                {saving ? 'Saving…' : 'Save changes'}
                              </button>
                              <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => setEditingId(null)}>Cancel</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RELACIONES
// ─────────────────────────────────────────────────────────────────────────────

function RelacionesPanel() {
  const [activeType, setActiveType] = useState('SIRVE')
  const [rels, setRels]       = useState<RelRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [relSel, setRelSel]   = useState<Set<string>>(new Set())

  // Create
  const [showCreate, setShowCreate] = useState(false)
  const [cType, setCType]           = useState('SIRVE')
  const [fromLabel, setFromLabel]   = useState<Label>('Cafeteria')
  const [fromVal, setFromVal]       = useState('')
  const [toLabel, setToLabel]       = useState<Label>('Lote')
  const [toVal, setToVal]           = useState('')
  const [cProps, setCProps]         = useState<KVPair[]>(emptyKV(3))
  const [creating, setCreating]     = useState(false)

  // Edit
  const [editingEid, setEditingEid] = useState<string | null>(null)
  const [editProps, setEditProps]   = useState<KVPair[]>([])
  const [saving, setSaving]         = useState(false)

  // Bulk
  const [bulkKey, setBulkKey] = useState('')
  const [bulkVal, setBulkVal] = useState('')

  // Búsqueda libre por nombre de origen/destino o propiedad
  const [search, setSearch] = useState('')
  const relDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (searchTerm?: string) => {
    setLoading(true); setError(null); setRelSel(new Set()); setEditingEid(null)
    try {
      const params = new URLSearchParams({ type: activeType })
      if (searchTerm) params.set('search', searchTerm)
      const res = await fetch(`/api/admin/relaciones?${params}`)
      if (!res.ok) throw new Error('Failed to load')
      setRels(await res.json())
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [activeType])

  // Reload cuando cambia el tipo (cancela debounce pendiente y limpia búsqueda)
  useEffect(() => {
    if (relDebounceRef.current) clearTimeout(relDebounceRef.current)
    setSearch('')
    load()
  }, [load])

  // Re-fetch server-side al escribir (debounce 400ms)
  useEffect(() => {
    if (relDebounceRef.current) clearTimeout(relDebounceRef.current)
    relDebounceRef.current = setTimeout(() => {
      load(search.trim() || undefined)
    }, 400)
    return () => { if (relDebounceRef.current) clearTimeout(relDebounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  async function handleCreate() {
    if (!fromVal.trim() || !toVal.trim()) { setError('Fill in the IDs of both nodes'); return }
    const props: Record<string, unknown> = {}
    cProps.forEach(({ key, val }) => { if (key.trim()) props[key.trim()] = parseValue(val) })
    setCreating(true)
    try {
      const res = await fetch('/api/admin/relaciones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: cType, from_label: fromLabel, from_id_value: fromVal.trim(), to_label: toLabel, to_id_value: toVal.trim(), properties: props }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create')
      setShowCreate(false); setFromVal(''); setToVal(''); setCProps(emptyKV(3))
      // Si se creó con un tipo distinto al activo, cambiar el filtro para que el usuario vea su relación nueva
      if (cType !== activeType) setActiveType(cType); else await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to create') }
    finally { setCreating(false) }
  }

  function startEdit(rel: RelRecord) {
    if (editingEid === rel.eid) { setEditingEid(null); return }
    setEditingEid(rel.eid)
    setEditProps(Object.entries(rel.props).map(([key, val]) => ({ key, val: String(val ?? ''), remove: false })))
  }

  async function handleSaveRel(eid: string) {
    const props: Record<string, unknown> = {}
    editProps.forEach(({ key, val, remove }) => { if (key.trim()) props[key.trim()] = remove ? null : parseValue(val) })
    setSaving(true)
    try {
      const res = await fetch('/api/admin/relaciones', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ element_id: eid, properties: props }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setEditingEid(null); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function handleDeleteRel(eid: string) {
    if (!confirm('Delete this relationship?')) return
    try {
      const res = await fetch('/api/admin/relaciones', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ element_id: eid }),
      })
      if (!res.ok) throw new Error('Error'); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
  }

  async function handleBulkUpdate(remove = false) {
    if (!bulkKey.trim()) return
    const eids = Array.from(relSel)
    try {
      const res = await fetch('/api/admin/relaciones', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ element_ids: eids, properties: { [bulkKey.trim()]: remove ? null : parseValue(bulkVal) } }),
      })
      if (!res.ok) throw new Error('Bulk update error')
      setBulkKey(''); setBulkVal(''); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
  }

  async function handleBulkDeleteRel() {
    const eids = Array.from(relSel)
    if (!confirm(`Delete ${eids.length} relationship(s)?`)) return
    try {
      const res = await fetch('/api/admin/relaciones', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ element_ids: eids }),
      })
      if (!res.ok) throw new Error('Error'); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
  }

  function toggleRelSel(eid: string) {
    setRelSel(p => { const n = new Set(p); n.has(eid) ? n.delete(eid) : n.add(eid); return n })
  }
  function toggleAllRel() {
    const target = visibles.length > 0 ? visibles : rels
    relSel.size === target.length ? setRelSel(new Set()) : setRelSel(new Set(target.map(r => r.eid)))
  }

  const relSuggestions = useMemo(() =>
    rels.map(r => {
      const from = getNodeName(r.from_node)
      const to = getNodeName(r.to_node)
      const label = `${from} → ${activeType} → ${to}`
      return { value: from, label }
    }),
  [rels, activeType])

  // Filtro client-side: busca en nombre del origen, destino, y propiedades
  const q = search.trim().toLowerCase()
  const visibles = q
    ? rels.filter(r => {
        const fromName = getNodeName(r.from_node)
        const toName = getNodeName(r.to_node)
        const propStr = Object.entries(r.props).map(([k, v]) => `${k} ${v}`).join(' ')
        return [fromName, toName, r.from_label, r.to_label, propStr]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
    : rels

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Type:</span>
        <select className="filter-select" value={activeType} onChange={e => setActiveType(e.target.value)}>
          {REL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {!loading && (
          <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
            {q ? `${visibles.length}/${rels.length}` : rels.length} relationships
          </span>
        )}
        <Combobox
          value={search}
          onChange={setSearch}
          suggestions={relSuggestions}
          placeholder="Search by source, target, or property…"
          className="trace-input"
        />
        <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={toggleAllRel}>
          {relSel.size === visibles.length && visibles.length > 0 ? 'Deselect' : 'Select all'}
        </button>
        <button className="btn btn-fill" style={{ fontSize: 11 }} onClick={() => setShowCreate(v => !v)}>
          {showCreate ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Create Relationship</>}
        </button>
        <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => load()}>↻</button>
      </div>

      {error && (
        <div className="error-state" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Create Relationship</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, marginBottom: 12, alignItems: 'end' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>Source node:</div>
              <select className="filter-select" style={{ width: '100%', marginBottom: 6 }} value={fromLabel}
                onChange={e => setFromLabel(e.target.value as Label)}>
                {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <input className="trace-input" placeholder={`node ${getIdField(fromLabel)}`} value={fromVal}
                onChange={e => setFromVal(e.target.value)} />
            </div>
            <div style={{ textAlign: 'center', paddingBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 4 }}>Type</div>
              <select className="filter-select" value={cType} onChange={e => setCType(e.target.value)}>
                {REL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{ fontSize: 20, color: 'var(--caramel)', marginTop: 4 }}>→</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>Target node:</div>
              <select className="filter-select" style={{ width: '100%', marginBottom: 6 }} value={toLabel}
                onChange={e => setToLabel(e.target.value as Label)}>
                {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <input className="trace-input" placeholder={`node ${getIdField(toLabel)}`} value={toVal}
                onChange={e => setToVal(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6 }}>Properties (min. 3):</div>
            {cProps.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input className="trace-input" style={{ flex: 1 }} placeholder="key" value={p.key}
                  onChange={e => setCProps(pr => pr.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} />
                <input className="trace-input" style={{ flex: 2 }} placeholder="value" value={p.val}
                  onChange={e => setCProps(pr => pr.map((x, j) => j === i ? { ...x, val: e.target.value } : x))} />
                <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 8px' }}
                  onClick={() => setCProps(pr => pr.filter((_, j) => j !== i))}><X size={13} /></button>
              </div>
            ))}
            <button className="btn btn-outline" style={{ fontSize: 11 }}
              onClick={() => setCProps(pr => [...pr, { key: '', val: '' }])}>+ Field</button>
          </div>
          <button className="btn btn-fill" onClick={handleCreate} disabled={creating}>{creating ? 'Creating…' : 'Create relationship'}</button>
        </div>
      )}

      {/* Bulk bar */}
      {relSel.size > 0 && (
        <div className="card" style={{ marginBottom: 12, padding: 12, background: '#fff8f0', border: '1px solid var(--caramel)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--caramel)' }}>{relSel.size} selected</span>
            <input className="trace-input" style={{ width: 120 }} placeholder="property" value={bulkKey} onChange={e => setBulkKey(e.target.value)} />
            <input className="trace-input" style={{ width: 140 }} placeholder="new value" value={bulkVal} onChange={e => setBulkVal(e.target.value)} />
            <button className="btn btn-fill" style={{ fontSize: 11 }} onClick={() => handleBulkUpdate(false)}>Update prop</button>
            <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => handleBulkUpdate(true)}>Remove prop</button>
            <button className="btn btn-outline" style={{ fontSize: 11, color: '#c00', borderColor: '#ffcccc' }} onClick={handleBulkDeleteRel}>Delete selection</button>
            <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => setRelSel(new Set())}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-state">Loading relationships…</div>
      ) : rels.length === 0 ? (
        <div className="empty-state"><p>No relationships of type {activeType}.</p></div>
      ) : visibles.length === 0 ? (
        <div className="empty-state"><p>No relationship matches &ldquo;{search}&rdquo;.</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}><input type="checkbox" checked={relSel.size === visibles.length && visibles.length > 0} onChange={toggleAllRel} /></th>
                  <th>Source</th>
                  <th>→ Type →</th>
                  <th>Target</th>
                  <th>Properties</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((rel) => {
                  const isSel  = relSel.has(rel.eid)
                  const isEdit = editingEid === rel.eid
                  return (
                    <Fragment key={rel.eid}>
                      <tr style={{ background: isSel ? '#fff8f0' : undefined }}>
                        <td><input type="checkbox" checked={isSel} onChange={() => toggleRelSel(rel.eid)} /></td>
                        <td style={{ fontSize: 12 }}>
                          <div style={{ fontSize: 10, color: 'var(--text-light)' }}>{rel.from_label}</div>
                          <div style={{ fontWeight: 500 }}>{getNodeName(rel.from_node)}</div>
                        </td>
                        <td>
                          <span className="metodo-tag" style={{ fontSize: 10, padding: '2px 8px' }}>{activeType}</span>
                        </td>
                        <td style={{ fontSize: 12 }}>
                          <div style={{ fontSize: 10, color: 'var(--text-light)' }}>{rel.to_label}</div>
                          <div style={{ fontWeight: 500 }}>{getNodeName(rel.to_node)}</div>
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-mid)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {Object.entries(rel.props).slice(0, 3).map(([k, v]) => `${k}: ${formatCell(v)}`).join(' · ')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-outline" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => startEdit(rel)}>
                              {isEdit ? 'Close' : 'Edit'}
                            </button>
                            <button className="btn btn-outline" style={{ fontSize: 11, padding: '3px 8px', color: '#c00', borderColor: '#ffcccc' }}
                              onClick={() => handleDeleteRel(rel.eid)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                      {isEdit && (
                        <tr>
                          <td colSpan={6} style={{ background: '#faf5ef', padding: 16 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 8 }}>
                              Edit properties — × marks for removal:
                            </div>
                            {editProps.map((p, pi) => (
                              <div key={pi} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                                <input className="trace-input" style={{ flex: 1, opacity: p.remove ? 0.4 : 1 }} value={p.key}
                                  onChange={e => setEditProps(pr => pr.map((x, j) => j === pi ? { ...x, key: e.target.value } : x))} />
                                <input className="trace-input" style={{ flex: 2, opacity: p.remove ? 0.4 : 1 }} value={p.val}
                                  disabled={!!p.remove}
                                  onChange={e => setEditProps(pr => pr.map((x, j) => j === pi ? { ...x, val: e.target.value } : x))} />
                                <button className="btn btn-outline" style={{ fontSize: 11, padding: '3px 8px', color: p.remove ? 'green' : '#c00', borderColor: p.remove ? '#cfc' : '#ffcccc' }}
                                  onClick={() => setEditProps(pr => pr.map((x, j) => j === pi ? { ...x, remove: !x.remove } : x))}>
                                  {p.remove ? '↩' : '×'}
                                </button>
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <button className="btn btn-outline" style={{ fontSize: 11 }}
                                onClick={() => setEditProps(pr => [...pr, { key: '', val: '' }])}>+ Property</button>
                              <button className="btn btn-fill" style={{ fontSize: 11 }} onClick={() => handleSaveRel(rel.eid)} disabled={saving}>
                                {saving ? 'Saving…' : 'Save'}
                              </button>
                              <button className="btn btn-outline" style={{ fontSize: 11 }} onClick={() => setEditingEid(null)}>Cancel</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV IMPORT
// ─────────────────────────────────────────────────────────────────────────────

type CsvRow = { type: string; label: string; rel_type: string; from_label: string; from_id: string; to_label: string; to_id: string; extra_props: string }
type ImportResult = { nodes_created: number; rels_created: number; errors: string[] }

function parseCSVPreview(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  return lines.slice(1).map(line => {
    const cols = line.split(',')
    const [type = '', label = '', rel_type = '', from_label = '', from_id = '', to_label = '', to_id = '', extra_props = ''] = cols
    return { type, label, rel_type, from_label, from_id, to_label, to_id, extra_props }
  })
}

function CsvPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // LOAD CSV via URL
  const [csvUrl, setCsvUrl] = useState('')
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [urlResult, setUrlResult] = useState<{ lotes_importados?: number; message?: string; error?: string } | null>(null)

  function handleFile(f: File | null) {
    if (!f) return
    setFile(f); setResult(null); setError(null)
    const reader = new FileReader()
    reader.onload = e => setPreview(parseCSVPreview(e.target?.result as string))
    reader.readAsText(f)
  }

  async function handleImport() {
    if (!file) return
    setImporting(true); setError(null); setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/csv', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setResult(data as ImportResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setFile(null); setPreview([]); setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleLoadCsvUrl() {
    if (!csvUrl.trim()) return
    setLoadingUrl(true); setUrlResult(null)
    try {
      const res = await fetch('/api/admin/csv', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: csvUrl.trim() }),
      })
      setUrlResult(await res.json())
    } catch (e) {
      setUrlResult({ error: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setLoadingUrl(false)
    }
  }

  const nodeRows = preview.filter(r => r.type === 'node')
  const relRows  = preview.filter(r => r.type === 'rel')

  return (
    <div>
      {/* Formato */}
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 10 }}>CSV Format</div>
        <p style={{ fontSize: 12.5, color: 'var(--text-mid)', lineHeight: 1.8, marginBottom: 12 }}>
          8 fixed columns. <code style={{ background: 'var(--cream-mid)', padding: '1px 5px', borderRadius: 4 }}>node</code> rows create nodes,
          and <code style={{ background: 'var(--cream-mid)', padding: '1px 5px', borderRadius: 4 }}>rel</code> rows create relationships —
          they can connect nodes from the same CSV or nodes already in the DB.
          In <strong>extra_props</strong>: <code>key=value</code> separated by <code>|</code>. Arrays: use <code>;</code> between values.
        </p>
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 11.5, color: 'var(--text-body)', overflowX: 'auto', whiteSpace: 'pre', lineHeight: 1.7 }}>
{`type,label,rel_type,from_label,from_id,to_label,to_id,extra_props
node,Lote,,,,,,lote_id=L99901|codigo_lote=CSV-HUE-0001|proceso=Honey|puntaje_sca=88
node,Transporte,,,,,,transporte_id=TR99901|medio=Camion|distancia_km=280
rel,,SIRVE,Cafeteria,C001,Lote,L99901,,
rel,,PRODUJO,Finca,F0001,Lote,L99901,,`}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href="/sample-import.csv" download="sample-import.csv"
            style={{ fontSize: 12.5, color: 'var(--caramel)', fontWeight: 500, textDecoration: 'none' }}>
            ↓ Multi-purpose CSV (direct upload)
          </a>
          <a href="/github-import.csv" download="github-import.csv"
            style={{ fontSize: 12.5, color: 'var(--caramel)', fontWeight: 500, textDecoration: 'none' }}>
            ↓ CSV for LOAD CSV (upload to GitHub)
          </a>
        </div>
      </div>

      {/* LOAD CSV desde URL — método nativo Neo4j */}
      <div className="card" style={{ marginBottom: 20, padding: 20, borderLeft: '3px solid var(--caramel)' }}>
        <div className="section-title" style={{ marginBottom: 6 }}>LOAD CSV from URL <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-light)', marginLeft: 6 }}>native Neo4j method</span></div>
        <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 12, lineHeight: 1.7 }}>
          Paste the raw GitHub URL (or another public host). Neo4j AuraDB downloads and processes the CSV directly with <code style={{ background: 'var(--cream-mid)', padding: '1px 5px', borderRadius: 4 }}>LOAD CSV</code>.
          Use the <strong>github-import.csv</strong> file — it has standard columns for Batches + automatic relationships.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="trace-input"
            style={{ flex: 1, minWidth: 260 }}
            placeholder="https://raw.githubusercontent.com/user/repo/main/github-import.csv"
            value={csvUrl}
            onChange={e => { setCsvUrl(e.target.value); setUrlResult(null) }}
            disabled={loadingUrl}
          />
          <button className="btn btn-fill" onClick={handleLoadCsvUrl} disabled={loadingUrl || !csvUrl.trim()}>
            {loadingUrl ? 'Loading…' : 'Run LOAD CSV'}
          </button>
        </div>
        {urlResult && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: urlResult.error ? '#fff0f0' : '#f0faf4', border: `1px solid ${urlResult.error ? '#ffcccc' : '#8ec9a4'}`, fontSize: 13 }}>
            {urlResult.error
              ? <span style={{ color: '#c00' }}>❌ {urlResult.error}</span>
              : <span>✅ {urlResult.message}</span>
            }
          </div>
        )}
      </div>

      {/* Upload */}
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Select File</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input ref={inputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0] ?? null)} />
          <button className="btn btn-outline" onClick={() => inputRef.current?.click()}>
            {file ? `📄 ${file.name}` : 'Choose CSV file'}
          </button>
          {file && (
            <button className="btn btn-fill" onClick={handleImport} disabled={importing}>
              {importing ? 'Importing…' : `Import (${preview.length} rows)`}
            </button>
          )}
          {file && (
            <button className="btn btn-outline" onClick={reset}><X size={13} /> Clear</button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-state" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="card" style={{ marginBottom: 20, padding: 20, background: result.errors.length === 0 ? '#f0faf4' : '#fffbf0', border: `1px solid ${result.errors.length === 0 ? '#8ec9a4' : 'var(--caramel)'}` }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Result</div>
          <div style={{ display: 'flex', gap: 24, marginBottom: result.errors.length > 0 ? 12 : 0, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13 }}>✅ <strong>{result.nodes_created}</strong> node{result.nodes_created !== 1 ? 's' : ''} created</div>
            <div style={{ fontSize: 13 }}>🔗 <strong>{result.rels_created}</strong> relationship{result.rels_created !== 1 ? 's' : ''} created</div>
          </div>
          {result.errors.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--caramel)', marginBottom: 6 }}>{result.errors.length} error(s):</div>
              <ul style={{ fontSize: 12, color: 'var(--text-body)', lineHeight: 1.8, paddingLeft: 18 }}>
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Preview tabla */}
      {preview.length > 0 && !result && (
        <div>
          <div className="section-title" style={{ marginBottom: 10 }}>
            Preview — {nodeRows.length} node{nodeRows.length !== 1 ? 's' : ''} · {relRows.length} relationship{relRows.length !== 1 ? 's' : ''}
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Type</th><th>Label / Rel</th><th>Source</th><th>Target</th><th>Properties</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} style={{ background: row.type === 'rel' ? 'var(--cream)' : undefined }}>
                      <td>
                        <span className="metodo-tag" style={{ fontSize: 10.5, padding: '2px 8px', background: row.type === 'node' ? 'var(--caramel)' : 'var(--brown-mid)', color: '#fff' }}>
                          {row.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, fontSize: 12 }}>{row.type === 'node' ? row.label : row.rel_type}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-mid)' }}>{row.type === 'rel' ? `${row.from_label} · ${row.from_id}` : '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-mid)' }}>{row.type === 'rel' ? `${row.to_label} · ${row.to_id}` : '—'}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-mid)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.extra_props || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
