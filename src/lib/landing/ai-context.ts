// ─── Contexto para el generador de landings con IA ────────────────────────────
// "Cerebro" del asistente: cómo piensan los mentores + qué vendemos + el
// fundamento de copy. Son descripciones de métodos/frameworks (no texto de los
// libros) para diseñar el copy. Editable a futuro desde el admin.

export const PRODUCT_CONTEXT = `KONECTA3D — qué vendemos:
- Un sistema de captación para negocios que van a ferias y eventos.
- Producto físico: un LLAVERO NFC personalizado con la marca del negocio (~3 € por unidad en lote). El visitante lo toca con el móvil y se abre la página del negocio.
- Plataforma digital: captura el contacto y lo que le interesó, lo guarda por evento, mide leads por feria, y permite seguimiento.
- Modelo: se vende el sistema; el cliente personaliza su parte digital; ese tiempo se usa para fabricar y enviar los llaveros antes de su feria.
- Oferta de entrada: prueba gratis del MVP durante 1 mes, sin permanencia. El precio se trata en conversación, NO se pone en la landing.
- Canal de contacto principal: WhatsApp.`;

export const COPY_FOUNDATION = `FUNDAMENTO DE COPY (Konecta3D):
Principio: la gente compra por emoción y justifica por lógica. Sin prueba social todavía → vender por identificación con el problema + transformación deseada + demostración del mecanismo (no por testimonios).

Estructura 3 P (Before-After-Bridge):
- PROBLEMA: la feria cuesta miles y la mayoría de los contactos se pierde; se vuelve con tarjetas que no sirven; el interés se enfría; no se sabe qué feria fue rentable. El coste real no es el stand: es el negocio que se quedó en la feria.
- POSIBILIDAD: llegar el lunes con la lista de leads ya hecha, sabiendo qué le interesó a cada uno; el equipo escribe a gente interesada, no llama en frío; ser el stand del que todos preguntan; medir el ROI por feria.
- PUENTE: un llavero con tu marca que el visitante toca con el móvil y queda capturado en tu plataforma. Lo configuras, lo pruebas gratis y llegas a tu próxima feria con el sistema montado. El llavero se queda con ellos; los datos se quedan contigo.

Palancas (repartir según el objetivo): urgencia/tiempo (la próxima feria es una fecha límite), aversión a la pérdida (lo que se pierde si no actúa), demostración del mecanismo ("toca el llavero"), anclaje de precio (es el 0,07% del coste del stand), ventaja de primer movimiento, reciprocidad (mes gratis), efecto dotación (al configurar su landing ya es suya), escasez de fabricación, identidad ("los que saben captar en ferias").

Beneficios por deseo (un ángulo por sección): el lunes con los leads listos · ser el stand más avanzado · justificar cada euro con datos · el equipo cierra más y llama menos en frío · un activo que trabaja después de la feria.`;

export const MENTORS: Record<string, { name: string; profile: string }> = {
  hormozi: {
    name: "Alex Hormozi",
    profile: `FORMA DE PENSAR — Alex Hormozi (oferta y valor):
- Ecuación de valor: Valor = (Sueño/Resultado deseado × Probabilidad percibida de lograrlo) ÷ (Tiempo de demora × Esfuerzo y sacrificio). Maximiza los dos de arriba, minimiza los dos de abajo en todo el copy.
- Oferta irresistible ("Grand Slam Offer"): haz la oferta tan buena que digan que sí o se sientan tontos diciendo que no. Apila valor, reduce riesgo (garantías, prueba gratis), reduce esfuerzo y tiempo hasta el resultado.
- Habla del resultado soñado en concreto y del coste de no actuar.
- Reduce la fricción y la duda: cuanto más fácil y seguro parezca, más convierte.
- Tono: directo, sin relleno, denso en valor, claro por encima de ingenioso, específico (números, plazos) por encima de vago.`,
  },
  "isra-bravo": {
    name: "Isra Bravo",
    profile: `FORMA DE PENSAR — Isra Bravo (copywriting directo en español):
- Escribe como hablas, a UNA sola persona, cercano y sin tecnicismos ni lenguaje corporativo.
- Empieza con una idea contraintuitiva, una anécdota o una frase que genere curiosidad y obligue a seguir leyendo.
- Honestidad radical: reconoce lo obvio, no exageres, no parezcas un vendedor; vende sin que parezca que vendes.
- Frases cortas. Ritmo. Una idea por línea. Que respire.
- Apela a la emoción y al deseo real del lector, luego justifica con lógica.
- Cierres con postdata cuando encaje. Llamadas a la acción suaves pero claras.
- Tono: conversacional, honesto, con personalidad; nada de jerga de marketing.`,
  },
};

// Catálogo de bloques que la IA puede generar (alineado con el modelo visual).
export const AI_BLOCK_SPEC = `Devuelve SOLO un objeto JSON válido (sin markdown, sin texto fuera del JSON) con esta forma:
{"blocks":[ ... ]}
Cada bloque es uno de estos tipos (usa "align":"center" para titulares/párrafos/botones y "left" para listas):
- {"type":"heading","level":1|2|3,"text":"...","accent":true|false,"align":"center","padY":"sm|md|lg|xl","bg":"none|card|brandSoft"}  // level 1 = titular principal; accent pinta la última línea en dorado; usa \\n para saltos de línea
- {"type":"paragraph","text":"...","size":"sm|md|lg","align":"center","padY":"none|sm|md"}
- {"type":"bullets","items":["...","..."],"align":"left","padY":"md"}
- {"type":"button","label":"...","linkType":"whatsapp","value":"34623759451","waMessage":"...","style":"gold","size":"lg","align":"center","padY":"md"}
- {"type":"cards","columns":2|3,"items":[{"icon":"📇","title":"...","text":"..."}],"align":"center","padY":"md"}
- {"type":"steps","items":[{"title":"...","text":"..."}],"align":"center","padY":"md"}
- {"type":"faq","items":[{"q":"...","a":"..."}],"align":"center","padY":"md"}
- {"type":"logos","title":"Negocios que ya tienen su llavero","items":[],"align":"center","padY":"lg"}  // deja items vacío
- {"type":"countdown","label":"...","target":"","align":"center","padY":"md"}  // deja target vacío
- {"type":"spacer","height":40}
Reglas: NO inventes URLs ni imágenes (no uses image/video). El botón principal usa WhatsApp con value "34623759451". NO incluyas precio. Todo en español de España. Estructura recomendada: hero (heading nivel 1 + paragraph + button), problema (heading + cards), posibilidad (heading bg brandSoft + paragraph), cómo funciona (heading + steps), beneficios (heading + cards), logos, urgencia (heading + countdown), faq, y CTA final (heading + button).`;
