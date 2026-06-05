// ── SEED DATA (GRANDE) — CoffeTracker ──
// ~100 Productores, Fincas, Lotes y Cafeterías + 50 Beneficios/Transportes/Tostadores.
// Generado con UNWIND + range() para mantener el archivo compacto.
// Ejecuta en Neo4j Browser, Aura Query Editor o:
//   docker exec -i coffeetracker-neo4j cypher-shell -u neo4j -p coffeetracker123 < seed.cypher

// ── Limpiar todo ──
// ── Limpiar SOLO los nodos de CoffeTracker (preserva otros proyectos en la BD) ──
MATCH (n) WHERE any(l IN labels(n) WHERE l IN ['Cafeteria','Finca','Lote','Productor','Tostador','Beneficio','Transporte','Certificacion']) DETACH DELETE n;

// ── Productores (100) ──
UNWIND range(1,100) AS i
WITH i,
     ['Arturo','María','José','Ana','Luis','Carla','Pedro','Sofía','Juan','Lucía','Carlos','Elena','Diego','Marta','Roberto','Andrea','Fernando','Gabriela','Manuel','Patricia'] AS fn,
     ['Aguirre','Vides','García','López','Méndez','Castillo','Ramírez','Hernández','Morales','Vásquez','Díaz','Rodríguez','Pérez','Gómez','Santos','Flores','Reyes','Cruz','Ortiz','Marroquín'] AS ln
CREATE (:Productor {
  productor_id: 'PROD-' + right('000' + toString(i), 3),
  nombre: fn[i % 20] + ' ' + ln[(i * 3) % 20],
  tipo: CASE i % 3 WHEN 0 THEN 'Cooperativa' ELSE 'Familiar' END,
  activo: i % 11 <> 0
});

// ── Fincas (100) ──
UNWIND range(1,100) AS i
WITH i,
     ['Huehuetenango','Antigua','Cobán','Atitlán','Fraijanes','San Marcos','Acatenango','Oriente'] AS regs,
     ['El Injerto','La Esperanza','Santa Catalina','El Paraíso','Buena Vista','La Soledad','El Socorro','Las Nubes','San Rafael','El Pilar','La Bendición','Los Ausoles','El Carmen','San José','La Providencia','El Rosario','Las Brisas','San Antonio','La Joya','El Mirador'] AS nombres,
     ['Bourbon','Caturra','Catuaí','Pache','Typica','Geisha','Maragogipe','Pacamara'] AS vars
CREATE (:Finca {
  finca_id: 'FINCA-' + right('000' + toString(i), 3),
  nombre: nombres[i % 20] + ' ' + toString(i),
  region: regs[i % 8],
  altitud_msnm: 1200 + (i * 7) % 800,
  organica: i % 3 = 0,
  variedades_cultivadas: [vars[i % 8], vars[(i + 4) % 8]]
});

// ── Productor i → CULTIVA → Finca i ──
UNWIND range(1,100) AS i
MATCH (p:Productor {productor_id: 'PROD-' + right('000' + toString(i), 3)}),
      (f:Finca {finca_id: 'FINCA-' + right('000' + toString(i), 3)})
CREATE (p)-[:CULTIVA]->(f);

// ── Fincas vecinas (misma región: i e i+8) con microclima compartido ──
UNWIND range(1,92) AS i
MATCH (a:Finca {finca_id: 'FINCA-' + right('000' + toString(i), 3)}),
      (b:Finca {finca_id: 'FINCA-' + right('000' + toString(i + 8), 3)})
CREATE (a)-[:VECINA_DE {comparte_microclima: i % 2 = 0}]->(b);

// ── Lotes (100) — uno por finca ──
UNWIND range(1,100) AS i
WITH i,
     ['Huehuetenango','Antigua','Cobán','Atitlán','Fraijanes','San Marcos','Acatenango','Oriente'] AS regs,
     ['lavado','natural','honey'] AS procesos,
     ['Durazno','Jazmín','Panela','Bergamota','Chocolate','Cereza','Caramelo','Miel','Toronja','Manzana','Floral','Nuez','Vainilla','Cítrico'] AS notas
