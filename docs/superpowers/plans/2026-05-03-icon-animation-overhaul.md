# Icon & Animation Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every emoji and bare-text symbol in the app with `lucide-react` SVG icons, a CSS-animated `CoffeeLoader` component, and one Lottie success animation for the "no impact" empty state.

**Architecture:** Install `@lottiefiles/dotlottie-react` (Lottie CDN URL playback, SSR-safe via dynamic import) and `lucide-react` (static SVG icons). A `LottiePlayer` wrapper handles the dynamic import. A `CoffeeLoader` component provides CSS-animated on-brand loading UI. Chain step icons in `TrazabilidadDetail` change from `icon: string` to `icon: React.ReactNode` using lucide components.

**Tech Stack:** Next.js 15 App Router · @lottiefiles/dotlottie-react · lucide-react · CSS keyframe animations

---

## File Map

| Action | File |
|--------|------|
| Create | `coffeetracker/components/CoffeeLoader.tsx` |
| Create | `coffeetracker/components/LottiePlayer.tsx` |
| Modify | `coffeetracker/app/globals.css` — add `@keyframes steam-up` + loader CSS |
| Modify | `coffeetracker/components/Sidebar.tsx` — ☕ logo → `<Coffee>` icon |
| Modify | `coffeetracker/components/TrazabilidadDetail.tsx` — chain icons → lucide, loading/error → components |
| Modify | `coffeetracker/components/TrazabilidadSearch.tsx` — 🔍 → `<Search>`, ⚠️ → `<AlertTriangle>` |
| Modify | `coffeetracker/components/FincaSearch.tsx` — 🌿 → `<Leaf>` |
| Modify | `coffeetracker/components/FincaDetail.tsx` — loading/empty/error → components |
| Modify | `coffeetracker/components/CafeteriasView.tsx` — loading/empty/error → components |
| Modify | `coffeetracker/components/CafeteriaCard.tsx` — 📍 → `<MapPin>` |
| Modify | `coffeetracker/components/ImpactoView.tsx` — all emojis → lucide/Lottie |
| Modify | `coffeetracker/components/AdminView.tsx` — ⚠️/✕/✓/+ → lucide |
| Modify | `coffeetracker/app/page.tsx` — loading fallback → `<CoffeeLoader>` |

---

### Task 1: Install packages

**Files:**
- Modify: `coffeetracker/package.json`

- [ ] **Step 1: Install packages**

Run from `coffeetracker/`:
```bash
cd coffeetracker && npm install @lottiefiles/dotlottie-react lucide-react
```
Expected: both packages appear in `package.json` dependencies, no errors.

- [ ] **Step 2: Verify imports resolve**

```bash
node -e "require('lucide-react'); console.log('lucide OK')"
```
Expected: prints `lucide OK`.

---

### Task 2: Add loader CSS to globals.css and create CoffeeLoader component

**Files:**
- Modify: `coffeetracker/app/globals.css`
- Create: `coffeetracker/components/CoffeeLoader.tsx`

- [ ] **Step 1: Add CSS keyframes and classes to the end of `globals.css`**

Append after the last line of `coffeetracker/app/globals.css`:
```css

/* ── Coffee loader ── */
@keyframes steam-up {
  0%, 100% { opacity: 0; transform: translateY(0px); }
  50%       { opacity: 1; transform: translateY(-5px); }
}
.coffee-steam-1 { animation: steam-up 1.8s ease-in-out infinite; }
.coffee-steam-2 { animation: steam-up 1.8s ease-in-out 0.35s infinite; }
.coffee-steam-3 { animation: steam-up 1.8s ease-in-out 0.7s infinite; }
```

- [ ] **Step 2: Create `CoffeeLoader.tsx`**

```tsx
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
```

---

### Task 3: Create LottiePlayer wrapper

