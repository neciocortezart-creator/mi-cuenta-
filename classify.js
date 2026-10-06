// Clasificación automática (categoría + cuadrante Covey) y puntaje de prioridad.
(function () {
  const A = (window.App = window.App || {});
  const RULES = [
    [/arriendo|alquiler|dividendo/, "Casa", "Q1", true, "Vivienda", 40],
    [/deuda|cuota|tarjeta|banco|cr[eé]dito/, "Casa", "Q1", true, "Deuda", 38],
    [/fuga|cañer|gotera|roto|rompi|chapa|luz|gas|puerta|agua/, "Casa", "Q1", true, "Reparación del hogar", 34],
    [/internet|wifi|fibra/, "Casa", "Q1", true, "Cuenta básica", 32],
    [/curso|libro|aprender|estudiar|capacitaci|taller|ingl[eé]s/, "Estudio", "Q2", true, "Crecimiento", 24],
    [/trabajo|agencia|cliente|micr[oó]fono|computador|software|c[aá]mara|herramienta/, "Trabajo", "Q2", true, "Para producir", 22],
    [/pasaje|transporte|metro|micro|bencina/, "Casa", "Q1", false, "Transporte", 20],
    [/comida|asado|almuerzo|cena|familia|compartir/, "Familia", "Q2", true, "Vínculos", 18],
    [/zapatilla|zapato|videojuego|juego|antojo|oferta/, "Casa", "Q4", false, "Prescindible", 0]
  ];
  const URGENT = /urgente|hoy|vence|vencimiento|ma[ñn]ana|inmediat|atrasad/;
  const DEFAULT = { category: "Casa", quadrant: "Q2", isRock: false, label: "Importante", weight: 10 };

  function classify(text) {
    const t = text.toLowerCase();
    const r = RULES.find(([re]) => re.test(t));
    const c = r ? { category: r[1], quadrant: r[2], isRock: r[3], label: r[4], weight: r[5] } : { ...DEFAULT };
    if (URGENT.test(t)) { c.quadrant = "Q1"; c.weight += 20; }
    return c;
  }

  classify.priority = t =>
    ({ Q1: 300, Q2: 200, Q4: 100 }[t.quadrant] ?? 200) +
    (t.isRock ? 50 : 0) +
    classify(t.title || "").weight +
    (URGENT.test((t.title || "").toLowerCase()) ? 40 : 0);

  A.classify = classify;
})();
