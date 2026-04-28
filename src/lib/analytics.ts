/**
 * Thin wrapper around the Plausible Analytics global.
 * The plausible() function is injected by the Plausible script in index.html.
 * No-op when running in development or when the script hasn't loaded yet.
 */

declare global {
  // eslint-disable-next-line no-var
  var plausible: ((event: string, options?: { props?: Record<string, string | number | boolean> }) => void) | undefined
}

export function trackEvent(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
    window.plausible(event, props ? { props } : undefined)
  }
}
