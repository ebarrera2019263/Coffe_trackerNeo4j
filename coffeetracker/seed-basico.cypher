// ── SEED DATA — CoffeTracker ──
// Ejecuta este script en Neo4j Browser o Aura Query Editor
// después de que la instancia esté en estado "Running"

// ── Limpiar todo ──
MATCH (n) DETACH DELETE n;

// ── Productores ──
CREATE (:Productor {productor_id: 'PROD-001', nombre: 'Arturo Aguirre', tipo: 'Familiar', activo: true});
CREATE (:Productor {productor_id: 'PROD-002', nombre: 'Familia Vides',  tipo: 'Familiar', activo: true});
CREATE (:Productor {productor_id: 'PROD-003', nombre: 'Cooperativa Cajcoj', tipo: 'Cooperativa', activo: true});

// ── Fincas ──
CREATE (:Finca {finca_id: 'FINCA-001', nombre: 'El Injerto',            region: 'Huehuetenango', altitud_msnm: 1800, organica: true,  variedades_cultivadas: ['Bourbon Rosado', 'Maragogipe']});
CREATE (:Finca {finca_id: 'FINCA-002', nombre: 'Hacienda La Esperanza', region: 'Antigua',        altitud_msnm: 1580, organica: false, variedades_cultivadas: ['Caturra', 'Bourbon']});
CREATE (:Finca {finca_id: 'FINCA-003', nombre: 'Finca Santa Catalina',  region: 'Cobán',          altitud_msnm: 1350, organica: false, variedades_cultivadas: ['Pache', 'Catuaí']});

// ── Relaciones Productor → Finca ──
MATCH (p:Productor {productor_id:'PROD-001'}), (f:Finca {finca_id:'FINCA-001'}) CREATE (p)-[:CULTIVA]->(f);
MATCH (p:Productor {productor_id:'PROD-002'}), (f:Finca {finca_id:'FINCA-002'}) CREATE (p)-[:CULTIVA]->(f);
MATCH (p:Productor {productor_id:'PROD-003'}), (f:Finca {finca_id:'FINCA-003'}) CREATE (p)-[:CULTIVA]->(f);

// ── Fincas vecinas ──
MATCH (f1:Finca {finca_id:'FINCA-001'}), (f2:Finca {finca_id:'FINCA-002'})
CREATE (f1)-[:VECINA_DE {comparte_microclima: true}]->(f2);

// ── Lotes ──
CREATE (:Lote {lote_id: 'GT-HUE-2025-0412', codigo_lote: 'GT-HUE-2025-0412', proceso: 'lavado',  puntaje_sca: 91.5, notas_cata: ['Durazno','Jazmín','Panela','Bergamota'], fecha_cosecha: '2024-11-15', peso_kg: 320, humedad_pct: 11.2, defectos: 2});
CREATE (:Lote {lote_id: 'GT-ANT-2025-0089', codigo_lote: 'GT-ANT-2025-0089', proceso: 'natural', puntaje_sca: 87.0, notas_cata: ['Chocolate','Cereza','Caramelo'],          fecha_cosecha: '2024-10-22', peso_kg: 580, humedad_pct: 12.5, defectos: 5});
CREATE (:Lote {lote_id: 'GT-COB-2025-0233', codigo_lote: 'GT-COB-2025-0233', proceso: 'honey',   puntaje_sca: 85.5, notas_cata: ['Miel','Durazno','Toronja'],                 fecha_cosecha: '2024-12-05', peso_kg: 210, humedad_pct: 10.8, defectos: 7});

// ── Finca → Lote ──
MATCH (f:Finca {finca_id:'FINCA-001'}), (l:Lote {lote_id:'GT-HUE-2025-0412'}) CREATE (f)-[:PRODUJO]->(l);
MATCH (f:Finca {finca_id:'FINCA-002'}), (l:Lote {lote_id:'GT-ANT-2025-0089'}) CREATE (f)-[:PRODUJO]->(l);
MATCH (f:Finca {finca_id:'FINCA-003'}), (l:Lote {lote_id:'GT-COB-2025-0233'}) CREATE (f)-[:PRODUJO]->(l);

// ── Beneficios ──
CREATE (:Beneficio {beneficio_id:'BEN-001', nombre:'Beneficio El Injerto',    tipo:'Húmedo', municipio:'Huehuetenango'});
CREATE (:Beneficio {beneficio_id:'BEN-002', nombre:'Beneficio La Esperanza',  tipo:'Seco',   municipio:'Antigua Guatemala'});
CREATE (:Beneficio {beneficio_id:'BEN-003', nombre:'Centro de Acopio Cobán',  tipo:'Mixto',  municipio:'San Pedro Carchá'});

// ── Beneficio → Lote ──
MATCH (b:Beneficio {beneficio_id:'BEN-001'}), (l:Lote {lote_id:'GT-HUE-2025-0412'}) CREATE (b)-[:PROCESO]->(l);
MATCH (b:Beneficio {beneficio_id:'BEN-002'}), (l:Lote {lote_id:'GT-ANT-2025-0089'}) CREATE (b)-[:PROCESO]->(l);
MATCH (b:Beneficio {beneficio_id:'BEN-003'}), (l:Lote {lote_id:'GT-COB-2025-0233'}) CREATE (b)-[:PROCESO]->(l);