**Files:**
- Create: `coffeetracker/components/LottiePlayer.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import dynamic from 'next/dynamic'

const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((m) => ({ default: m.DotLottieReact })),
  { ssr: false, loading: () => <div /> }
)

interface Props {
  src: string
  size?: number
  loop?: boolean
}

export default function LottiePlayer({ src, size = 120, loop = false }: Props) {
  return (
    <DotLottieReact
      src={src}
      autoplay
      loop={loop}
      style={{ width: size, height: size }}
    />
  )
}
```

---

### Task 4: Update Sidebar — replace ☕ logo emoji

**Files:**
- Modify: `coffeetracker/components/Sidebar.tsx`

- [ ] **Step 1: Add lucide import**

At the top of `Sidebar.tsx`, add:
```tsx
import { Coffee } from 'lucide-react'
```

- [ ] **Step 2: Replace the emoji in the logo**

Find:
```tsx
<div className="logo-cup">☕</div>
```
Replace with:
```tsx
<div className="logo-cup"><Coffee size={18} color="#fff" /></div>
```

---

### Task 5: Update TrazabilidadDetail — chain step icons + loading + error + cert badges + close button

**Files:**
- Modify: `coffeetracker/components/TrazabilidadDetail.tsx`

- [ ] **Step 1: Add imports**

Replace the existing imports block:
```tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { TrazabilidadData } from '@/types'
```
With:
```tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Coffee, Flame, Truck, Settings2, Leaf, User, AlertTriangle, Check, X } from 'lucide-react'
import CoffeeLoader from './CoffeeLoader'
import type { TrazabilidadData } from '@/types'
```

- [ ] **Step 2: Replace loading and error states**

Find:
```tsx
  if (loading) return <div className="loading-state">☕ Cargando trazabilidad…</div>
  if (error)   return (
    <div className="page">
      <div className="error-state">⚠️ {error}</div>
```
Replace with:
```tsx
  if (loading) return <CoffeeLoader text="Cargando trazabilidad…" />
  if (error)   return (
    <div className="page">
      <div className="error-state" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} />{error}</div>
```

- [ ] **Step 3: Replace chain step icons in `steps` array**

Find (the icon properties in the steps array — these 6 lines):
```tsx
      key: 'cafeteria', icon: '☕',
```
```tsx
      key: 'tostador', icon: '🔥',
```
```tsx
      key: 'transporte', icon: '🚚',
```
```tsx
      key: 'beneficio', icon: '⚙️',
```
```tsx
      key: 'finca', icon: '🌿',
```
```tsx
      key: 'productor', icon: '👨‍🌾',
```

Replace each `icon: 'EMOJI'` value (keeping the rest of the line intact):

| Old | New |
|-----|-----|
| `icon: '☕'` | `icon: <Coffee size={22} color="var(--brown)" />` |
| `icon: '🔥'` | `icon: <Flame size={22} color="var(--brown)" />` |
| `icon: '🚚'` | `icon: <Truck size={22} color="var(--brown)" />` |
| `icon: '⚙️'` | `icon: <Settings2 size={22} color="var(--brown)" />` |
| `icon: '🌿'` | `icon: <Leaf size={22} color="var(--brown)" />` |
| `icon: '👨‍🌾'` | `icon: <User size={22} color="var(--brown)" />` |

- [ ] **Step 4: Update the `steps` type to accept ReactNode icons**

The `steps` array is inferred, but `TimelineView` has an explicit type. Find:
```tsx
function TimelineView({ data, steps }: { data: TrazabilidadData; steps: { key: string; icon: string; label: string; name: string; detail: string; data: Record<string, string | undefined> }[] }) {
```
Replace with:
```tsx
function TimelineView({ data, steps }: { data: TrazabilidadData; steps: { key: string; icon: React.ReactNode; label: string; name: string; detail: string; data: Record<string, string | undefined> }[] }) {
```

