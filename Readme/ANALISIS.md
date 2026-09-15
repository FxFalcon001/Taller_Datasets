# Análisis ejecutivo · Comidas Señor Salchicha

**Periodo:** agosto de 2026 (31 días) · **Fuente:** `data/pedidos.json` (132 líneas de pedido) y `data/carta.json` (15 platos).
Todas las cifras de este documento se recalculan en vivo en `admin.html`; aquí quedan congeladas para la entrega.

---

## 1. Validación previa de los datos

Antes de analizar, se auditaron los dos datasets con `data/validar_y_analizar.py`. Once comprobaciones, todas aprobadas:

| Comprobación | Resultado |
|---|---|
| Mínimo 12 platos en la carta | 15 |
| Mínimo 80 registros de pedidos | 132 |
| `id_plato` único en la carta | Sin duplicados |
| Todo pedido existe en la carta | 132/132 |
| `precio_venta > costo` en todos los platos | 15/15 |
| `total = cantidad × precio_unitario` | 132/132 |
| Sin cantidades ni precios en cero o negativos | Correcto |
| Sin valores vacíos | Correcto |
| Todas las fechas del mismo mes | 2026-08 |
| Márgenes distintos entre platos | 15 valores diferentes |
| El precio del pedido coincide con el de la carta | 132/132 |

---

## 2. Métricas obligatorias

| Métrica | Valor |
|---|---|
| Ventas totales | $2.937.500 |
| Líneas de pedido | 132 |
| Unidades vendidas | 200 |
| Ticket promedio | $22.254 por línea |
| Utilidad total | $1.766.600 |
| Margen global | 60,1 % |
| Hora pico | 19:00 ($643.000 · 24 pedidos · 21,9 % del mes) |
| Franja más floja | 16:00 ($18.000 · 1 pedido) |
| Mejor día del mes | 18 de agosto ($250.000) |
| Plato más vendido | Gaseosa Personal 400ml (24 unidades) |
| Plato más rentable | Hamburguesa Salchichera ($270.000 de utilidad) |
| Mejor margen porcentual | Maíz Pira con Queso (64,3 %) |
| Insumos bajo el punto de reorden | 5 de 15 |

### Top 5 por ingresos

| # | Plato | Unidades | Ingresos |
|---|---|---|---|
| 1 | Hamburguesa Salchichera | 20 | $480.000 |
| 2 | Salchipapa Señor Salchicha | 23 | $437.000 |
| 3 | Salchipapa Clásica | 22 | $286.000 |
| 4 | Hamburguesa Doble Tocineta | 9 | $261.000 |
| 5 | Perro Ranchero | 13 | $214.500 |

### Top 5 por utilidad

| # | Plato | Utilidad del mes | Margen |
|---|---|---|---|
| 1 | Hamburguesa Salchichera | $270.000 | 56,3 % |
| 2 | Salchipapa Señor Salchicha | $269.100 | 61,6 % |
| 3 | Salchipapa Clásica | $180.400 | 63,1 % |
| 4 | Hamburguesa Doble Tocineta | $142.200 | 54,5 % |
| 5 | Perro Señor Salchicha | $132.000 | 62,9 % |

### Categorías

| Categoría | Ingresos | Participación | Margen |
|---|---|---|---|
| Salchipapas | $987.500 | 33,6 % | 62,1 % |
| Hamburguesas | $901.000 | 30,7 % | 56,1 % |
| Perros | $643.500 | 21,9 % | 61,6 % |
| Bebidas | $321.000 | 10,9 % | 61,4 % |
| Adiciones | $84.500 | 2,9 % | 63,1 % |

### Insumos con stock bajo

| Insumo | Plato | Stock | Consumo/día | Cobertura |
|---|---|---|---|---|
| Papa prefrita | Adición de Papa a la Francesa | 5 | 0,4 u | 11,9 días |
| Tocineta ahumada | Hamburguesa Doble Tocineta | 6 | 0,3 u | 20,7 días |
| Carne desmechada | Salchipapa Mixta Doble | 7 | 0,2 u | 36,2 días |
| Chorizo santarrosano | Choripán de la Casa | 8 | 0,3 u | 31,0 días |
| Tocineta ahumada | Perro Ranchero | 9 | 0,4 u | 21,5 días |

### Proyección de demanda · próxima semana

