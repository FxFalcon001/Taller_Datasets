"""
Auditoria de calidad + analisis ejecutivo - Comidas Senor Salchicha
Ejecutar DESPUES de generar_datasets.py
"""
import json
from collections import defaultdict

carta = json.load(open("carta.json", encoding="utf-8"))
pedidos = json.load(open("pedidos.json", encoding="utf-8"))

print("=" * 62)
print("VALIDACION DE DATOS")
print("=" * 62)

ok = True
def check(nombre, condicion, detalle=""):
    global ok
    estado = "OK  " if condicion else "FALLA"
    if not condicion:
        ok = False
    print(f"[{estado}] {nombre} {detalle}")

ids_carta = {p["id_plato"] for p in carta}
check("Minimo 12 platos", len(carta) >= 12, f"-> {len(carta)}")
check("Minimo 80 pedidos", len(pedidos) >= 80, f"-> {len(pedidos)}")
check("id_plato unico en carta", len(ids_carta) == len(carta))
check("Todo pedido existe en la carta",
      all(r["id_plato"] in ids_carta for r in pedidos))
check("precio_venta > costo en todos los platos",
      all(p["precio_venta"] > p["costo"] for p in carta))
check("total = cantidad x precio_unitario",
      all(r["total"] == r["cantidad"] * r["precio_unitario"] for r in pedidos))
check("Sin cantidades o precios negativos/cero",
      all(r["cantidad"] > 0 and r["precio_unitario"] > 0 for r in pedidos))
check("Sin valores vacios en carta",
      all(all(v not in (None, "") for v in p.values()) for p in carta))
meses = {r["fecha"][:7] for r in pedidos}
check("Todas las fechas del mismo mes", len(meses) == 1, f"-> {meses}")
check("Margenes diferentes entre platos",
      len({round((p['precio_venta']-p['costo'])/p['precio_venta'], 4) for p in carta}) > 5)
check("Precio del pedido coincide con la carta",
      all(r["precio_unitario"] == next(p["precio_venta"] for p in carta
          if p["id_plato"] == r["id_plato"]) for r in pedidos))

print(f"\nRESULTADO: {'DATASETS APROBADOS' if ok else 'REVISAR ERRORES'}\n")

print("=" * 62)
print("ANALISIS EJECUTIVO")
print("=" * 62)

cop = lambda n: f"${n:,.0f}".replace(",", ".")

ventas_totales = sum(r["total"] for r in pedidos)
unidades = sum(r["cantidad"] for r in pedidos)
ticket = ventas_totales / len(pedidos)

print(f"Ventas totales      : {cop(ventas_totales)}")
print(f"Numero de pedidos   : {len(pedidos)}")
print(f"Unidades vendidas   : {unidades}")
print(f"Ticket promedio     : {cop(ticket)}")

# Hora pico
por_hora = defaultdict(lambda: {"ingresos": 0, "pedidos": 0})
for r in pedidos:
    h = r["hora"][:2]
    por_hora[h]["ingresos"] += r["total"]
    por_hora[h]["pedidos"] += 1
hora_pico = max(por_hora.items(), key=lambda x: x[1]["ingresos"])
print(f"Hora pico           : {hora_pico[0]}:00 -> {cop(hora_pico[1]['ingresos'])} "
      f"({hora_pico[1]['pedidos']} pedidos)")
print("\nIngresos por franja horaria:")
for h in sorted(por_hora):
    d = por_hora[h]
    barra = "#" * int(d["ingresos"] / 40000)
    print(f"  {h}:00  {d['pedidos']:>3} ped  {cop(d['ingresos']):>12}  {barra}")

# Metricas por plato
agg = defaultdict(lambda: {"unidades": 0, "ingresos": 0})
for r in pedidos:
    agg[r["id_plato"]]["unidades"] += r["cantidad"]
    agg[r["id_plato"]]["ingresos"] += r["total"]

filas = []
for p in carta:
    a = agg.get(p["id_plato"], {"unidades": 0, "ingresos": 0})
    util_u = p["precio_venta"] - p["costo"]
    filas.append({
        "id": p["id_plato"], "plato": p["plato"], "categoria": p["categoria"],
        "unidades": a["unidades"], "ingresos": a["ingresos"],
        "utilidad_unitaria": util_u,
        "utilidad_total": util_u * a["unidades"],
        "margen": util_u / p["precio_venta"] * 100,
        "stock": p["stock_actual"], "insumo": p["insumo_critico"],
    })

print("\nTOP 5 POR INGRESOS:")
for i, f in enumerate(sorted(filas, key=lambda x: -x["ingresos"])[:5], 1):
    print(f"  {i}. {f['plato']:<32} {f['unidades']:>3} u  {cop(f['ingresos']):>12}")

print("\nTOP 5 POR UTILIDAD TOTAL:")
for i, f in enumerate(sorted(filas, key=lambda x: -x["utilidad_total"])[:5], 1):
    print(f"  {i}. {f['plato']:<32} {cop(f['utilidad_total']):>12}  margen {f['margen']:.1f}%")

mas_rentable = max(filas, key=lambda x: x["utilidad_total"])
mejor_margen = max(filas, key=lambda x: x["margen"])
mas_vendido = max(filas, key=lambda x: x["unidades"])
print(f"\nMas vendido   : {mas_vendido['plato']} ({mas_vendido['unidades']} u)")
print(f"Mas rentable  : {mas_rentable['plato']} ({cop(mas_rentable['utilidad_total'])})")
print(f"Mejor margen %: {mejor_margen['plato']} ({mejor_margen['margen']:.1f}%)")

utilidad_total = sum(f["utilidad_total"] for f in filas)
print(f"Utilidad total del mes: {cop(utilidad_total)} "
      f"(margen global {utilidad_total/ventas_totales*100:.1f}%)")

# Categorias
cat = defaultdict(lambda: {"ingresos": 0, "utilidad": 0, "unidades": 0})
for f in filas:
    cat[f["categoria"]]["ingresos"] += f["ingresos"]
    cat[f["categoria"]]["utilidad"] += f["utilidad_total"]
    cat[f["categoria"]]["unidades"] += f["unidades"]
print("\nPOR CATEGORIA:")
for c, d in sorted(cat.items(), key=lambda x: -x[1]["ingresos"]):
    m = d["utilidad"] / d["ingresos"] * 100 if d["ingresos"] else 0
    print(f"  {c:<14} {cop(d['ingresos']):>12}  utilidad {cop(d['utilidad']):>11}  margen {m:.1f}%")

# Stock bajo (umbral 10)
print("\nINSUMOS CON STOCK BAJO (< 10 unidades):")
for f in sorted(filas, key=lambda x: x["stock"]):
    if f["stock"] < 10:
        dia = f["unidades"] / 31
        cobertura = f["stock"] / dia if dia else 999
        print(f"  {f['insumo']:<24} stock {f['stock']:>3}  "
              f"consumo {dia:.2f} u/dia  cobertura {cobertura:.1f} dias")

# Proyeccion simple (promedio diario x 7)
dias = len({r["fecha"] for r in pedidos})
print(f"\nPROYECCION SIMPLE PROXIMA SEMANA (promedio diario sobre {dias} dias con venta x 7):")
print(f"  Ventas estimadas   : {cop(ventas_totales / 31 * 7)}")
print(f"  Unidades estimadas : {unidades / 31 * 7:.0f}")
for f in sorted(filas, key=lambda x: -x["unidades"])[:5]:
    print(f"    {f['plato']:<32} {f['unidades']/31*7:.1f} u/semana")
