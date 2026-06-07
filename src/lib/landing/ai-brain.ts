// ─── "Cerebro" editable del generador de landings ────────────────────────────
// La voz, el posicionamiento y los ejemplos de Konecta. Editable desde el admin
// (settings: landing_ai_brain). Es lo que hace que el copy suene a Konecta y no
// genérico. Los frameworks de mentores y el esquema de bloques siguen fijos en
// ai-context.ts; esto es lo que TÚ afinas.

export interface VoiceExample {
  malo: string;   // cómo lo diría una IA genérica / marketing corporativo
  bueno: string;  // cómo lo dice Konecta
}

export interface AiBrain {
  product: string;        // qué vendemos, en tus palabras
  audience: string;       // a quién le hablamos (resumen; el detalle está en Cliente ideal)
  voice: string;          // cómo suena Konecta (personalidad y tono)
  wordsYes: string[];     // palabras/expresiones que SÍ usamos
  wordsNo: string[];      // palabras/expresiones que evitamos
  rules: string[];        // reglas de estilo
  examples: VoiceExample[]; // ejemplos "así sí / así no"
}

export const DEFAULT_AI_BRAIN: AiBrain = {
  product:
    "Konecta3D vende un sistema de captación para negocios que van a ferias y eventos: un llavero NFC con su marca que el visitante toca con el móvil y queda capturado en una plataforma (con su contacto y lo que le interesó). Se vende el sistema; el cliente personaliza su parte digital y ese tiempo se usa para fabricar y enviar los llaveros antes de su feria. Entrada: prueba gratis del MVP 1 mes, sin permanencia. El precio se trata en conversación, NO en la landing.",
  audience:
    "El Expositor: dueño de un negocio local (2-20 empleados) que usa ferias y eventos para captar clientes, gasta miles en cada feria y sabe que la mayoría de los contactos se pierden, pero lo ha normalizado. No es técnico. Le hablamos de tú, a una sola persona.",
  voice:
    "Directo, cercano y honesto. Hablamos del problema real y del resultado tangible, no de tecnología. Sin postureo ni jerga de marketing. No inflamos (no tenemos aún testimonios, así que vendemos por identificación con el problema y demostración, no por humo). Combinamos la claridad de oferta de Alex Hormozi (valor concreto, riesgo bajo) con el estilo directo y anti-marketing de Isra Bravo (frases cortas, contraintuitivo, como hablando a un amigo).",
  wordsYes: ["feria", "stand", "leads", "contactos", "el lunes", "llavero", "captar", "se te escapa", "sistema", "tu marca", "la próxima feria"],
  wordsNo: ["soluciones innovadoras", "potenciar", "sinergias", "revolucionario", "líderes del sector", "transformación digital", "disruptivo", "de última generación"],
  rules: [
    "Habla de tú, a una sola persona.",
    "Frases cortas. Una idea por línea. Que respire.",
    "Beneficio y resultado concretos, no características técnicas.",
    "Nada de signos de exclamación.",
    "No inventes cifras ni testimonios.",
    "No pongas precio en la landing.",
    "Empieza fuerte: una idea contraintuitiva o el coste de no actuar.",
    "CTA suave pero claro (la plataforma se vende sola al probarla).",
  ],
  examples: [
    {
      malo: "Potencia tu presencia digital con soluciones innovadoras para tu negocio.",
      bueno: "Cada feria te cuesta miles y la mayoría de contactos se te escapan. Esto los captura.",
    },
    {
      malo: "Optimiza la captación de leads en tus eventos con tecnología de última generación.",
      bueno: "Tu visitante toca el llavero con el móvil y queda guardado. Tú llegas el lunes con la lista hecha.",
    },
    {
      malo: "Únete a los líderes del sector que confían en nuestra plataforma.",
      bueno: "Pruébalo gratis un mes. Si no te sirve, no has perdido nada.",
    },
  ],
};

/** Convierte el cerebro en un bloque de texto para el system prompt del generador. */
export function brainToPrompt(b: AiBrain): string {
  const ex = (b.examples || []).map((e) => `- En vez de: "${e.malo}"\n  Escribe así: "${e.bueno}"`).join("\n");
  return `PRODUCTO/SERVICIO:
${b.product}

A QUIÉN LE HABLAMOS:
${b.audience}

VOZ Y TONO DE KONECTA (imítalo con precisión):
${b.voice}

PALABRAS QUE SÍ USAMOS: ${(b.wordsYes || []).join(", ")}
PALABRAS QUE EVITAMOS (no las uses nunca): ${(b.wordsNo || []).join(", ")}

REGLAS DE ESTILO:
${(b.rules || []).map((r) => `- ${r}`).join("\n")}

EJEMPLOS — IMITA EL LADO "ESCRIBE ASÍ":
${ex}`;
}
