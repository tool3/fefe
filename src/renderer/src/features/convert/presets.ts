import type { AudioCodec, Container, VideoCodec } from '@shared/types'
import type { Option } from '@ui'

export const CONTAINER_OPTIONS: Option<Container>[] = [
  { label: 'MP4', value: 'mp4' },
  { label: 'MKV', value: 'mkv' },
  { label: 'WebM', value: 'webm' },
  { label: 'MOV', value: 'mov' },
  { label: 'GIF (video only)', value: 'gif' },
  { label: 'MP3 (audio only)', value: 'mp3' },
  { label: 'M4A (audio only)', value: 'm4a' },
  { label: 'WAV (audio only)', value: 'wav' },
  { label: 'FLAC (audio only)', value: 'flac' }
]

export const VIDEO_CODEC_OPTIONS: Option<VideoCodec>[] = [
  { label: 'H.264 (libx264)', value: 'libx264' },
  { label: 'H.265 / HEVC (libx265)', value: 'libx265' },
  { label: 'VP9 (libvpx-vp9)', value: 'libvpx-vp9' },
  { label: 'Copy (no re-encode)', value: 'copy' },
  { label: 'None (drop video)', value: 'none' }
]

export const AUDIO_CODEC_OPTIONS: Option<AudioCodec>[] = [
  { label: 'AAC', value: 'aac' },
  { label: 'MP3 (libmp3lame)', value: 'libmp3lame' },
  { label: 'Opus (libopus)', value: 'libopus' },
  { label: 'Copy (no re-encode)', value: 'copy' },
  { label: 'None (drop audio)', value: 'none' }
]

export const PRESET_OPTIONS: Option<string>[] = [
  'ultrafast',
  'superfast',
  'veryfast',
  'faster',
  'fast',
  'medium',
  'slow',
  'slower',
  'veryslow'
].map((p) => ({ label: p, value: p }))

export const AUDIO_BITRATE_OPTIONS: Option<string>[] = [
  '96k',
  '128k',
  '192k',
  '256k',
  '320k'
].map((b) => ({ label: b, value: b }))

/** Containers that carry only audio — video controls are hidden for these. */
export const AUDIO_ONLY_CONTAINERS: Container[] = ['mp3', 'm4a', 'wav', 'flac']

/** Sensible default codecs per container. */
export function defaultsForContainer(container: Container): {
  videoCodec: VideoCodec
  audioCodec: AudioCodec
} {
  switch (container) {
    case 'webm':
      return { videoCodec: 'libvpx-vp9', audioCodec: 'libopus' }
    case 'mp3':
      return { videoCodec: 'none', audioCodec: 'libmp3lame' }
    case 'wav':
      return { videoCodec: 'none', audioCodec: 'copy' }
    case 'flac':
      return { videoCodec: 'none', audioCodec: 'copy' }
    case 'm4a':
      return { videoCodec: 'none', audioCodec: 'aac' }
    case 'gif':
      return { videoCodec: 'libx264', audioCodec: 'none' }
    default:
      return { videoCodec: 'libx264', audioCodec: 'aac' }
  }
}

export function codecUsesCrf(codec: VideoCodec): boolean {
  return codec === 'libx264' || codec === 'libx265' || codec === 'libvpx-vp9'
}

export function codecUsesPreset(codec: VideoCodec): boolean {
  return codec === 'libx264' || codec === 'libx265'
}
