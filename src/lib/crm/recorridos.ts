// ─── Diseñador de recorridos ──────────────────────────────────────────────────
// Permite crear MÚLTIPLES recorridos del cliente según el método de captación
// inicial y el perfil. Separado del Embudo (que es el flujo maestro único).
// Editable desde /admin/crm/recorridos (guardado en settings → crm_recorridos).

export interface RecorridoStep {
  nombre: string;        // qué pasa en este paso
  canal: string;         // dónde ocurre
  accionDirecta: string; // la acción que queremos que haga el cliente
}

export interface Recorrido {
  id: string;
  nombre: string;
  metodoCaptacion: string; // la entrada / primer contacto
  perfil: string;
  objetivo: string;
  color: string;
  pasos: RecorridoStep[];
  cierre: string;          // qué define el éxito del recorrido
}

export interface RecorridosData {
  recorridos: Recorrido[];
}

// Catálogos para los selectores
export const CANALES = [
  "Instagram", "LinkedIn", "Llavero NFC", "Feria / evento", "Referido",
  "QR impreso", "WhatsApp", "Email", "Landing", "Llamada", "Formulario", "PDF",
];

export const ACCIONES_DIRECTAS = [
  "Hacer clic en el enlace", "Visitar la landing", "Descargar el recurso",
  "Rellenar el formulario", "Agendar una llamada", "Escribir por WhatsApp",
  "Reservar una demo", "Responder el mensaje", "Compartir / recomendar",
  "Confirmar la compra",
];

export const METODOS_CAPTACION = [
  "Instagram", "LinkedIn", "Llavero en mano", "Feria / evento",
  "Referido", "QR impreso", "Publicidad pagada", "Boca a boca",
];

export const COLORES_RECORRIDO = [
  "#0ea5e9", "#22c55e", "#a78bfa", "#f97316", "#ec4899", "#facc15",
];

export const DEFAULT_RECORRIDOS: RecorridosData = {
  recorridos: [
    {
      id: "frio-instagram",
      nombre: "Captación fría — Instagram",
      metodoCaptacion: "Instagram",
      perfil: "El Expositor",
      objetivo: "Captar leads que no nos conocen y llevarlos a una llamada.",
      color: "#0ea5e9",
      pasos: [
        { nombre: "Ve un reel que nombra su dolor de feria", canal: "Instagram", accionDirecta: "Hacer clic en el enlace" },
        { nombre: "Llega a la landing del lead magnet", canal: "Landing", accionDirecta: "Visitar la landing" },
        { nombre: "Rellena sus datos para descargar la guía", canal: "Formulario", accionDirecta: "Rellenar el formulario" },
        { nombre: "Lee el lead magnet y ve el valor", canal: "PDF", accionDirecta: "Descargar el recurso" },
        { nombre: "Pulsa el CTA para saber más", canal: "Landing", accionDirecta: "Agendar una llamada" },
        { nombre: "Llamada de asesoramiento y filtrado", canal: "Llamada", accionDirecta: "Reservar una demo" },
      ],
      cierre: "El lead agenda la llamada y queda cualificado como Perfil A/B/C/D.",
    },
    {
      id: "caliente-llavero",
      nombre: "Captación caliente — Llavero en mano",
      metodoCaptacion: "Llavero en mano",
      perfil: "El Expositor",
      objetivo: "Demostrar el producto en vivo y conseguir la llamada en el momento.",
      color: "#22c55e",
      pasos: [
        { nombre: "Miguel le entrega su llavero en feria o reunión", canal: "Feria / evento", accionDirecta: "Responder el mensaje" },
        { nombre: "El prospecto toca el llavero con el móvil", canal: "Llavero NFC", accionDirecta: "Visitar la landing" },
        { nombre: "Ve la landing de demostración de Konecta", canal: "Landing", accionDirecta: "Visitar la landing" },
        { nombre: "Su contacto queda capturado en vivo", canal: "Formulario", accionDirecta: "Rellenar el formulario" },
        { nombre: "Pulsa el botón de WhatsApp directo", canal: "WhatsApp", accionDirecta: "Escribir por WhatsApp" },
      ],
      cierre: "El prospecto vive el producto y agenda la llamada con Miguel en el momento.",
    },
  ],
};
