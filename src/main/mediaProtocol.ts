import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname } from 'node:path'
import { Readable } from 'node:stream'
import { protocol } from 'electron'
import { MEDIA_SCHEME, fromMediaUrl } from '@shared/media'

/**
 * Register the media scheme as privileged. Must be called at module load,
 * before the app `ready` event fires.
 */
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        stream: true,
        supportFetchAPI: true
      }
    }
  ])
}

const MIME_BY_EXT: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.ogv': 'video/ogg',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg'
}

function mimeFor(filePath: string): string {
  return MIME_BY_EXT[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

function toWebBody(nodeStream: Readable): ReadableStream {
  // Node Readable → Web ReadableStream, which the Fetch Response accepts.
  return Readable.toWeb(nodeStream) as unknown as ReadableStream
}

/**
 * Install the handler that streams local files WITH range-request support.
 * Range support is what lets a `<video>` element seek: when it needs to jump
 * to a timestamp it sends `Range: bytes=…` and expects a `206 Partial
 * Content` response. Without this the element can only play forward from 0.
 */
export function handleMediaProtocol(): void {
  protocol.handle(MEDIA_SCHEME, async (request) => {
    const filePath = fromMediaUrl(request.url)

    let size: number
    try {
      size = (await stat(filePath)).size
    } catch {
      return new Response('Not found', { status: 404 })
    }

    const contentType = mimeFor(filePath)
    const rangeHeader = request.headers.get('Range')

    // Full-content response (initial load / clients that don't send Range).
    if (!rangeHeader) {
      return new Response(toWebBody(createReadStream(filePath)), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(size),
          'Accept-Ranges': 'bytes'
        }
      })
    }

    // Parse "bytes=start-end" (either bound may be omitted).
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader)
    let start = match?.[1] ? Number(match[1]) : 0
    let end = match?.[2] ? Number(match[2]) : size - 1
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      return new Response('Range Not Satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${size}` }
      })
    }
    end = Math.min(end, size - 1)

    return new Response(toWebBody(createReadStream(filePath, { start, end })), {
      status: 206,
      headers: {
        'Content-Type': contentType,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes'
      }
    })
  })
}
