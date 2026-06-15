// ─── Configuración de la agenda de citas de la feria (post-FYCMA) ─────────────
// Editable: cambia franjas, agentes o duración aquí y se regenera todo.
// Las horas son LOCALES de España. En junio España va en CEST (UTC+2).
// Si algún día cae en horario de invierno, ajusta TZ_OFFSET a "+01:00".

export const SLOT_MIN = 40;          // minutos por hueco (30 de llamada + 10 de colchón)
export const TZ_OFFSET = "+02:00";   // CEST (verano España)

export interface Franja {
  desde: string; // "HH:MM"
  hasta: string; // "HH:MM"
}

export interface DiaAgenda {
  fecha: string;  // "YYYY-MM-DD"
  label: string;  // "Lunes 22"
  agentes: Record<string, Franja[]>;
}

// Franjas borrador (lun 22 – jue 25 jun 2026). Edítalas a tu gusto.
// Miguel y Miriam comparten el mismo horario.
const FRANJAS: Franja[] = [
  { desde: "10:00", hasta: "14:00" },
  { desde: "16:30", hasta: "19:00" },
];

export const AGENDA_DIAS: DiaAgenda[] = [
  { fecha: "2026-06-22", label: "Lunes 22",     agentes: { Miriam: FRANJAS, Miguel: FRANJAS } },
  { fecha: "2026-06-23", label: "Martes 23",    agentes: { Miriam: FRANJAS, Miguel: FRANJAS } },
  { fecha: "2026-06-24", label: "Miércoles 24", agentes: { Miriam: FRANJAS, Miguel: FRANJAS } },
  { fecha: "2026-06-25", label: "Jueves 25",    agentes: { Miriam: FRANJAS, Miguel: FRANJAS } },
];

export const AGENTES = ["Miguel", "Miriam"] as const;

export interface Slot {
  iso: string;   // "2026-06-22T17:00:00+02:00"
  ms: number;    // instante en epoch ms (para comparar con citas guardadas)
  label: string; // "17:00"
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Genera los huecos candidatos de un agente en un día, según sus franjas. */
export function generarSlots(fecha: string, franjas: Franja[], slotMin = SLOT_MIN): Slot[] {
  const slots: Slot[] = [];
  for (const fr of franjas) {
    const ini = toMinutes(fr.desde);
    const fin = toMinutes(fr.hasta);
    for (let t = ini; t + slotMin <= fin; t += slotMin) {
      const hh = pad(Math.floor(t / 60));
      const mm = pad(t % 60);
      const iso = `${fecha}T${hh}:${mm}:00${TZ_OFFSET}`;
      slots.push({ iso, ms: Date.parse(iso), label: `${hh}:${mm}` });
    }
  }
  return slots;
}

/** Etiqueta de hora local (España) para un instante guardado. */
export function horaLabel(inicio: string): string {
  return new Date(inicio).toLocaleTimeString("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
  });
}
