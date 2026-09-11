"use client";

// Popup "cómo se usa" para cada opción del bloque final de la landing.
// Se muestra al seleccionar una opción (la primera vez); el usuario puede
// marcar "no volver a mostrar" (se recuerda en localStorage por opción).

interface HelpContent {
  title: string;
  body: React.ReactNode;
}

const CONTENT: Record<string, HelpContent> = {
  tools: {
    title: "Herramientas",
    body: (
      <p>
        Muestra al final de tu página tus enlaces ya creados (WhatsApp, Instagram, web…).
        Elige cuáles enseñar. Si no ves ninguno, créalos primero en{" "}
        <strong>Herramientas del negocio</strong>.
      </p>
    ),
  },
  invite: {
    title: "Invita a un amigo",
    body: (
      <p>
        Un botón para que quien visita tu página la comparta con alguien a quien
        le venga bien. Edita el título, el texto y el botón justo debajo.
      </p>
    ),
  },
  image: {
    title: "Imagen con link",
    body: (
      <div className="space-y-1.5 text-left">
        <p>Una foto que enlaza a donde quieras (típico: tu ubicación en Google Maps). Pasos:</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>Abre Google Maps y busca la ubicación de tu local.</li>
          <li>Haz una captura de pantalla.</li>
          <li>Recórtala dejando lo que te interese (la ficha o el mapa).</li>
          <li>Súbela aquí; se colocará centrada en el bloque final.</li>
          <li>Pega el enlace de esa ubicación en el campo &ldquo;enlace&rdquo;.</li>
        </ol>
      </div>
    ),
  },
};

export default function BloqueFinalHelp({
  mode,
  onClose,
}: {
  mode: string;
  onClose: () => void;
}) {
  const content = CONTENT[mode];
  if (!content) return null;

  const dontShowAgain = () => {
    try {
      localStorage.setItem(`k3d-finalhelp-${mode}`, "1");
    } catch {
      /* localStorage no disponible */
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold mb-2">{content.title}</h3>
        <div className="text-sm leading-relaxed text-[var(--foreground)]/80 mb-4">
          {content.body}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-full bg-[var(--brand-1)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Entendido
          </button>
          <button
            type="button"
            onClick={dontShowAgain}
            className="px-4 py-2 rounded-full border border-[var(--border)] text-xs text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/5 transition-colors"
          >
            No volver a mostrar
          </button>
        </div>
      </div>
    </div>
  );
}