WITH i, regs, procesos, notas, toUpper(left(regs[i % 8], 3)) AS rcode
CREATE (:Lote {
  lote_id: 'GT-' + rcode + '-2025-' + right('000' + toString(i), 4),
  codigo_lote: 'GT-' + rcode + '-2025-' + right('000' + toString(i), 4),
  proceso: procesos[i % 3],
  puntaje_sca: 80.0 + toFloat(i % 12) + toFloat(i % 2) * 0.5,
  notas_cata: [notas[i % 14], notas[(i + 5) % 14], notas[(i + 9) % 14]],
  fecha_cosecha: '2024-' + right('0' + toString((i % 12) + 1), 2) + '-' + right('0' + toString((i % 28) + 1), 2),
  peso_kg: 150 + (i * 5) % 500,
  humedad_pct: 10.0 + toFloat(i % 30) / 10.0,
  defectos: i % 10
});

// ── Finca i → PRODUJO → Lote i ──
UNWIND range(1,100) AS i
WITH i, ['Huehuetenango','Antigua','Cobán','Atitlán','Fraijanes','San Marcos','Acatenango','Oriente'] AS regs
WITH i, toUpper(left(regs[i % 8], 3)) AS rcode
MATCH (f:Finca {finca_id: 'FINCA-' + right('000' + toString(i), 3)}),
      (l:Lote {lote_id: 'GT-' + rcode + '-2025-' + right('000' + toString(i), 4)})
CREATE (f)-[:PRODUJO]->(l);

// ── Beneficios (50) ──
UNWIND range(1,50) AS i
WITH i,
     ['Húmedo','Seco','Mixto'] AS tipos,
     ['Huehuetenango','Antigua Guatemala','San Pedro Carchá','Sololá','Fraijanes','San Marcos','Acatenango','Jalapa'] AS muni
CREATE (:Beneficio {
  beneficio_id: 'BEN-' + right('00' + toString(i), 3),
  nombre: 'Beneficio ' + ['El Injerto','La Esperanza','Cobán','Atitlán','Los Ausoles','San Marcos','El Carmen','La Joya'][i % 8] + ' ' + toString(i),
  tipo: tipos[i % 3],
  municipio: muni[i % 8]
});

// ── Beneficio (rotando 50) → PROCESO → Lote i ──
UNWIND range(1,100) AS i
WITH i, ['Huehuetenango','Antigua','Cobán','Atitlán','Fraijanes','San Marcos','Acatenango','Oriente'] AS regs
WITH i, toUpper(left(regs[i % 8], 3)) AS rcode, ((i - 1) % 50) + 1 AS bid
MATCH (b:Beneficio {beneficio_id: 'BEN-' + right('00' + toString(bid), 3)}),
      (l:Lote {lote_id: 'GT-' + rcode + '-2025-' + right('000' + toString(i), 4)})
CREATE (b)-[:PROCESO]->(l);

// ── Transportes (50) ──
UNWIND range(1,50) AS i
WITH i, ['Camión refrigerado','Camión','Pickup'] AS medios
CREATE (:Transporte {
  transporte_id: 'TRX-' + right('00' + toString(i), 3),
  medio: medios[i % 3],
  fecha_salida: '2024-' + right('0' + toString((i % 12) + 1), 2) + '-' + right('0' + toString((i % 27) + 1), 2),
  fecha_llegada: '2024-' + right('0' + toString((i % 12) + 1), 2) + '-' + right('0' + toString((i % 27) + 2), 2),
  distancia_km: 30 + (i * 11) % 300
});

// ── Transporte (rotando 50) → TRANSPORTO → Lote i ──
UNWIND range(1,100) AS i
WITH i, ['Huehuetenango','Antigua','Cobán','Atitlán','Fraijanes','San Marcos','Acatenango','Oriente'] AS regs
WITH i, toUpper(left(regs[i % 8], 3)) AS rcode, ((i - 1) % 50) + 1 AS tid
MATCH (t:Transporte {transporte_id: 'TRX-' + right('00' + toString(tid), 3)}),
      (l:Lote {lote_id: 'GT-' + rcode + '-2025-' + right('000' + toString(i), 4)})
CREATE (t)-[:TRANSPORTO]->(l);

// ── Tostadores (50) ──
UNWIND range(1,50) AS i
WITH i,
     ['Claro','Medio','Medio-claro','Oscuro'] AS perfiles,
     ['The Coffee Lab','Fili Coffee Roasters','¡Cafecito! Specialty','Bourbon Roasters','Origen Tostadores','Cumbre Coffee','Quetzal Roasting','Madre Tostaduría'] AS nombres
