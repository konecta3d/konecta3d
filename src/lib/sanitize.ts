/**
 * Escape HTML special characters to prevent XSS attacks
 * when user input is interpolated into HTML templates.
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitize a URL to prevent javascript: protocol attacks.
 * Returns '#' for invalid or javascript: URLs.
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (trimmed.startsWith("javascript:")) return "#";
  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    !trimmed.startsWith("/") &&
    !trimmed.startsWith("#")
  ) {
    return "#";
  }
  return trimmed;
}

/**
 * Sanitize a filename to prevent path traversal attacks.
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}
