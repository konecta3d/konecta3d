// ─── Guía por bloque del Contexto (por qué + cómo se usa) ─────────────────────
// Textos que se muestran al negocio mientras rellena cada bloque de contexto,
// para que entienda POR QUÉ importa y CÓMO lo usa la plataforma. Los ejemplos
// campo a campo ya viven en cada casilla (placeholder + pista); esto es el nivel
// de bloque. Editable: es la parte de redacción que Miguel afina.

export interface ContextBlockGuide {
  porque: string;
  como: string;
}

export const CONTEXT_BLOCK_GUIDE: Record<string, ContextBlockGuide> = {
  identidad: {
    porque:
      "Es la base de todo. Si aquí pones solo “fisioterapeuta”, todo lo que genere la IA será genérico. Si pones el resultado real que consigues, todo sonará a ti.",
    como:
      "De aquí la IA saca tu titular, tu subtítulo y el gancho del stand. Lo verás en cuanto generes una landing o un recurso: tus palabras, no las de una plantilla.",
  },
  clientes: {
    porque:
      "Cada perfil es una persona concreta a la que le hablas. Cuanto mejor definas quién es y qué le duele, más preciso es el texto que la IA escribe para atraerle. Un mensaje para todos no conecta con nadie.",
    como:
      "La IA elige a cuál de tus perfiles apuntar cada recurso y formulario, y ajusta el mensaje para esa persona. Lo notarás en que el texto habla del problema concreto de ese cliente.",
  },
  tono: {
    porque:
      "Marca cómo suenan tus textos: cercano, profesional, técnico. Sin esto la IA elige un tono neutro que puede no ser el tuyo. Aquí le enseñas a hablar como hablas tú.",
    como:
      "Cada texto que genere la IA saldrá con este tono. Si dices “cercano y de tú”, no te escribirá como un banco.",
  },
  sector: {
    porque:
      "Dice dónde captas y a qué eventos vas. La IA lo usa para proponerte ideas y ejemplos de tu sector, no de uno cualquiera.",
    como:
      "Cuando pidas un recurso o una idea, saldrá pensado para tu sector y para el tipo de evento donde estás, no genérico.",
  },
  expectativas: {
    porque:
      "Cuánta gente esperas y cuántos contactos quieres conseguir. Sirve para medir cada campaña de verdad: cuánto conviertes y qué mejorar.",
    como:
      "Estos números se comparan con lo real de cada campaña (llaveros entregados, escaneos, datos dejados) para decirte si vas bien o hay que ajustar.",
  },
  seguimiento: {
    porque:
      "Qué pasa después de captar el dato: por dónde contactas y cuándo. La IA usa esto para escribirte los mensajes de seguimiento en el canal y el momento correctos.",
    como:
      "Cuando generes la secuencia de seguimiento, saldrá lista para tu canal (WhatsApp, llamada, email) y con el timing que hayas marcado.",
  },
};