CREATE (:Tostador {
  tostador_id: 'TOST-' + right('00' + toString(i), 3),
  nombre: nombres[i % 8] + ' ' + toString(i),
  pais: 'Guatemala',
  perfil_preferido: perfiles[i % 4]
});

// ── Tostador (rotando 50) → COMPRO + TOSTO → Lote i ──
UNWIND range(1,100) AS i
WITH i, ['Huehuetenango','Antigua','Cobán','Atitlán','Fraijanes','San Marcos','Acatenango','Oriente'] AS regs
WITH i, toUpper(left(regs[i % 8], 3)) AS rcode, ((i - 1) % 50) + 1 AS toid
MATCH (t:Tostador {tostador_id: 'TOST-' + right('00' + toString(toid), 3)}),
      (l:Lote {lote_id: 'GT-' + rcode + '-2025-' + right('000' + toString(i), 4)})
CREATE (t)-[:COMPRO]->(l), (t)-[:TOSTO]->(l);

// ── Cafeterías (100) ──
UNWIND range(1,100) AS i
WITH i,
     ['Guatemala','Cobán','Quetzaltenango','Antigua','Huehuetenango','Flores','Escuintla'] AS ciudades,
     ['Especialidad','Tradicional'] AS tipos,
     ['V60','Chemex','Espresso','Aeropress','Prensa francesa','Sifón'] AS metodos,
     ['Café de la Luna','La Penúltima','Café Barista','El Cafetal','Bourbon Coffee','Cerro Alto','Grano de Oro','La Taza','Café Quetzal','Antigua Brew','El Péndulo','Café Loft','Origen','Barra Norte','Tinto','El Filtro','Casa Café','La Cuchara','Madre Café','Cumbre'] AS nombres
CREATE (:Cafeteria {
  cafeteria_id: 'CAFE-' + right('000' + toString(i), 3),
  nombre: nombres[i % 20] + ' ' + toString(i),
  ciudad: ciudades[i % 7],
  tipo: tipos[i % 2],
  metodos_disponibles: [metodos[i % 6], metodos[(i + 2) % 6]],
  precio_promedio_taza: 25 + (i * 3) % 30
});

// ── Cafetería i → SIRVE → Lote i  (y un segundo lote cruzado) ──
UNWIND range(1,100) AS i
WITH i, ['Huehuetenango','Antigua','Cobán','Atitlán','Fraijanes','San Marcos','Acatenango','Oriente'] AS regs
WITH i, regs, toUpper(left(regs[i % 8], 3)) AS rcode, ((i + 49) % 100) + 1 AS j
WITH i, rcode, j, toUpper(left(regs[j % 8], 3)) AS rcode2
MATCH (c:Cafeteria {cafeteria_id: 'CAFE-' + right('000' + toString(i), 3)}),
      (l1:Lote {lote_id: 'GT-' + rcode + '-2025-' + right('000' + toString(i), 4)}),
      (l2:Lote {lote_id: 'GT-' + rcode2 + '-2025-' + right('000' + toString(j), 4)})
CREATE (c)-[:SIRVE]->(l1), (c)-[:SIRVE]->(l2);

// ── Certificaciones (4) ──
CREATE (:Certificacion {cert_id:'CERT-001', nombre:'Rainforest Alliance', entidad_emisora:'Rainforest Alliance'});
CREATE (:Certificacion {cert_id:'CERT-002', nombre:'Orgánico USDA',       entidad_emisora:'USDA'});
CREATE (:Certificacion {cert_id:'CERT-003', nombre:'Fair Trade',          entidad_emisora:'Fair Trade International'});
CREATE (:Certificacion {cert_id:'CERT-004', nombre:'Bird Friendly',       entidad_emisora:'Smithsonian'});

// ── Certificacion (rotando 4) → CERTIFICA → Finca i ──
UNWIND range(1,100) AS i
WITH i, (i % 4) + 1 AS cid
MATCH (c:Certificacion {cert_id: 'CERT-' + right('00' + toString(cid), 3)}),
      (f:Finca {finca_id: 'FINCA-' + right('000' + toString(i), 3)})
CREATE (c)-[:CERTIFICA]->(f);

// ── Verificar ──
MATCH (n) RETURN labels(n)[0] AS label, count(n) AS total ORDER BY total DESC;
