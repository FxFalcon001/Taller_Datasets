# Comidas Señor Salchicha · Food Truck Data Challenge

Proyecto del taller de datasets sintéticos. Food truck ficticio de perros calientes y salchipapas en Bogotá, con dos datasets relacionados, un sitio web en frontend puro y una campaña de tres emails.

## Cómo ejecutarlo en Visual Studio Code

El sitio usa `fetch` para leer los JSON, y `fetch` no funciona con el protocolo `file://`. **Hay que abrirlo con un servidor local**, de dos maneras:

**Opción A — extensión Live Server (la más rápida)**
1. Abre la carpeta `food-truck-data` en VS Code.
2. Instala la extensión *Live Server* (Ritwick Dey).
3. Clic derecho sobre `index.html` → **Open with Live Server**.

**Opción B — servidor de Python desde la terminal de VS Code**
```bash
cd food-truck-data
python -m http.server 5500
```
Luego abre `http://localhost:5500/index.html` en el navegador.

Si abres el archivo con doble clic verás un mensaje de error explicando esto mismo: es intencional, no es un bug.

## Estructura

```
food-truck-data/
├── index.html                  Página pública: portada, carta y los más pedidos
├── admin.html                  Panel del dueño: KPIs, rankings, alertas y proyección
├── css/
│   └── styles.css              Estilos únicos: variables, Flexbox, Grid y media queries
├── js/
│   ├── app.js                  Lógica del sitio público
│   └── admin.js                Cálculo de indicadores y render del panel
├── data/
│   ├── carta.json              15 platos con costos y stock
│   ├── carta.csv               El mismo dataset en CSV
│   ├── pedidos.json            132 líneas de pedido de agosto de 2026
│   ├── pedidos.csv             El mismo dataset en CSV
│   ├── generar_datasets.py     Generador con semilla fija (reproducible)
│   └── validar_y_analizar.py   Auditoría de calidad + análisis de consola
├── emails/
│   ├── email-01.html           Plato estrella
│   ├── email-02.html           Hora feliz
│   └── email-03.html           Categoría con oportunidad
├── ANALISIS.md                 Hallazgos, insights, recomendaciones y limitaciones
└── README.md
```

## Datasets

**`carta.json`** — 15 platos (mínimo exigido: 12).
`id_plato`, `plato`, `categoria`, `insumo_critico`, `stock_actual`, `costo`, `precio_venta`

**`pedidos.json`** — 132 registros de agosto de 2026 (mínimo exigido: 80).
`fecha`, `hora`, `id_plato`, `plato`, `cantidad`, `precio_unitario`, `total`

Los dos archivos se relacionan por `id_plato`. Para regenerarlos:

```bash
cd data
python generar_datasets.py     # vuelve a crear los 4 archivos con la misma semilla
python validar_y_analizar.py   # 11 comprobaciones de calidad + análisis
```

## Qué calcula el panel

Nada está escrito a mano en el HTML: los 5 KPIs, los dos rankings, las tablas, los gráficos y hasta la redacción de los hallazgos se generan en el navegador a partir de los dos JSON. Si cambias un dato en `carta.json`, el panel entero cambia solo.

- **KPIs:** ventas totales, ticket promedio, hora pico, plato más rentable, insumos por reponer.
- **Gráfico de franjas horarias:** columnas en CSS, con la hora pico y las horas flojas destacadas.
- **Ventas día a día:** gráfico de líneas dibujado con SVG a mano, sin librerías.
- **Rankings:** top 5 por ingresos, top 5 por utilidad, tabla completa de rentabilidad y peso por categoría.
- **Alertas de insumos:** tres niveles (crítico, bajo, vigilar) con cobertura estimada en días.
- **Proyección:** promedio diario × 7 días, con aviso de que es una estimación aritmética, más una columna que indica si el stock alcanza.

## Requisitos técnicos cumplidos

- HTML5 semántico (`header`, `nav`, `main`, `section`, `article`, `table`, `caption`, `footer`), atributos ARIA y `scope` en las tablas.
- CSS con variables, Flexbox, Grid, `clamp()` y media queries. Funciona desde 320 px.
- JavaScript con `fetch`, `async/await`, `try/catch`, `reduce`, `sort`, `map` y creación de nodos del DOM.
- Cero frameworks, cero librerías, cero errores de consola.
- Foco visible para navegación con teclado y `prefers-reduced-motion` respetado.

## Los tres emails

Cada uno usa un insight distinto del análisis, lleva asunto, preheader, título, cuerpo y un CTA que apunta a la carta. El insight que sustenta cada pieza está documentado en un comentario al inicio del archivo.

| Email | Insight que lo sustenta | CTA |
|---|---|---|
| 01 · Plato estrella | La Hamburguesa Salchichera es el plato más rentable: $270.000 de utilidad | Ver la carta completa |
| 02 · Hora feliz | Las franjas 15:00–17:00 valen 7,3 % de los ingresos frente al 21,9 % de las 19:00 | Elegir mi combo en la carta |
| 03 · Categoría con oportunidad | Maíz Pira con Queso tiene el mejor margen (64,3 %) con solo 11 unidades vendidas y 21 de stock | Ver las salchipapas en la carta |

## Aviso

Negocio, precios, pedidos y clientes son **ficticios**. Todos los datos fueron generados sintéticamente para este taller académico.
