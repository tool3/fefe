/** Human-readable formatting helpers used across features. */

export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[i]}`
}

export function formatBitrate(bitsPerSec: number | undefined): string {
  if (bitsPerSec === undefined || !Number.isFinite(bitsPerSec)) return '—'
  if (bitsPerSec >= 1_000_000) return `${(bitsPerSec / 1_000_000).toFixed(1)} Mbps`
  if (bitsPerSec >= 1000) return `${Math.round(bitsPerSec / 1000)} kbps`
  return `${bitsPerSec} bps`
}

/** Seconds → HH:MM:SS.mmm (millis only when fractional). */
export function formatDuration(seconds: number | undefined, withMillis = false): string {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return '—'
  const whole = Math.floor(seconds)
  const h = Math.floor(whole / 3600)
  const m = Math.floor((whole % 3600) / 60)
  const s = whole % 60
  const pad = (n: number): string => n.toString().padStart(2, '0')
  const base = `${pad(h)}:${pad(m)}:${pad(s)}`
  if (!withMillis) return base
  const ms = Math.round((seconds - whole) * 1000)
  return `${base}.${ms.toString().padStart(3, '0')}`
}

/** Parse "HH:MM:SS(.mmm)" or plain seconds into seconds. */
export function parseTimecode(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed === '') return null
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)
  const parts = trimmed.split(':').map(Number)
  if (parts.some((p) => !Number.isFinite(p))) return null
  let seconds = 0
  for (const p of parts) seconds = seconds * 60 + p
  return seconds
}

export function formatResolution(w?: number, h?: number): string {
  if (!w || !h) return '—'
  return `${w}×${h}`
}
