// ─── Normalización de números de WhatsApp ────────────────────────────────────
// wa.me exige el número en formato internacional: prefijo de país + número,
// sin "+", sin ceros iniciales y sin espacios (España: 34XXXXXXXXX).
// El error típico es poner el número español sin el "34" → WhatsApp responde
// "no es un número de teléfono válido". Aquí:
//  - quitamos todo lo que no sea dígito y los ceros iniciales (00 internacional),
//  - si quedan 9 dígitos (móvil/fijo español sin prefijo) añadimos "34",
//  - devolvemos un aviso cuando el número no parece válido (solo tras teclear
//    un número plausiblemente completo, para no molestar mientras se escribe).

export function normalizeWhatsappPhone(raw: string): { number: string; warning: string | null } {
  const digits = (raw || "").replace(/\D/g, "").replace(/^0+/, "");
  const number = digits.length === 9 ? "34" + digits : digits;
  const warning =
    digits.length >= 9 && (number.length < 11 || number.length > 15)
      ? "El número no parece válido. Con prefijo de país debe quedar como 34XXXXXXXXX (España)."
      : null;
  return { number, warning };
}