// ── Transportes ──
CREATE (:Transporte {transporte_id:'TRX-001', medio:'Camión refrigerado', fecha_salida:'2024-12-07', fecha_llegada:'2024-12-07', distancia_km: 265});
CREATE (:Transporte {transporte_id:'TRX-002', medio:'Camión',             fecha_salida:'2024-11-12', fecha_llegada:'2024-11-12', distancia_km: 45});
CREATE (:Transporte {transporte_id:'TRX-003', medio:'Camión',             fecha_salida:'2024-12-30', fecha_llegada:'2024-12-30', distancia_km: 212});

// ── Transporte → Lote ──
MATCH (t:Transporte {transporte_id:'TRX-001'}), (l:Lote {lote_id:'GT-HUE-2025-0412'}) CREATE (t)-[:TRANSPORTO]->(l);
MATCH (t:Transporte {transporte_id:'TRX-002'}), (l:Lote {lote_id:'GT-ANT-2025-0089'}) CREATE (t)-[:TRANSPORTO]->(l);
MATCH (t:Transporte {transporte_id:'TRX-003'}), (l:Lote {lote_id:'GT-COB-2025-0233'}) CREATE (t)-[:TRANSPORTO]->(l);

// ── Tostadores ──
CREATE (:Tostador {tostador_id:'TOST-001', nombre:'The Coffee Lab',       pais:'Guatemala', perfil_preferido:'Claro'});
CREATE (:Tostador {tostador_id:'TOST-002', nombre:'Fili Coffee Roasters', pais:'Guatemala', perfil_preferido:'Medio'});
CREATE (:Tostador {tostador_id:'TOST-003', nombre:'¡Cafecito! Specialty', pais:'Guatemala', perfil_preferido:'Medio-claro'});

// ── Tostador → Lote (COMPRO + TOSTO) ──
MATCH (t:Tostador {tostador_id:'TOST-001'}), (l:Lote {lote_id:'GT-HUE-2025-0412'}) CREATE (t)-[:COMPRO]->(l), (t)-[:TOSTO]->(l);
MATCH (t:Tostador {tostador_id:'TOST-002'}), (l:Lote {lote_id:'GT-ANT-2025-0089'}) CREATE (t)-[:COMPRO]->(l), (t)-[:TOSTO]->(l);
MATCH (t:Tostador {tostador_id:'TOST-003'}), (l:Lote {lote_id:'GT-COB-2025-0233'}) CREATE (t)-[:COMPRO]->(l), (t)-[:TOSTO]->(l);

// ── Cafeterías ──
CREATE (:Cafeteria {cafeteria_id:'CAFE-001', nombre:'Café de la Luna', ciudad:'Guatemala', tipo:'Especialidad', metodos_disponibles:['V60','Chemex'],        precio_promedio_taza: 48});
CREATE (:Cafeteria {cafeteria_id:'CAFE-002', nombre:'La Penúltima',    ciudad:'Guatemala', tipo:'Especialidad', metodos_disponibles:['Espresso','Aeropress'], precio_promedio_taza: 38});
CREATE (:Cafeteria {cafeteria_id:'CAFE-003', nombre:'Café Barista',    ciudad:'Cobán',     tipo:'Especialidad', metodos_disponibles:['V60','Espresso'],        precio_promedio_taza: 35});

// ── Cafetería → Lote ──
MATCH (c:Cafeteria {cafeteria_id:'CAFE-001'}), (l:Lote {lote_id:'GT-HUE-2025-0412'}) CREATE (c)-[:SIRVE]->(l);
MATCH (c:Cafeteria {cafeteria_id:'CAFE-002'}), (l:Lote {lote_id:'GT-ANT-2025-0089'}) CREATE (c)-[:SIRVE]->(l);
MATCH (c:Cafeteria {cafeteria_id:'CAFE-003'}), (l:Lote {lote_id:'GT-COB-2025-0233'}) CREATE (c)-[:SIRVE]->(l);

// ── Certificaciones ──
CREATE (:Certificacion {cert_id:'CERT-001', nombre:'Rainforest Alliance', entidad_emisora:'Rainforest Alliance'});
CREATE (:Certificacion {cert_id:'CERT-002', nombre:'Orgánico USDA',       entidad_emisora:'USDA'});
CREATE (:Certificacion {cert_id:'CERT-003', nombre:'Fair Trade',           entidad_emisora:'Fair Trade International'});
CREATE (:Certificacion {cert_id:'CERT-004', nombre:'Bird Friendly',        entidad_emisora:'Smithsonian'});

// ── Certificacion → Finca ──
MATCH (c:Certificacion {cert_id:'CERT-001'}), (f:Finca {finca_id:'FINCA-001'}) CREATE (c)-[:CERTIFICA]->(f);
MATCH (c:Certificacion {cert_id:'CERT-002'}), (f:Finca {finca_id:'FINCA-001'}) CREATE (c)-[:CERTIFICA]->(f);
MATCH (c:Certificacion {cert_id:'CERT-003'}), (f:Finca {finca_id:'FINCA-002'}) CREATE (c)-[:CERTIFICA]->(f);
MATCH (c:Certificacion {cert_id:'CERT-004'}), (f:Finca {finca_id:'FINCA-003'}) CREATE (c)-[:CERTIFICA]->(f);

// ── Verificar ──
MATCH (n) RETURN labels(n)[0] AS label, count(n) AS total ORDER BY total DESC;
