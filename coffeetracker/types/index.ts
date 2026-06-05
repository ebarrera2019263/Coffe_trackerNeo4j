export interface Cafeteria {
  cafeteria_id: string
  nombre: string
  ciudad: string
  tipo: string
  metodos_disponibles: string[]
  precio_promedio_taza: number
}

export interface Lote {
  lote_id: string
  codigo_lote: string
  proceso: string
  puntaje_sca: number
  notas_cata: string[]
  fecha_cosecha: string
}

export interface Finca {
  finca_id: string
  nombre: string
  region: string
  altitud_msnm: number
  organica: boolean
  variedades_cultivadas: string[]
}

export interface Productor {
  productor_id: string
  nombre: string
  tipo: string
  activo: boolean
}

export interface Tostador {
  tostador_id: string
  nombre: string
  pais: string
  perfil_preferido: string
}

export interface Beneficio {
  beneficio_id: string
  nombre: string
  tipo: string
  municipio: string
}

export interface Transporte {
  transporte_id: string
  medio: string
  fecha_salida: string
  fecha_llegada: string
  distancia_km: number
}

export interface Certificacion {
  cert_id: string
  nombre: string
  entidad_emisora: string
}

export interface TrazabilidadData {
  cafe: Cafeteria
  lote: Lote
  tostador: Tostador
  beneficio: Beneficio
  finca: Finca
  productor: Productor
  transportes: Transporte[]
  certificaciones: Certificacion[]
}

export interface FincaConCafeterias {
  finca: Finca
  lote: Lote
  cafeterias: Cafeteria[]
}

export interface ImpactoResult {
  finca_vecina: string
  cafeterias_afectadas: string[]
  lotes: number
}
