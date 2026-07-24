import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'

/**
 * In a packaged app the binaries live inside `app.asar`, which cannot be
 * executed. electron-builder copies them to `app.asar.unpacked` (see
 * `asarUnpack` in electron-builder.yml); rewrite the path accordingly.
 */
function resolveBinary(p: string | null | undefined, fallback: string): string {
  if (!p) return fallback
  return p.replace('app.asar', 'app.asar.unpacked')
}

export const ffmpegPath: string = resolveBinary(ffmpegStatic, 'ffmpeg')
export const ffprobePath: string = resolveBinary(ffprobeStatic?.path, 'ffprobe')
