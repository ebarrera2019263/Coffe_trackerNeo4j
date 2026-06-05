# CoffeTracker ☕

Aplicación web de trazabilidad de café de especialidad guatemalteco. Recorre el grafo desde la cafetería hacia atrás hasta el productor:

**Cafetería → Tostador → Transporte → Beneficio → Finca → Productor → Certificaciones**

## Stack

| Tecnología | Versión |
|---|---|
| Next.js (App Router) | 15.5.15 |
| React | 19.1.0 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Neo4j Driver | 6.x |
| Base de datos | Neo4j AuraDB |

## Vistas

| Ruta | Descripción |
|---|---|
| `/` | Listado de cafeterías con filtros por ciudad y tipo |
| `/trazabilidad` | Búsqueda de lote por código |
| `/trazabilidad/[lote_id]` | Cadena completa del lote (flujo horizontal + timeline) |
| `/finca/[finca_id]` | Vista inversa: lotes de una finca y cafeterías que los sirven |
| `/impacto` | Cafeterías afectadas por fincas vecinas con microclima compartido |
| `/admin` | CRUD de nodos del grafo (Cafeterías, Fincas, Lotes, etc.) |

## Modelo del grafo (Neo4j)

```
(Productor)-[:CULTIVA]->(Finca)
(Finca)-[:PRODUJO]->(Lote)
(Beneficio)-[:PROCESO]->(Lote)
(Transporte)-[:TRANSPORTO]->(Lote)
(Tostador)-[:COMPRO]->(Lote)
(Tostador)-[:TOSTO]->(Lote)
(Cafeteria)-[:SIRVE]->(Lote)
(Certificacion)-[:CERTIFICA]->(Finca|Lote|Beneficio)
(Finca)-[:VECINA_DE]->(Finca)
```

## Setup

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd coffeetracker
npm install
```

### 2. Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEO4J_URI=neo4j+s://<tu-instancia>.databases.neo4j.io
NEO4J_USER=<usuario>
NEO4J_PASSWORD=<contraseña>
NEO4J_DATABASE=<nombre-db>
```

> 
### 3. Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 4. Build de producción

```bash
npm run build
npm start
```

## Estructura del proyecto

```
coffeetracker/
├── app/
│   ├── globals.css                       # Variables CSS del diseño + Tailwind
│   ├── layout.tsx                        # Shell: Sidebar + main wrapper
│   ├── page.tsx                          # / Vista cafeterías
│   ├── trazabilidad/
│   │   ├── page.tsx                      # Búsqueda por código de lote
│   │   └── [lote_id]/page.tsx            # Cadena completa del lote
│   ├── finca/
│   │   ├── page.tsx                      # Búsqueda de finca
│   │   └── [finca_id]/page.tsx           # Vista inversa finca
│   ├── impacto/page.tsx                  # Análisis de impacto
│   ├── admin/page.tsx                    # CRUD nodos del grafo
│   └── api/
│       ├── cafeterias/route.ts
│       ├── trazabilidad/[lote_id]/route.ts
│       ├── finca/[finca_id]/route.ts
│       ├── impacto/route.ts
│       └── admin/nodos/route.ts
├── components/
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── CafeteriaCard.tsx
│   ├── CafeteriasView.tsx
│   ├── TrazabilidadSearch.tsx
│   ├── TrazabilidadDetail.tsx            # Flow horizontal + timeline
│   ├── FincaSearch.tsx
│   ├── FincaDetail.tsx
│   ├── ImpactoView.tsx
│   └── AdminView.tsx
├── lib/
│   └── neo4j.ts                          # Singleton driver + runQuery + serializeValue
└── types/
    └── index.ts                          # Interfaces TypeScript del grafo
```

## Arquitectura

```
Browser (Client Component)
    ↓  fetch
API Route (app/api/.../route.ts)
    ↓  runQuery()
lib/neo4j.ts  →  Neo4j AuraDB
```

Los componentes del frontend nunca llaman a Neo4j directamente; todo pasa por las API Routes.

## Notas técnicas

- **Next.js 15:** `params` en Route Handlers y Pages es una `Promise` — siempre se debe `await params` antes de usar sus valores.
- **neo4j-driver 6.x:** Los enteros de Neo4j (Int64) se convierten automáticamente con `serializeValue()` en `lib/neo4j.ts`. Los nodos (`Node`) se deserializan a sus `.properties`.
- **Tailwind v4:** Usa `@import "tailwindcss"` en lugar de las directivas `@tailwind base/components/utilities`. El import de Google Fonts debe ir **antes** de este import.

## Licencia

MIT