Estimación aritmética: promedio diario del mes × 7 días. **No es un modelo predictivo.**

| Indicador | Estimado |
|---|---|
| Ventas | $663.306 |
| Unidades | 45 |
| Líneas de pedido | 30 |
| Utilidad | $398.910 |

Platos con mayor demanda esperada: Gaseosa Personal 400ml (5,4 u), Salchipapa Señor Salchicha (5,2 u), Salchipapa Clásica (5,0 u), Hamburguesa Salchichera (4,5 u) y Perro Señor Salchicha (3,4 u).

---

## 3. Cinco hallazgos

1. El mes cerró en **$2.937.500** con 200 unidades vendidas y un ticket promedio de **$22.254** por línea de pedido.
2. La franja de las **19:00 es la hora pico**: 24 pedidos y el 21,9 % de los ingresos del mes. El segundo pico es a las 13:00.
3. **Gaseosa Personal 400ml es el producto más vendido** (24 unidades), pero solo aporta $79.200 de utilidad: el 4,5 % del total.
4. **Hamburguesa Salchichera es el plato más rentable** del mes, con $270.000 de utilidad y un margen de 56,3 %.
5. **Cinco insumos críticos están por debajo del punto de reorden** de 10 unidades, encabezados por la papa prefrita con 5 unidades.

## 4. Tres insights

1. **Volumen y rentabilidad no son lo mismo.** La gaseosa lidera en unidades porque acompaña a casi todos los pedidos, pero deja $3.300 por unidad; la Hamburguesa Salchichera deja $13.500. Optimizar la carta por unidades vendidas empujaría el negocio hacia el producto que menos deja.
2. **Hay capacidad de plancha ociosa en la tarde.** Entre las 15:00 y las 17:00 se factura apenas el 7,3 % del mes, mientras el pico de las 19:00 se lleva el 21,9 %. Esa franja ya está pagada en arriendo y personal: cualquier venta adicional ahí es casi toda utilidad.
3. **La categoría que más factura no es la que mejor margen deja.** Salchipapas lidera con 33,6 % de participación y 62,1 % de margen, mientras Hamburguesas factura casi lo mismo (30,7 %) con el margen más bajo de la carta (56,1 %). Dentro de Salchipapas, el Maíz Pira con Queso tiene el mejor margen del negocio (64,3 %) con solo 11 unidades vendidas y 21 de stock: alta rentabilidad y baja visibilidad.

## 5. Tres recomendaciones

1. **Subir la Hamburguesa Salchichera al primer bloque de la carta** y ofrecerla como sugerencia durante el pico de las 19:00, donde la demanda ya está garantizada y no hay que gastar en atraer gente.
2. **Lanzar la "Hora Señor Salchicha" de 3:00 a 5:00 p.m.** entre semana, con combo de bebida incluida, para mover la capacidad ociosa sin canibalizar el pico de la noche. Medir el efecto comparando la franja 15:00–17:00 contra este mes.
3. **Reponer hoy los cinco insumos en alerta y revisar el precio de la categoría Hamburguesas.** Factura bien pero deja 56,1 %, cuatro puntos por debajo del margen global de 60,1 %: un ajuste de $1.000 en la Doble Tocineta o una renegociación del costo de la tocineta cierra la brecha.

## 6. Limitaciones

- Los datos son **sintéticos**, generados con semilla fija (42). No representan un negocio real.
- La libreta cubre **un solo mes**, así que no se puede separar estacionalidad de tendencia.
- Cada registro es **una línea de pedido**, no un ticket completo: el ticket promedio real por cliente sería mayor.
- El `stock_actual` es una **foto del día del corte**, no un inventario con entradas y salidas.
- La proyección asume demanda estable y **no considera** clima, festivos, promociones ni competencia.

---

## Pregunta de control del taller

> ¿Por qué tu plato más vendido no es necesariamente el más rentable?

Porque el volumen se mide en unidades y la rentabilidad en pesos de utilidad. La gaseosa se vendió 24 veces, pero cada una deja $3.300, total $79.200. La Hamburguesa Salchichera se vendió 20 veces y deja $13.500 cada una, total $270.000: tres veces y media más con menos unidades. Un producto barato y de alta rotación puede llenar la libreta de pedidos sin mover la utilidad del mes.
