'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export interface Suggestion {
  label: string
  value: string
}

interface Props {
  value: string
  onChange: (val: string) => void
  onSelect?: (val: string) => void
  suggestions: Suggestion[]
  placeholder?: string
  disabled?: boolean
  className?: string
  maxSuggestions?: number
}

export default function Combobox({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  disabled,
  className = 'trace-input',
  maxSuggestions = 10,
}: Props) {
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)

  const q = value.trim().toLowerCase()
  const filtered = q.length === 0
    ? suggestions.slice(0, maxSuggestions)
    : suggestions
        .filter(s => s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q))
        .slice(0, maxSuggestions)

  const visible = open && filtered.length > 0

  const pick = useCallback((s: Suggestion) => {
    onChange(s.value)
    onSelect?.(s.value)
    setOpen(false)
    setActiveIdx(-1)
  }, [onChange, onSelect])

  function handleKey(e: React.KeyboardEvent) {
    if (!visible) {
      if (e.key === 'ArrowDown') { setOpen(true); return }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      pick(filtered[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIdx(-1)
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={wrapRef} className="combobox-wrap">
      <input
        className={className}
        style={{ width: '100%', boxSizing: 'border-box' }}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setActiveIdx(-1) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {visible && (
        <ul className="combobox-list" role="listbox">
          {filtered.map((s, i) => (
            <li
              key={s.value + i}
              className={`combobox-item${i === activeIdx ? ' active' : ''}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={() => pick(s)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
