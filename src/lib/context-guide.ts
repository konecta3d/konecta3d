// ─── Guía por bloque del Contexto (por qué + cómo se usa + recompensa) ────────
// Textos que se muestran al negocio mientras rellena cada bloque de contexto,
// para que entienda POR QUÉ importa, CÓMO lo usa la plataforma y QUÉ desbloquea
// al completarlo. Los ejemplos campo a campo ya viven en cada casilla
// (placeholder + pista); esto es el nivel de bloque. Editable: es la parte de
// redacción que Miguel afina.

export interface ContextBlockGuide {
  porque: string;
  como: string;
  recompensa: string;
}

export const CONTEXT_BLOCK_GUIDE: Record<string, ContextBlockGuide> = {
  identidad: {
    porque:
      "Es la base de todo. Si aquí pones solo “fisioterapeuta”, todo lo que genere la IA será genérico. Si pones el resultado real que consigues, todo sonará a ti.",
    como:
      "De aquí la IA saca tu titular, tu subtítulo y el gancho del stand. Lo verás en cuanto generes una landing o un recurso: tus palabras, no las de una plantilla.",
    recompensa:
      "Identidad lista. La IA ya sabe qué haces y qué resultado das, y puede escribir tu titular, tu subtítulo y el gancho del stand.",
  },
  clientes: {
    porque:
      "Cada perfil es una persona concreta a la que le hablas. Cuanto mejor definas quién es y qué le duele, más preciso es el texto que la IA escribe para atraerle. Un mensaje para todos no conecta con nadie.",
    como:
      "La IA elige a cuál de tus perfiles apuntar cada recurso y formulario, y ajusta el mensaje para esa persona. Lo notarás en que el texto habla del problema concreto de ese cliente, no en general.",
    recompensa:
      "Ya tienes claro a quién te diriges. La IA puede adaptar el recurso y el formulario para que esa persona sienta que le hablas a ella.",
  },
  tono: {
    porque:
      "Marca cómo suenan tus textos: cercano, profesional, técnico. Sin esto la IA elige un tono neutro que puede no ser el tuyo. Aquí le enseñas a hablar como hablas tú.",
    como:
      "Cada texto que genere la IA saldrá con este tono. Si dices “cercano y de tú”, no te escribirá como un banco.",
    recompensa:
      "La IA ya escribe con tu voz. Menos correcciones y más “esto ya suena a mí”.",
  },
  sector: {
    porque:
      "Dice dónde captas y a qué eventos vas. La IA lo usa para proponerte ideas y ejemplos de tu sector, no de uno cualquiera.",
    como:
      "Cuando pidas un recurso o una idea, saldrá pensado para tu sector y para el tipo de evento donde estás, no genérico.",
    recompensa:
      "La IA ya conoce tu terreno de juego y puede sugerirte recursos y ganchos pensados para tus eventos.",
  },
  expectativas: {
    porque:
      "Cuánta gente esperas y cuántos contactos quieres conseguir. Sirve para medir cada campaña de verdad: cuánto conviertes y qué mejorar.",
    como:
      "Estos números se comparan con lo real de cada campaña (llaveros entregados, escaneos, datos dejados) para decirte si vas bien o hay que ajustar.",
    recompensa:
      "Ya podemos medir tus campañas contra un objetivo real, no a ojo.",
  },
  seguimiento: {
    porque:
      "Qué pasa después de captar el dato: por dónde contactas y cuándo. La IA usa esto para escribirte los mensajes de seguimiento en el canal y el momento correctos.",
    como:
      "Cuando generes la secuencia de seguimiento, saldrá lista para tu canal (WhatsApp, llamada, email) y con el timing que hayas marcado.",
    recompensa:
      "Contexto de captación completo. La IA puede montarte la secuencia de seguimiento entera, lista para enviar. Ya puedes crear tu primera campaña.",
  },
};
