import { execFile } from 'node:child_process'
import { basename } from 'node:path'
import { promisify } from 'node:util'
import type { MediaInfo, MediaStream, StreamKind } from '@shared/types'
import { ffprobePath } from './binaries'

const execFileAsync = promisify(execFile)

interface RawStream {
  index: number
  codec_type?: string
  codec_name?: string
  codec_long_name?: string
  profile?: string
  width?: number
  height?: number
  pix_fmt?: string
  r_frame_rate?: string
  avg_frame_rate?: string
  bit_rate?: string
  sample_rate?: string
  channels?: number
  channel_layout?: string
  duration?: string
  tags?: Record<string, string>
}

interface RawProbe {
  format?: {
    format_name?: string
    format_long_name?: string
    duration?: string
    size?: string
    bit_rate?: string
    nb_streams?: number
  }
  streams?: RawStream[]
}

function num(v: string | number | undefined): number | undefined {
  if (v === undefined) return undefined
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** Parse "30000/1001" style rational frame rates into a decimal. */
function parseRate(v: string | undefined): number | undefined {
  if (!v) return undefined
  const [a, b] = v.split('/')
  const den = Number(b)
  const numr = Number(a)
  if (!Number.isFinite(numr) || !Number.isFinite(den) || den === 0) return undefined
  const r = numr / den
  return r > 0 ? Math.round(r * 1000) / 1000 : undefined
}

function toStreamKind(codecType: string | undefined): StreamKind {
  switch (codecType) {
    case 'video':
    case 'audio':
    case 'subtitle':
    case 'attachment':
      return codecType
    default:
      return 'data'
  }
}

function mapStream(s: RawStream): MediaStream {
  return {
    index: s.index,
    kind: toStreamKind(s.codec_type),
    codecName: s.codec_name,
    codecLongName: s.codec_long_name,
    profile: s.profile,
    width: s.width,
    height: s.height,
    pixelFormat: s.pix_fmt,
    frameRate: parseRate(s.avg_frame_rate) ?? parseRate(s.r_frame_rate),
    bitRate: num(s.bit_rate),
    sampleRate: num(s.sample_rate),
    channels: s.channels,
    channelLayout: s.channel_layout,
    duration: num(s.duration),
    language: s.tags?.language,
    title: s.tags?.title
  }
}

export async function probe(path: string): Promise<MediaInfo> {
  const { stdout } = await execFileAsync(
    ffprobePath,
    [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      path
    ],
    { maxBuffer: 32 * 1024 * 1024 }
  )

  const raw = JSON.parse(stdout) as RawProbe
  return {
    path,
    fileName: basename(path),
    format: {
      formatName: raw.format?.format_name,
      formatLongName: raw.format?.format_long_name,
      duration: num(raw.format?.duration),
      size: num(raw.format?.size),
      bitRate: num(raw.format?.bit_rate),
      nbStreams: raw.format?.nb_streams
    },
    streams: (raw.streams ?? []).map(mapStream)
  }
}

/** Best-effort duration lookup used to compute job progress percentages. */
export async function probeDuration(path: string): Promise<number | undefined> {
  try {
    const info = await probe(path)
    return info.format.duration
  } catch {
    return undefined
  }
}
