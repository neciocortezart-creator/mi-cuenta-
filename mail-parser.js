// Parser inteligente para correos y comprobantes bancarios en Chile
(function () {
  const A = (window.App = window.App || {});

  function parseEmail(text) {
    if (!text || typeof text !== "string") return null;

    const t = text.trim();
    if (!t) return null;

    // 1. Detectar si es ingreso o egreso/gasto
    const incomeSignals = /transferencia recibida|te han transferido|te transfiri[oó]|abono|dep[oó]sito recibido|pago recibido|recibiste dinero|te pagaron|abono en cuenta/i;
    const isIncome = incomeSignals.test(t);

    // 2. Extracción de montos en CLP (soporta $120.000, CLP 50.000, Monto: 25.000, $ 45000, etc.)
    let amount = 0;
    const amountMatches = [
      /(?:monto|importe|total|valor)[\s:]*(?:clp|\$)?\s*([\d\.,]+)/i,
      /(?:\$|clp)\s*([\d\.]+)/i,
      /(?:por un monto de|por valor de)\s*(?:clp|\$)?\s*([\d\.,]+)/i
    ];

    for (const regex of amountMatches) {
      const match = t.match(regex);
      if (match && match[1]) {
        const val = A.fmt.num(match[1]);
        if (val > 0) {
          amount = val;
          break;
        }
      }
    }

    // 3. Extracción de destinatario, comercio o emisor
    let title = "";
    const detailMatches = [
      /(?:destinatario|comercio|en|pagado a|empresa|establecimiento|beneficiario)[\s:]+([^
,.;]{3,40})/i,
      /(?:de|emisor|remitente)[\s:]+([^
,.;]{3,40})/i,
      /(?:asunto|motivo|mensaje|comentario)[\s:]+([^
,.;]{3,40})/i
    ];

    for (const regex of detailMatches) {
      const match = t.match(regex);
      if (match && match[1]) {
        const candidate = match[1].trim();
        // Evitar capturar palabras que son parte del encabezado
        if (!/^(cuenta|rut|fecha|hora|banco)/i.test(candidate)) {
          title = candidate;
          break;
        }
      }
    }

    if (!title) {
      // Si no hay detalle específico, usar primera línea significativa o etiqueta genérica
      const firstLine = t.split(/\r?\n/).map(l => l.trim()).find(l => l.length > 4 && !/comprobante|notificaci[oó]n|aviso/i.test(l));
      title = firstLine ? firstLine.substring(0, 35) : (isIncome ? "Abono bancario" : "Compra o pago");
    }

    if (!amount) return null;

    return {
      type: isIncome ? "income" : "task",
      title: title,
      amount: amount
    };
  }

  A.mailParser = { parseEmail };
})();
