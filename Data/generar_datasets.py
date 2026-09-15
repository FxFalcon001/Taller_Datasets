"""
Generador de datasets sinteticos - Comidas Senor Salchicha
Taller: Food Truck Data Challenge
Semilla fija (42) para que los datos sean reproducibles y auditables.
Salida: carta.csv, carta.json, pedidos.csv, pedidos.json
"""
import csv
import json
import random
from datetime import date, timedelta

random.seed(42)

# ----------------------------------------------------------------------
# 1) CARTA Y COSTOS - 15 platos (minimo exigido: 12)
# ----------------------------------------------------------------------
CARTA = [
    # id, plato, categoria, insumo_critico, stock_actual, costo, precio_venta
    ("P01", "Perro Señor Salchicha",        "Perros",       "Salchicha americana", 18,  5200, 14000),
    ("P02", "Perro Ranchero",               "Perros",       "Tocineta ahumada",     9,  6400, 16500),
    ("P03", "Perro Suizo",                  "Perros",       "Queso mozzarella",    24,  6000, 15500),
    ("P04", "Perro Criollo con Chorizo",    "Perros",       "Chorizo santarrosano",12,  7100, 18000),
    ("P05", "Salchipapa Clásica",           "Salchipapas",  "Papa criolla",        32,  4800, 13000),
    ("P06", "Salchipapa Señor Salchicha",   "Salchipapas",  "Salchicha ranchera",  15,  7300, 19000),
    ("P07", "Salchipapa Mixta Doble",       "Salchipapas",  "Carne desmechada",     7,  9200, 23000),
    ("P08", "Maíz Pira con Queso",          "Salchipapas",  "Queso costeño",       21,  4100, 11500),
    ("P09", "Hamburguesa Salchichera",      "Hamburguesas", "Carne de res 150g",   11, 10500, 24000),
    ("P10", "Hamburguesa Doble Tocineta",   "Hamburguesas", "Tocineta ahumada",     6, 13200, 29000),
    ("P11", "Choripán de la Casa",          "Hamburguesas", "Chorizo santarrosano", 8,  8300, 20000),
    ("P12", "Gaseosa Personal 400ml",       "Bebidas",      "Gaseosa 400ml",       48,  2200,  5500),
    ("P13", "Limonada de Coco",             "Bebidas",      "Pulpa de coco",       14,  3400,  9000),
    ("P14", "Jugo Natural en Agua",         "Bebidas",      "Pulpa de fruta",      19,  2600,  7000),
    ("P15", "Adición de Papa a la Francesa","Adiciones",    "Papa prefrita",        5,  2400,  6500),
]

# Peso de popularidad por plato (define el ranking de ventas)
PESOS = {
    "P01": 16, "P02": 9,  "P03": 11, "P04": 7,  "P05": 15,
    "P06": 13, "P07": 5,  "P08": 6,  "P09": 8,  "P10": 4,
    "P11": 5,  "P12": 18, "P13": 7,  "P14": 5,  "P15": 10,
}

# Franjas horarias: (hora, peso). El almuerzo y la noche son las horas pico.
FRANJAS = [
    (11, 4), (12, 14), (13, 17), (14, 9),
    (15, 3), (16, 3), (17, 5),
    (18, 8), (19, 15), (20, 12), (21, 6), (22, 3),
]

MES_INICIO = date(2026, 8, 1)
DIAS_MES = 31
N_PEDIDOS = 132  # minimo exigido: 80

platos_por_id = {p[0]: p for p in CARTA}
ids = [p[0] for p in CARTA]
pesos_ids = [PESOS[i] for i in ids]
horas = [f[0] for f in FRANJAS]
pesos_horas = [f[1] for f in FRANJAS]

pedidos = []
for _ in range(N_PEDIDOS):
    dia_offset = random.randint(0, DIAS_MES - 1)
    fecha = MES_INICIO + timedelta(days=dia_offset)
    # Viernes (4) y sabado (5) concentran mas pedidos
    if fecha.weekday() in (4, 5) and random.random() < 0.35:
        dia_offset = random.choice([d for d in range(DIAS_MES)])
        fecha = MES_INICIO + timedelta(days=dia_offset)

    hora = random.choices(horas, weights=pesos_horas, k=1)[0]
    minuto = random.randint(0, 59)

    id_plato = random.choices(ids, weights=pesos_ids, k=1)[0]
    _, nombre, _, _, _, _, precio = platos_por_id[id_plato]

    cantidad = random.choices([1, 2, 3], weights=[68, 25, 7], k=1)[0]

    pedidos.append({
        "fecha": fecha.isoformat(),
        "hora": f"{hora:02d}:{minuto:02d}",
        "id_plato": id_plato,
        "plato": nombre,
        "cantidad": cantidad,
        "precio_unitario": precio,
        "total": cantidad * precio,
    })

# Orden cronologico
pedidos.sort(key=lambda r: (r["fecha"], r["hora"]))

# ----------------------------------------------------------------------
# 2) ESCRITURA DE ARCHIVOS
# ----------------------------------------------------------------------
carta_dicts = [{
    "id_plato": p[0], "plato": p[1], "categoria": p[2], "insumo_critico": p[3],
    "stock_actual": p[4], "costo": p[5], "precio_venta": p[6],
} for p in CARTA]

with open("carta.json", "w", encoding="utf-8") as f:
    json.dump(carta_dicts, f, ensure_ascii=False, indent=2)

with open("carta.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(carta_dicts[0].keys()))
    w.writeheader()
    w.writerows(carta_dicts)

with open("pedidos.json", "w", encoding="utf-8") as f:
    json.dump(pedidos, f, ensure_ascii=False, indent=2)

with open("pedidos.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(pedidos[0].keys()))
    w.writeheader()
    w.writerows(pedidos)

print(f"carta: {len(carta_dicts)} platos | pedidos: {len(pedidos)} registros")
