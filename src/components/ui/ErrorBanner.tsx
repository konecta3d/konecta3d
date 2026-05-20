"use client";

import { useEffect, useState } from "react";

interface ErrorBannerProps {
  /** Mensaje de error. Si es null/undefined el banner no se muestra. */
  message: string | null | undefined;
  /** Variante visual. Por defecto "error". */
  variant?: "error" | "warning" | "info";
  /** Si true, el banner se cierra automáticamente tras `autoDismissMs` ms. */
  autoDismiss?: boolean;
  autoDismissMs?: number;
  /** Callback cuando el usuario cierra el banner manualmente. */
  onDismiss?: () => void;
}

const STYLES = {
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    text: "text-red-400",
    icon: (
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/25",
    text: "text-yellow-400",
    icon: (
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    text: "text-blue-400",
    icon: (
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
} as const;

export default function ErrorBanner({
  message,
  variant = "error",
  autoDismiss = false,
  autoDismissMs = 5000,
  onDismiss,
}: ErrorBannerProps) {
  const [visible, setVisible] = useState(true);

  // Resetear visibilidad cuando cambia el mensaje
  useEffect(() => {
    if (message) setVisible(true);
  }, [message]);

  // Auto-dismiss
  useEffect(() => {
    if (!autoDismiss || !message || !visible) return;
    const t = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismiss, autoDismissMs, message, visible, onDismiss]);

  if (!message || !visible) return null;

  const s = STYLES[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${s.bg} ${s.border} ${s.text}`}
    >
      {s.icon}
      <span className="flex-1 leading-relaxed">{message}</span>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity text-base leading-none"
      >
        ✕
      </button>
    </div>
  );
}