Also add `import React from 'react'` at the top if not already present (it's not needed in React 19 with the new JSX transform, but the type reference requires it). Actually, use `import type { ReactNode } from 'react'` instead:

Change the top import from:
```tsx
import { useEffect, useState } from 'react'
```
To:
```tsx
import { useEffect, useState, type ReactNode } from 'react'
```
And update the TimelineView signature to use `ReactNode`:
```tsx
function TimelineView({ data, steps }: { data: TrazabilidadData; steps: { key: string; icon: ReactNode; label: string; name: string; detail: string; data: Record<string, string | undefined> }[] }) {
```

- [ ] **Step 5: Replace ✓ in cert badges and ✕ close button**

Find (in the journey header cert badges):
```tsx
                ✓ {c.nombre}
```
Replace with:
```tsx
                <Check size={11} style={{ flexShrink: 0 }} /> {c.nombre}
```

Find (in the flow section cert-badge):
```tsx
                  <span key={i} className="cert-badge">✓ {c.nombre}</span>
```
Replace with:
```tsx
                  <span key={i} className="cert-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={11} /> {c.nombre}</span>
```

Find:
```tsx
                  Cerrar ✕
```
Replace with:
```tsx
                  Cerrar <X size={12} />
```

---

### Task 6: Update CafeteriasView + app/page.tsx — loading, empty, error states

**Files:**
- Modify: `coffeetracker/components/CafeteriasView.tsx`
- Modify: `coffeetracker/app/page.tsx`

- [ ] **Step 1: Add imports to CafeteriasView**

Add at the top of `CafeteriasView.tsx`:
```tsx
import { AlertTriangle } from 'lucide-react'
import CoffeeLoader from './CoffeeLoader'
```

- [ ] **Step 2: Replace error state**

Find:
```tsx
          ⚠️ {error} — Verifica que Neo4j AuraDB esté disponible y las credenciales sean correctas.
```
Replace with:
```tsx
          <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error} — Verifica que Neo4j AuraDB esté disponible y las credenciales sean correctas.
```
Also add `style={{ display: 'flex', alignItems: 'center', gap: 8 }}` to the wrapping `<div className="error-state">`:
```tsx
        <div className="error-state" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
```

- [ ] **Step 3: Replace loading and empty states**

Find:
```tsx
      {loading ? (
        <div className="loading-state">☕ Cargando cafeterías…</div>
      ) : visibles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">☕</div>
```
Replace with:
```tsx
      {loading ? (
        <CoffeeLoader text="Cargando cafeterías…" />
      ) : visibles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
            <CoffeeLoader text="" size={64} />
          </div>
```

- [ ] **Step 4: Update app/page.tsx loading fallback**

Add import at the top of `coffeetracker/app/page.tsx`:
```tsx
import CoffeeLoader from '@/components/CoffeeLoader'
```

Find:
```tsx
        <Suspense fallback={<div className="loading-state">☕ Cargando cafeterías…</div>}>
```
Replace with:
```tsx
        <Suspense fallback={<CoffeeLoader text="Cargando cafeterías…" />}>
```

---

### Task 7: Update TrazabilidadSearch + FincaSearch — search prompt icons

**Files:**
- Modify: `coffeetracker/components/TrazabilidadSearch.tsx`
- Modify: `coffeetracker/components/FincaSearch.tsx`

- [ ] **Step 1: Update TrazabilidadSearch**

Add import at top of `TrazabilidadSearch.tsx`:
```tsx
import { Search, AlertTriangle } from 'lucide-react'
```

Find:
```tsx
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
```
Replace with:
```tsx
        <Search size={52} color="var(--text-pale)" style={{ marginBottom: 16 }} />
```

Find:
```tsx
            ⚠️ {error}
```
Replace with:
```tsx
            <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
```
And add `style={{ display: 'flex', alignItems: 'center', gap: 6 }}` to the wrapping error div. Find:
```tsx
          <div className="error-state">
            ⚠️ {error}
          </div>
```
Replace with:
```tsx
          <div className="error-state" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
```

- [ ] **Step 2: Update FincaSearch**

Add import at top of `FincaSearch.tsx`:
```tsx
import { Leaf } from 'lucide-react'
```

Find:
```tsx
        <div style={{ fontSize: 52, marginBottom: 16 }}>🌿</div>
```
Replace with:
```tsx
        <Leaf size={52} color="var(--text-pale)" style={{ marginBottom: 16 }} />
```

---

### Task 8: Update FincaDetail — loading, empty, error, badges

**Files:**
- Modify: `coffeetracker/components/FincaDetail.tsx`

- [ ] **Step 1: Add imports**

Add at the top of `FincaDetail.tsx`:
```tsx
import { AlertTriangle, Leaf, Coffee } from 'lucide-react'
import CoffeeLoader from './CoffeeLoader'
```

- [ ] **Step 2: Replace loading state**

Find:
```tsx
  if (loading) return <div className="loading-state">🌿 Cargando finca…</div>
```
Replace with:
```tsx
  if (loading) return <CoffeeLoader text="Cargando finca…" />
```

- [ ] **Step 3: Replace error state**

Find:
```tsx
      <div className="error-state">⚠️ {error}</div>
```
Replace with:
```tsx
      <div className="error-state" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} />{error}</div>
```

- [ ] **Step 4: Replace empty state icon**

Find:
```tsx
      <div className="empty-icon">🌿</div>
```
Replace with:
```tsx
      <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}><Leaf size={48} color="var(--text-pale)" /></div>
```

- [ ] **Step 5: Replace hero badge icon and cafeteria list icons**

Find:
```tsx
          <div className="hero-badge">🌿 Finca</div>
```
Replace with:
```tsx
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Leaf size={12} /> Finca</div>
```

Find:
```tsx
                ☕ {c.nombre} · {c.ciudad}
```
Replace with:
```tsx
                <Coffee size={13} style={{ flexShrink: 0 }} /> {c.nombre} · {c.ciudad}
```
The parent element needs `display: flex; align-items: center; gap: 6px` — find the wrapping element and add those styles, or wrap in a span:
```tsx
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Coffee size={13} /> {c.nombre} · {c.ciudad}</span>
```

---

### Task 9: Update CafeteriaCard — location pin

**Files:**
- Modify: `coffeetracker/components/CafeteriaCard.tsx`

- [ ] **Step 1: Add import and replace icon**

Add at top:
```tsx
import { MapPin } from 'lucide-react'
```

Find:
```tsx
            📍 {cafeteria.ciudad}
```
Replace with:
```tsx
            <MapPin size={12} style={{ flexShrink: 0 }} /> {cafeteria.ciudad}
```
The `.cafe-card-city` div needs flex — it only contains this text line, so add inline style:
```tsx
          <div className="cafe-card-city" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} style={{ flexShrink: 0 }} /> {cafeteria.ciudad}
          </div>
```

---

### Task 10: Update ImpactoView — all emojis

**Files:**
- Modify: `coffeetracker/components/ImpactoView.tsx`

- [ ] **Step 1: Add imports**

Add at top:
```tsx
import { AlertTriangle, Leaf, Coffee } from 'lucide-react'
import LottiePlayer from './LottiePlayer'
import CoffeeLoader from './CoffeeLoader'
```

- [ ] **Step 2: Replace the intro card ⚠️ icon**

Find:
```tsx
          <div style={{ fontSize: 36 }}>⚠️</div>
```
Replace with:
```tsx
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 12, background: 'var(--cream-mid)', flexShrink: 0 }}>
            <AlertTriangle size={28} color="var(--caramel)" />
          </div>
```

- [ ] **Step 3: Replace inline error state**

Find:
```tsx
      {error && <div className="error-state" style={{ marginBottom: 20 }}>⚠️ {error}</div>}
```
Replace with:
```tsx
      {error && <div className="error-state" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} />{error}</div>}
```

- [ ] **Step 4: Replace ✅ empty state with Lottie success animation**

Find:
```tsx
          <div className="empty-icon">✅</div>
```
Replace with:
```tsx
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <LottiePlayer src="https://assets9.lottiefiles.com/packages/lf20_jbrw3hcz.json" size={120} />
          </div>
```

- [ ] **Step 5: Replace result row icons**

Find:
```tsx
                <div className="impacto-finca">🌿 {r.finca_vecina}</div>
```
Replace with:
```tsx
                <div className="impacto-finca" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Leaf size={15} color="var(--text-mid)" /> {r.finca_vecina}</div>
```

Find:
```tsx
                      ☕ {c}
```
Replace with:
```tsx
                      <Coffee size={12} style={{ flexShrink: 0 }} /> {c}
```
The wrapping `<span>` needs flex too — update it:
```tsx
                    <span key={j} className="metodo-tag" style={{ padding: '4px 12px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Coffee size={12} style={{ flexShrink: 0 }} /> {c}
                    </span>
```

---

### Task 11: Update AdminView — ⚠️, ✕, ✓, + icons

**Files:**
- Modify: `coffeetracker/components/AdminView.tsx`

- [ ] **Step 1: Add lucide imports at top of AdminView.tsx**

Add:
```tsx
import { AlertTriangle, X, Plus, Check } from 'lucide-react'
```

- [ ] **Step 2: Replace Nodos section button labels**

Find (line ~360):
```tsx
          {showCreate ? '✕ Cancelar' : '+ Crear Nodo'}
```
Replace with:
```tsx
          {showCreate ? <><X size={13} /> Cancelar</> : <><Plus size={13} /> Crear Nodo</>}
```

- [ ] **Step 3: Replace Nodos error banner**

Find (line ~367):
```tsx
          ⚠️ {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
```
Replace with:
```tsx
          <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
```
Also add `display: flex; align-items: center; gap: 6px` to the error div — find the container and add inline style.

- [ ] **Step 4: Replace ✓ confirmation text**

Find (line ~401):
```tsx
              <div style={{ fontSize: 11, color: 'var(--caramel)' }}>✓ Se creará 1 nodo con los labels: {Array.from(createLabels).join(' + ')}</div>
```
Replace with:
```tsx
              <div style={{ fontSize: 11, color: 'var(--caramel)', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Se creará 1 nodo con los labels: {Array.from(createLabels).join(' + ')}</div>
```

- [ ] **Step 5: Replace ✕ row delete buttons in create form (line ~419)**

Find:
```tsx
                  onClick={() => setCreateProps(pr => pr.filter((_, j) => j !== i))}>✕</button>
```
Replace with:
```tsx
                  onClick={() => setCreateProps(pr => pr.filter((_, j) => j !== i))}><X size={13} /></button>
```

- [ ] **Step 6: Replace Relaciones section button + error (lines ~699–751)**

Find (line ~699):
```tsx
          {showCreate ? '✕ Cancelar' : '+ Crear Relación'}
```
Replace with:
```tsx
          {showCreate ? <><X size={13} /> Cancelar</> : <><Plus size={13} /> Crear Relación</>}
```

Find (line ~706):
```tsx
          ⚠️ {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
```
Replace with:
```tsx
          <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
```

Find (line ~751):
```tsx
                  onClick={() => setCProps(pr => pr.filter((_, j) => j !== i))}>✕</button>
```
Replace with:
```tsx
                  onClick={() => setCProps(pr => pr.filter((_, j) => j !== i))}><X size={13} /></button>
```

---

### Task 12: Verify and commit

- [ ] **Step 1: Run TypeScript check**

```bash
cd coffeetracker && npx tsc --noEmit
```
Expected: no errors. If there are type errors about `ReactNode`, ensure `import { ..., type ReactNode } from 'react'` is in `TrazabilidadDetail.tsx`.

- [ ] **Step 2: Run build to confirm no errors**

```bash
cd coffeetracker && npm run build
```
Expected: build completes successfully.

- [ ] **Step 3: Commit**

```bash
git add coffeetracker/components/ coffeetracker/app/ coffeetracker/package.json coffeetracker/package-lock.json docs/
git commit -m "feat(ui): replace emojis with lucide icons, CSS coffee loader, and Lottie success animation"
```
