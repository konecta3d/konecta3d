/**
 * Convierte una URL de vídeo en una URL embebible (iframe) si es de YouTube/Vimeo.
 * Devuelve null si no reconoce el proveedor (se tratará como archivo directo o enlace externo).
 */
export function toEmbedUrl(url: string): string | null {
  const u = (url || "").trim();
  // YouTube: youtu.be/ID | youtube.com/watch?v=ID | youtube.com/embed/ID | shorts/ID
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo: vimeo.com/ID
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

/** True si la URL apunta a un archivo de vídeo directo (.mp4/.webm/.ogg). */
export function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test((url || "").trim());
}
