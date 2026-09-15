/* =============================================================================
   Comidas Señor Salchicha — sitio público
   JavaScript puro: fetch + async/await + try/catch + manipulación del DOM.
   ============================================================================= */
'use strict';

/* ------------------------------ utilidades -------------------------------- */

const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** Formatea un número como pesos colombianos. */
function aPesos(valor) {
  return pesos.format(valor);
}

/** Descarga un JSON y falla con un mensaje entendible. */
async function traerJSON(ruta) {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer ${ruta} (HTTP ${respuesta.status})`);
  }
  return respuesta.json();
}

/** Crea un elemento con clase y texto en una sola línea. */
function crear(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

/* ------------------------------- cálculos --------------------------------- */

/**
 * Agrupa los pedidos por id_plato y devuelve unidades e ingresos.
 * @returns {Map<string, {unidades:number, ingresos:number}>}
 */
function resumirPorPlato(pedidos) {
  return pedidos.reduce((mapa, p) => {
    const actual = mapa.get(p.id_plato) || { unidades: 0, ingresos: 0 };
    actual.unidades += p.cantidad;
    actual.ingresos += p.total;
    mapa.set(p.id_plato, actual);
    return mapa;
  }, new Map());
}

/** Devuelve el conteo de pedidos por hora ("11" → 7). */
function contarPorHora(pedidos) {
  return pedidos.reduce((mapa, p) => {
    const hora = p.hora.slice(0, 2);
    mapa.set(hora, (mapa.get(hora) || 0) + 1);
    return mapa;
  }, new Map());
}

/* -------------------------------- render ---------------------------------- */

function pintarDatosPortada(carta, pedidos, porPlato, porHora) {
  const horasOrdenadas = [...porHora.entries()].sort((a, b) => b[1] - a[1]);
  const [horaPico] = horasOrdenadas[0];

  const favorito = [...porPlato.entries()]
    .sort((a, b) => b[1].unidades - a[1].unidades)
    .map(([id]) => carta.find((plato) => plato.id_plato === id))
    .find((plato) => plato && plato.categoria !== 'Bebidas');

  const valores = {
    platos: String(carta.length),
    pedidos: String(pedidos.length),
    hora: `${horaPico}:00`,
    favorito: favorito ? favorito.plato.split(' ')[0] : '—',
  };

  document.querySelectorAll('[data-dato]').forEach((nodo) => {
    nodo.textContent = valores[nodo.dataset.dato] ?? '—';
  });

  // Consejo de hora tranquila en la sección "Dónde estamos"
  const horaFloja = horasOrdenadas[horasOrdenadas.length - 1][0];
  const consejo = document.getElementById('consejo-hora');
  if (consejo) {
    consejo.textContent =
      `Si no quieres fila, cae entre las ${horaFloja}:00 y las ` +
      `${Number(horaFloja) + 1}:00: es nuestra franja más tranquila.`;
  }
}

function pintarCarta(carta, porPlato) {
  const contenedor = document.getElementById('carta-contenido');
  const estado = document.getElementById('carta-estado');
  contenedor.textContent = '';

  // Los 3 platos más vendidos reciben etiqueta de estrella
  const masVendidos = [...porPlato.entries()]
    .sort((a, b) => b[1].unidades - a[1].unidades)
    .slice(0, 3)
    .map(([id]) => id);

  const categorias = [...new Set(carta.map((p) => p.categoria))];

  categorias.forEach((nombreCategoria) => {
    const platos = carta.filter((p) => p.categoria === nombreCategoria);

    const seccion = crear('section', 'categoria');

    const cabeza = crear('div', 'categoria__titulo');
    cabeza.append(
      crear('h3', null, nombreCategoria),
      crear('span', 'categoria__conteo', `${platos.length} opciones`)
    );

    const lista = crear('ul', 'platos');

    platos.forEach((plato) => {
      const item = crear('li', 'plato');

      const nombre = crear('span', 'plato__nombre', plato.plato);

      if (masVendidos.includes(plato.id_plato)) {
        nombre.append(' ', crear('span', 'etiqueta etiqueta--estrella', 'Top ventas'));
      } else if (plato.stock_actual < 10) {
        nombre.append(' ', crear('span', 'etiqueta etiqueta--agotando', 'Últimas unidades'));
      }

      item.append(
        nombre,
        crear('span', 'plato__guia'),
        crear('span', 'plato__precio', aPesos(plato.precio_venta))
      );
      lista.append(item);
    });

    seccion.append(cabeza, lista);
    contenedor.append(seccion);
  });

  estado.hidden = true;
}

function pintarFavoritos(carta, porPlato) {
  const contenedor = document.getElementById('favoritos-contenido');
  contenedor.textContent = '';

  const top = [...porPlato.entries()]
    .sort((a, b) => b[1].unidades - a[1].unidades)
    .slice(0, 3);

  const descripciones = {
    Perros: 'Pan artesanal, salsas de la casa y la salchicha dorada en plancha.',
    Salchipapas: 'Papa recién frita, queso derretido y salsa hasta el fondo del vaso.',
    Hamburguesas: 'Carne sellada al momento, con el punto que pidas.',
    Bebidas: 'Bien fría, para bajar la salsa picante.',
    Adiciones: 'Para compartir… o no.',
  };

  top.forEach(([id, datos], indice) => {
    const plato = carta.find((p) => p.id_plato === id);
    if (!plato) return;

    const tarjeta = crear('article', 'tarjeta');
    tarjeta.append(
      crear('p', 'tarjeta__puesto', `N.º ${indice + 1} del mes`),
      crear('h3', null, plato.plato),
      crear('p', null, descripciones[plato.categoria] || ''),
      crear('p', null, `${datos.unidades} unidades vendidas · ${aPesos(plato.precio_venta)}`)
    );
    contenedor.append(tarjeta);
  });
}

function mostrarError(mensaje) {
  const estado = document.getElementById('carta-estado');
  estado.hidden = false;
  estado.className = 'aviso aviso--error';
  estado.textContent =
    `${mensaje}. Abre el proyecto con un servidor local (por ejemplo, la extensión ` +
    'Live Server de VS Code) para que el navegador pueda leer la carpeta data/.';
}

/* --------------------------------- inicio --------------------------------- */

async function iniciar() {
  try {
    const [carta, pedidos] = await Promise.all([
      traerJSON('data/carta.json'),
      traerJSON('data/pedidos.json'),
    ]);

    const porPlato = resumirPorPlato(pedidos);
    const porHora = contarPorHora(pedidos);

    pintarDatosPortada(carta, pedidos, porPlato, porHora);
    pintarCarta(carta, porPlato);
    pintarFavoritos(carta, porPlato);
  } catch (error) {
    console.error(error);
    mostrarError(error.message);
  }
}

document.addEventListener('DOMContentLoaded', iniciar);
