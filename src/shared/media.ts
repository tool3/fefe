/**
 * Custom protocol used to stream local media files into the renderer without
 * relaxing the CSP to allow raw `file://` access. The main process registers a
 * handler for this scheme (see main/mediaProtocol.ts).
 */
export const MEDIA_SCHEME = 'fefe-media'

/** Build a renderable URL for a local file path. */
export function toMediaUrl(filePath: string): string {
  return `${MEDIA_SCHEME}://local/${encodeURIComponent(filePath)}`
}

/** Reverse of {@link toMediaUrl}: extract the file path from a media URL. */
export function fromMediaUrl(url: string): string {
  const { pathname } = new URL(url)
  return decodeURIComponent(pathname.replace(/^\//, ''))
}
