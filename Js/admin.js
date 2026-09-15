/* =============================================================================
   Comidas Señor Salchicha — panel del dueño
   Todo se calcula en el navegador a partir de los dos datasets.
   JavaScript puro: fetch, async/await, try/catch, reduce, sort, DOM y SVG.
   ============================================================================= */
'use strict';

/* ------------------------------ configuración ----------------------------- */

const PUNTO_REORDEN = 10;   // unidades de insumo por debajo de las cuales se alerta
const DIAS_PROYECCION = 7;  // horizonte de la estimación

/* ------------------------------- utilidades ------------------------------- */

const fmtPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
});
const fmtNumero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

const aPesos = (n) => fmtPesos.format(Math.round(n));
const aNumero = (n) => fmtNumero.format(n);
const aPorcentaje = (n) => `${fmtNumero.format(n)} %`;

function crear(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

/** Une una lista en español: ["a","b","c"] → "a, b y c". */
function unirLista(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

async function traerJSON(ruta) {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) throw new Error(`No se pudo leer ${ruta} (HTTP ${respuesta.status})`);
  return respuesta.json();
}

/* ================================ ANÁLISIS ================================= */

/**
 * Construye el objeto de análisis completo a partir de los dos datasets.
 * Es la única función que hace cuentas; el resto solo pinta.
 */
function analizar(carta, pedidos) {
  /* --- totales generales --- */
  const ventasTotales = pedidos.reduce((suma, p) => suma + p.total, 0);
  const unidades = pedidos.reduce((suma, p) => suma + p.cantidad, 0);
  const ticketPromedio = ventasTotales / pedidos.length;

  const fechas = pedidos.map((p) => p.fecha).sort();
  const diasConVenta = new Set(fechas).size;
  const diasDelMes = new Date(
    Number(fechas[0].slice(0, 4)),
    Number(fechas[0].slice(5, 7)),
    0
  ).getDate();

  /* --- agregado por plato --- */
  const acumulado = pedidos.reduce((mapa, p) => {
    const item = mapa.get(p.id_plato) || { unidades: 0, ingresos: 0 };
    item.unidades += p.cantidad;
    item.ingresos += p.total;
    mapa.set(p.id_plato, item);
    return mapa;
  }, new Map());

  const platos = carta.map((plato) => {
    const datos = acumulado.get(plato.id_plato) || { unidades: 0, ingresos: 0 };
    const utilidadUnitaria = plato.precio_venta - plato.costo;
    const unidadesDia = datos.unidades / diasDelMes;
    return {
      ...plato,
      unidades: datos.unidades,
      ingresos: datos.ingresos,
      utilidadUnitaria,
      utilidadTotal: utilidadUnitaria * datos.unidades,
      margen: (utilidadUnitaria / plato.precio_venta) * 100,
      unidadesDia,
      demandaSemana: unidadesDia * DIAS_PROYECCION,
      ingresoSemana: unidadesDia * DIAS_PROYECCION * plato.precio_venta,
      coberturaDias: unidadesDia > 0 ? plato.stock_actual / unidadesDia : Infinity,
    };
  });

  const porIngresos = [...platos].sort((a, b) => b.ingresos - a.ingresos);
  const porUtilidad = [...platos].sort((a, b) => b.utilidadTotal - a.utilidadTotal);
  const porUnidades = [...platos].sort((a, b) => b.unidades - a.unidades);
  const porMargen = [...platos].sort((a, b) => b.margen - a.margen);

  const utilidadTotal = platos.reduce((s, p) => s + p.utilidadTotal, 0);

  /* --- franjas horarias --- */
  const mapaHoras = pedidos.reduce((mapa, p) => {
    const hora = p.hora.slice(0, 2);
    const item = mapa.get(hora) || { hora, pedidos: 0, ingresos: 0, unidades: 0 };
    item.pedidos += 1;
    item.ingresos += p.total;
    item.unidades += p.cantidad;
    mapa.set(hora, item);
    return mapa;
  }, new Map());

  const horas = [...mapaHoras.values()].sort((a, b) => a.hora.localeCompare(b.hora));
  const horaPico = [...horas].sort((a, b) => b.ingresos - a.ingresos)[0];
  const horaFloja = [...horas].sort((a, b) => a.ingresos - b.ingresos)[0];

  /* --- días --- */
  const mapaDias = pedidos.reduce((mapa, p) => {
    mapa.set(p.fecha, (mapa.get(p.fecha) || 0) + p.total);
    return mapa;
  }, new Map());
  const dias = [...mapaDias.entries()]
    .map(([fecha, ingresos]) => ({ fecha, ingresos }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const mejorDia = [...dias].sort((a, b) => b.ingresos - a.ingresos)[0];

  /* --- categorías --- */
  const mapaCategorias = platos.reduce((mapa, p) => {
    const item = mapa.get(p.categoria)
      || { categoria: p.categoria, ingresos: 0, utilidad: 0, unidades: 0 };
    item.ingresos += p.ingresos;
    item.utilidad += p.utilidadTotal;
    item.unidades += p.unidades;
    mapa.set(p.categoria, item);
    return mapa;
  }, new Map());

  const categorias = [...mapaCategorias.values()]
    .map((c) => ({
      ...c,
      participacion: (c.ingresos / ventasTotales) * 100,
      margen: c.ingresos ? (c.utilidad / c.ingresos) * 100 : 0,
    }))
    .sort((a, b) => b.ingresos - a.ingresos);

  /* --- insumos --- */
  const insumos = platos
    .map((p) => ({
      insumo: p.insumo_critico,
      plato: p.plato,
      stock: p.stock_actual,
      unidadesDia: p.unidadesDia,
      cobertura: p.coberturaDias,
      demandaSemana: p.demandaSemana,
      estado: p.stock_actual < 6 ? 'critico'
        : p.stock_actual < PUNTO_REORDEN ? 'bajo'
          : p.stock_actual < 15 ? 'vigilar' : 'ok',
    }))
    .sort((a, b) => a.stock - b.stock);

  const insumosEnAlerta = insumos.filter((i) => i.estado === 'critico' || i.estado === 'bajo');

  /* --- proyección simple --- */
  const proyeccion = {
    ventas: (ventasTotales / diasDelMes) * DIAS_PROYECCION,
    unidades: (unidades / diasDelMes) * DIAS_PROYECCION,
    pedidos: (pedidos.length / diasDelMes) * DIAS_PROYECCION,
    utilidad: (utilidadTotal / diasDelMes) * DIAS_PROYECCION,
  };

  return {
    periodo: { inicio: fechas[0], fin: fechas[fechas.length - 1], diasDelMes, diasConVenta },
    ventasTotales, unidades, ticketPromedio, utilidadTotal,
    margenGlobal: (utilidadTotal / ventasTotales) * 100,
    totalPedidos: pedidos.length,
    platos, porIngresos, porUtilidad, porUnidades, porMargen,
    horas, horaPico, horaFloja, dias, mejorDia,
    categorias, insumos, insumosEnAlerta, proyeccion,
  };
}

/* ================================= RENDER ================================== */

function pintarPeriodo(a) {
  const mes = new Date(`${a.periodo.inicio}T12:00:00`)
    .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  document.getElementById('periodo-analizado').textContent =
    `Periodo analizado: ${mes} · ${a.totalPedidos} líneas de pedido en ` +
    `${a.periodo.diasConVenta} días con venta.`;
}

function pintarKPIs(a) {
  const contenedor = document.getElementById('kpis');
  const tarjetas = [
    {
      nombre: 'Ventas totales del mes',
      valor: aPesos(a.ventasTotales),
      apoyo: `${a.unidades} unidades en ${a.totalPedidos} líneas`,
      destacado: true,
    },
    {
      nombre: 'Ticket promedio',
      valor: aPesos(a.ticketPromedio),
      apoyo: 'Por línea de pedido registrada',
    },
    {
      nombre: 'Hora pico',
      valor: `${a.horaPico.hora}:00`,
      apoyo: `${aPesos(a.horaPico.ingresos)} · ${a.horaPico.pedidos} pedidos`,
    },
    {
      nombre: 'Plato más rentable',
      valor: a.porUtilidad[0].plato,
      apoyo: `${aPesos(a.porUtilidad[0].utilidadTotal)} de utilidad · margen ${aPorcentaje(a.porUtilidad[0].margen)}`,
    },
    {
      nombre: 'Insumos por reponer',
      valor: String(a.insumosEnAlerta.length),
      apoyo: `Bajo el punto de reorden de ${PUNTO_REORDEN} unidades`,
    },
  ];

  contenedor.textContent = '';
  tarjetas.forEach((t) => {
    const art = crear('article', `kpi${t.destacado ? ' kpi--destacado' : ''}`);
    art.append(
      crear('p', 'kpi__nombre', t.nombre),
      crear('p', 'kpi__valor', t.valor),
      crear('p', 'kpi__apoyo', t.apoyo)
    );
    contenedor.append(art);
  });
}

function pintarHoras(a) {
  const contenedor = document.getElementById('grafico-horas');
  contenedor.textContent = '';
  const maximo = Math.max(...a.horas.map((h) => h.ingresos));

  a.horas.forEach((h) => {
    let clase = 'hora-col';
    if (h.hora === a.horaPico.hora) clase += ' hora-col--pico';
    else if (h.ingresos <= maximo * 0.15) clase += ' hora-col--valle';

    const columna = crear('div', clase);
    columna.title = `${h.hora}:00 · ${aPesos(h.ingresos)} · ${h.pedidos} pedidos`;

    const barra = crear('div', 'hora-col__barra');
    barra.style.height = `${Math.max((h.ingresos / maximo) * 100, 2)}%`;

    columna.append(barra, crear('span', 'hora-col__etiqueta', h.hora));
    contenedor.append(columna);
  });

  const valle = a.horas.filter((h) => h.ingresos <= maximo * 0.25);
  document.getElementById('resumen-horas').textContent =
    `La franja de ${a.horaPico.hora}:00 concentra ` +
    `${aPorcentaje((a.horaPico.ingresos / a.ventasTotales) * 100)} de las ventas del mes. ` +
    `Las horas flojas (${unirLista(valle.map((h) => `${h.hora}:00`))}) suman apenas ` +
    `${aPorcentaje((valle.reduce((s, h) => s + h.ingresos, 0) / a.ventasTotales) * 100)}.`;
}

/** Gráfico de líneas dibujado a mano con SVG, sin librerías. */
function pintarDias(a) {
  const contenedor = document.getElementById('grafico-dias');
  contenedor.textContent = '';

  const ancho = 860;
  const alto = 240;
  const margen = { arriba: 16, derecha: 12, abajo: 28, izquierda: 62 };
  const areaAncho = ancho - margen.izquierda - margen.derecha;
  const areaAlto = alto - margen.arriba - margen.abajo;

  const maximo = Math.max(...a.dias.map((d) => d.ingresos));
  const promedio = a.dias.reduce((s, d) => s + d.ingresos, 0) / a.dias.length;

  const x = (i) => margen.izquierda + (i / (a.dias.length - 1)) * areaAncho;
  const y = (v) => margen.arriba + areaAlto - (v / maximo) * areaAlto;

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  svg.setAttribute('class', 'linea-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label',
    `Ventas diarias del mes. Máximo ${aPesos(maximo)} el ${a.mejorDia.fecha}.`);

  const nodo = (tipo, atributos) => {
    const el = document.createElementNS(ns, tipo);
    Object.entries(atributos).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  // Rejilla horizontal con etiquetas
  [0, 0.25, 0.5, 0.75, 1].forEach((paso) => {
    const valor = maximo * paso;
    svg.append(nodo('line', {
      x1: margen.izquierda, x2: ancho - margen.derecha,
      y1: y(valor), y2: y(valor),
      stroke: '#e6dcc7', 'stroke-width': 1,
    }));
    const texto = nodo('text', {
      x: margen.izquierda - 8, y: y(valor) + 4,
      'text-anchor': 'end', 'font-size': 11, fill: '#7a6e5d',
    });
    texto.textContent = aPesos(valor);
    svg.append(texto);
  });

  // Línea de promedio
  svg.append(nodo('line', {
    x1: margen.izquierda, x2: ancho - margen.derecha,
    y1: y(promedio), y2: y(promedio),
    stroke: '#5f8b3a', 'stroke-width': 2, 'stroke-dasharray': '6 5',
  }));

  // Serie de ventas
  const puntos = a.dias.map((d, i) => `${x(i)},${y(d.ingresos)}`).join(' ');
  svg.append(nodo('polyline', {
    points: puntos, fill: 'none',
    stroke: '#d6402e', 'stroke-width': 2.5,
    'stroke-linejoin': 'round', 'stroke-linecap': 'round',
  }));

  a.dias.forEach((d, i) => {
    const punto = nodo('circle', {
      cx: x(i), cy: y(d.ingresos), r: d.fecha === a.mejorDia.fecha ? 5 : 3,
      fill: d.fecha === a.mejorDia.fecha ? '#191512' : '#d6402e',
    });
    const titulo = document.createElementNS(ns, 'title');
    titulo.textContent = `${d.fecha}: ${aPesos(d.ingresos)}`;
    punto.append(titulo);
    svg.append(punto);

    // Etiqueta del día cada 4 puntos para no saturar el eje
    if (i % 4 === 0 || i === a.dias.length - 1) {
      const texto = nodo('text', {
        x: x(i), y: alto - 8, 'text-anchor': 'middle',
        'font-size': 11, fill: '#7a6e5d',
      });
      texto.textContent = d.fecha.slice(8);
      svg.append(texto);
    }
  });

  contenedor.append(svg);
}

function pintarBarras(idContenedor, items, colorClase) {
  const contenedor = document.getElementById(idContenedor);
  contenedor.textContent = '';
  const maximo = Math.max(...items.map((i) => i.valor));

  items.forEach((item) => {
    const fila = crear('div', 'barra-item');

    const cabeza = crear('div', 'barra-item__cabeza');
    cabeza.append(
      crear('span', 'barra-item__nombre', item.nombre),
      crear('span', 'barra-item__valor', item.texto)
    );

    const pista = crear('div', 'barra-item__pista');
    const relleno = crear('div', `barra-item__relleno${colorClase ? ` ${colorClase}` : ''}`);
    relleno.style.width = `${(item.valor / maximo) * 100}%`;
    pista.append(relleno);

    fila.append(cabeza, pista);
    contenedor.append(fila);
  });
}

function pintarRankings(a) {
  pintarBarras('top-ingresos', a.porIngresos.slice(0, 5).map((p) => ({
    nombre: p.plato, valor: p.ingresos,
    texto: `${aPesos(p.ingresos)} · ${p.unidades} u`,
  })));

  pintarBarras('top-utilidad', a.porUtilidad.slice(0, 5).map((p) => ({
    nombre: p.plato, valor: p.utilidadTotal,
    texto: `${aPesos(p.utilidadTotal)} · ${aPorcentaje(p.margen)}`,
  })), 'barra-item__relleno--aji');

  pintarBarras('categorias', a.categorias.map((c) => ({
    nombre: c.categoria, valor: c.ingresos,
    texto: `${aPesos(c.ingresos)} · ${aPorcentaje(c.participacion)}`,
  })), 'barra-item__relleno--tomate');

  const cuerpo = document.querySelector('#tabla-platos tbody');
  cuerpo.textContent = '';
  a.porUtilidad.forEach((p) => {
    const fila = document.createElement('tr');
    const nombre = crear('th', null, p.plato);
    nombre.setAttribute('scope', 'row');
    fila.append(
      nombre,
      crear('td', null, p.categoria),
      crear('td', 'num', String(p.unidades)),
      crear('td', 'num', aPesos(p.ingresos)),
      crear('td', 'num', aPesos(p.utilidadTotal)),
      crear('td', 'num', aPorcentaje(p.margen))
    );
    cuerpo.append(fila);
  });
}

function pintarInsumos(a) {
  const resumen = document.getElementById('alertas-resumen');
  resumen.textContent = '';

  if (a.insumosEnAlerta.length) {
    const aviso = crear('div', 'aviso');
    aviso.append(crear('strong', null, `${a.insumosEnAlerta.length} insumos por debajo del punto de reorden. `));
    aviso.append(document.createTextNode(
      `El más urgente es ${a.insumosEnAlerta[0].insumo} (${a.insumosEnAlerta[0].stock} unidades, ` +
      `cobertura estimada de ${aNumero(a.insumosEnAlerta[0].cobertura)} días).`
    ));
    resumen.append(aviso);
  }

  const etiquetas = { critico: 'Crítico', bajo: 'Bajo', vigilar: 'Vigilar', ok: 'Suficiente' };
  const cuerpo = document.querySelector('#tabla-insumos tbody');
  cuerpo.textContent = '';

  a.insumos.forEach((i) => {
    const fila = document.createElement('tr');
    const nombre = crear('th', null, i.insumo);
    nombre.setAttribute('scope', 'row');

    const celdaEstado = crear('td');
    const pastilla = crear('span', `pastilla pastilla--${i.estado === 'ok' ? 'vigilar' : i.estado}`,
      etiquetas[i.estado]);
    celdaEstado.append(pastilla);

    fila.append(
      nombre,
      crear('td', null, i.plato),
      crear('td', 'num', String(i.stock)),
      crear('td', 'num', aNumero(i.unidadesDia)),
      crear('td', 'num', Number.isFinite(i.cobertura) ? `${aNumero(i.cobertura)} días` : 'sin consumo'),
      celdaEstado
    );
    cuerpo.append(fila);
  });
}

function pintarProyeccion(a) {
  const contenedor = document.getElementById('kpis-proyeccion');
  contenedor.textContent = '';

  [
    { nombre: 'Ventas estimadas', valor: aPesos(a.proyeccion.ventas), apoyo: 'Próximos 7 días' },
    { nombre: 'Unidades estimadas', valor: aNumero(a.proyeccion.unidades), apoyo: 'Para planear la compra' },
    { nombre: 'Pedidos estimados', valor: aNumero(a.proyeccion.pedidos), apoyo: 'Líneas de pedido' },
    { nombre: 'Utilidad estimada', valor: aPesos(a.proyeccion.utilidad), apoyo: `Margen actual ${aPorcentaje(a.margenGlobal)}` },
  ].forEach((t) => {
    const art = crear('article', 'kpi');
    art.append(
      crear('p', 'kpi__nombre', t.nombre),
      crear('p', 'kpi__valor', t.valor),
      crear('p', 'kpi__apoyo', t.apoyo)
    );
    contenedor.append(art);
  });

  const cuerpo = document.querySelector('#tabla-proyeccion tbody');
  cuerpo.textContent = '';

  [...a.platos]
    .sort((x, y) => y.demandaSemana - x.demandaSemana)
    .forEach((p) => {
      const fila = document.createElement('tr');
      const nombre = crear('th', null, p.plato);
      nombre.setAttribute('scope', 'row');

      const alcanza = p.stock_actual >= p.demandaSemana;
      const celdaStock = crear('td');
      celdaStock.append(crear(
        'span',
        `pastilla pastilla--${alcanza ? 'vigilar' : 'critico'}`,
        alcanza ? `Sí (${p.stock_actual} u)` : `No, faltan ${Math.ceil(p.demandaSemana - p.stock_actual)} u`
      ));

      fila.append(
        nombre,
        crear('td', 'num', String(p.unidades)),
        crear('td', 'num', aNumero(p.demandaSemana)),
        crear('td', 'num', aPesos(p.ingresoSemana)),
        celdaStock
      );
      cuerpo.append(fila);
    });
}

/* Hallazgos, insights y recomendaciones: redactados con las cifras reales. */
function pintarConclusiones(a) {
  const masVendido = a.porUnidades[0];
  const masRentable = a.porUtilidad[0];
  const mejorMargen = a.porMargen[0];
  const categoriaLider = a.categorias[0];
  const categoriaMenorMargen = [...a.categorias].sort((x, y) => x.margen - y.margen)[0];
  const horasFlojas = a.horas
    .filter((h) => h.ingresos <= Math.max(...a.horas.map((x) => x.ingresos)) * 0.25)
    .map((h) => `${h.hora}:00`);

  const hallazgos = [
    `El mes cerró en ${aPesos(a.ventasTotales)} con ${a.unidades} unidades vendidas y un ticket promedio de ${aPesos(a.ticketPromedio)} por línea de pedido.`,
    `La franja de ${a.horaPico.hora}:00 es la hora pico: ${a.horaPico.pedidos} pedidos y ${aPorcentaje((a.horaPico.ingresos / a.ventasTotales) * 100)} de los ingresos del mes.`,
    `${masVendido.plato} es el producto más vendido (${masVendido.unidades} unidades), pero solo aporta ${aPesos(masVendido.utilidadTotal)} de utilidad.`,
    `${masRentable.plato} es el plato más rentable del mes con ${aPesos(masRentable.utilidadTotal)} de utilidad y un margen de ${aPorcentaje(masRentable.margen)}.`,
    `${a.insumosEnAlerta.length} insumos críticos están por debajo del punto de reorden de ${PUNTO_REORDEN} unidades, encabezados por ${a.insumosEnAlerta[0].insumo}.`,
  ];

  const insights = [
    `Volumen y rentabilidad no van juntos: ${masVendido.plato} lidera en unidades y ${masRentable.plato} en utilidad. Optimizar solo por unidades vendidas empujaría la carta hacia el producto que menos deja.`,
    `Las ventas se concentran en dos picos (almuerzo y noche) mientras ${unirLista(horasFlojas)} quedan casi vacías: hay capacidad de plancha ociosa que no cuesta más arriendo ni más personal.`,
    `${categoriaLider.categoria} lidera los ingresos con ${aPorcentaje(categoriaLider.participacion)}, y ${mejorMargen.plato} tiene el mejor margen de la carta (${aPorcentaje(mejorMargen.margen)}) con muy poca visibilidad; la categoría ${categoriaMenorMargen.categoria} factura alto pero es la de menor margen (${aPorcentaje(categoriaMenorMargen.margen)}).`,
  ];

  const recomendaciones = [
    `Poner ${masRentable.plato} en el primer bloque de la carta y ofrecerlo como sugerencia en la hora pico de ${a.horaPico.hora}:00, donde ya hay demanda garantizada.`,
    `Lanzar una promoción acotada en la franja de ${unirLista(horasFlojas)} (por ejemplo, combo con bebida) para mover la capacidad ociosa sin canibalizar el pico.`,
    `Reponer hoy los ${a.insumosEnAlerta.length} insumos en alerta y revisar el precio de la categoría ${categoriaMenorMargen.categoria}: factura bien pero deja ${aPorcentaje(categoriaMenorMargen.margen)}, por debajo del margen global de ${aPorcentaje(a.margenGlobal)}.`,
  ];

  const llenar = (id, textos) => {
    const lista = document.getElementById(id);
    lista.textContent = '';
    textos.forEach((t) => {
      const li = document.createElement('li');
      li.append(crear('span', null, t));
      lista.append(li);
    });
  };

  llenar('hallazgos', hallazgos);
  llenar('insights', insights);
  llenar('recomendaciones', recomendaciones);
}

/* ================================== INICIO ================================= */

function mostrarError(mensaje) {
  document.getElementById('estado-carga').hidden = true;
  const caja = document.getElementById('estado-error');
  caja.hidden = false;
  caja.className = 'aviso aviso--error';
  caja.textContent =
    `No fue posible cargar los datos: ${mensaje}. Abre el proyecto con un servidor ` +
    'local (Live Server en VS Code, o "python -m http.server") para que fetch pueda ' +
    'leer la carpeta data/.';
}

async function iniciar() {
  try {
    const [carta, pedidos] = await Promise.all([
      traerJSON('data/carta.json'),
      traerJSON('data/pedidos.json'),
    ]);

    const analisis = analizar(carta, pedidos);

    pintarPeriodo(analisis);
    pintarKPIs(analisis);
    pintarHoras(analisis);
    pintarDias(analisis);
    pintarRankings(analisis);
    pintarInsumos(analisis);
    pintarProyeccion(analisis);
    pintarConclusiones(analisis);

    document.getElementById('estado-carga').hidden = true;
    document.getElementById('tablero').hidden = false;
  } catch (error) {
    console.error(error);
    mostrarError(error.message);
  }
}

document.addEventListener('DOMContentLoaded', iniciar);
