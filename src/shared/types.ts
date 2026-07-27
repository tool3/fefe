/**
 * Shared type contracts used across the main, preload and renderer processes.
 * This file is the single source of truth for the IPC data model.
 */

// ---------------------------------------------------------------------------
// Media inspection (ffprobe)
// ---------------------------------------------------------------------------

export type StreamKind = 'video' | 'audio' | 'subtitle' | 'data' | 'attachment'

export interface MediaStream {
  index: number
  kind: StreamKind
  codecName?: string
  codecLongName?: string
  profile?: string
  width?: number
  height?: number
  pixelFormat?: string
  frameRate?: number
  bitRate?: number
  sampleRate?: number
  channels?: number
  channelLayout?: string
  duration?: number
  language?: string
  title?: string
}

export interface MediaFormat {
  formatName?: string
  formatLongName?: string
  duration?: number
  size?: number
  bitRate?: number
  nbStreams?: number
}

export interface MediaInfo {
  path: string
  fileName: string
  format: MediaFormat
  streams: MediaStream[]
}

// ---------------------------------------------------------------------------
// Job specifications (renderer → main)
// ---------------------------------------------------------------------------

export type VideoCodec = 'copy' | 'libx264' | 'libx265' | 'libvpx-vp9' | 'none'
export type AudioCodec = 'copy' | 'aac' | 'libmp3lame' | 'libopus' | 'none'
export type Container =
  | 'mp4'
  | 'mkv'
  | 'webm'
  | 'mov'
  | 'gif'
  | 'mp3'
  | 'wav'
  | 'm4a'
  | 'flac'

export interface ConvertOptions {
  container: Container
  videoCodec: VideoCodec
  audioCodec: AudioCodec
  /** Constant Rate Factor — quality-based encoding (lower = better). */
  crf?: number
  /** Target video bitrate, e.g. "2M". Overrides CRF when set. */
  videoBitrate?: string
  /** Target audio bitrate, e.g. "192k". */
  audioBitrate?: string
  /** x264/x265 speed preset. */
  preset?: string
  /** Output width in px; use -1 to preserve aspect ratio. */
  width?: number
  /** Output height in px; use -1 to preserve aspect ratio. */
  height?: number
  fps?: number
}

export interface TrimOptions {
  /** Start time in seconds. */
  start: number
  /** End time in seconds. */
  end: number
  /** When false, uses stream copy (fast, lossless). */
  reencode: boolean
}

// ---- Merge / concat ----
export type ConcatMode = 'copy' | 'reencode'
export interface ConcatOptions {
  /** 'copy' requires identical codecs/params; 'reencode' normalizes them. */
  mode: ConcatMode
}

// ---- Rescale / aspect ratio ----
export type ScaleMode = 'fit' | 'stretch' | 'pad' | 'crop'
export interface ScaleOptions {
  width: number
  height: number
  /**
   * fit    — scale within the box, preserve aspect (may be smaller than box)
   * stretch— force exact dimensions, ignore aspect
   * pad    — fit then letterbox/pillarbox to exact dimensions
   * crop   — fill then crop overflow to exact dimensions
   */
  mode: ScaleMode
  /** Pad colour for 'pad' mode (ffmpeg colour name or #rrggbb). */
  padColor?: string
}

// ---- Frames / thumbnails ----
export type FrameFormat = 'png' | 'jpg'
export type FramesMode = 'single' | 'interval' | 'segment'
export interface FramesOptions {
  /**
   * 'single'   grabs one frame at `timestamp`
   * 'interval' dumps frames across the whole input
   * 'segment'  dumps every frame between `start` and `end`
   */
  mode: FramesMode
  /** Timestamp in seconds for single-frame mode. */
  timestamp?: number
  /** Seconds between frames for interval mode. */
  intervalSeconds?: number
  /**
   * Capture this many frames per second. In 'interval' mode it is an
   * alternative to `intervalSeconds`; in 'segment' mode it subsamples the
   * segment (omit to keep every frame).
   */
  fps?: number
  /** Segment start in seconds (segment mode). */
  start?: number
  /** Segment end in seconds (segment mode). */
  end?: number
  format: FrameFormat
  /** JPEG quality 2 (best) – 31 (worst). */
  quality?: number
}

// ---- Subtitles ----
export type SubtitleMode = 'burn' | 'mux'
export interface SubtitleOptions {
  subtitlePath: string
  /** 'burn' hardcodes into the frames; 'mux' adds a soft, toggleable track. */
  mode: SubtitleMode
}

// ---- Audio ----
export type AudioMode = 'adjust' | 'replace'
export interface AudioOptions {
  mode: AudioMode
  /** Volume multiplier ("2.0") or gain ("6dB"). */
  volume?: string
  /** Audio delay in seconds for A/V sync (may be negative). */
  delaySeconds?: number
  /** Replacement audio file, for 'replace' mode. */
  replacementAudioPath?: string
  /** Whether the input has a video stream (affects stream mapping). */
  hasVideo: boolean
}

export type JobSpec =
  | { kind: 'convert'; input: string; output: string; options: ConvertOptions }
  | { kind: 'trim'; input: string; output: string; options: TrimOptions }
  | { kind: 'concat'; inputs: string[]; output: string; options: ConcatOptions }
  | { kind: 'scale'; input: string; output: string; options: ScaleOptions }
  | { kind: 'frames'; input: string; output: string; options: FramesOptions }
  | { kind: 'subtitles'; input: string; output: string; options: SubtitleOptions }
  | { kind: 'audio'; input: string; output: string; options: AudioOptions }
  | { kind: 'custom'; input: string; output: string; args: string[] }

export type JobKind = JobSpec['kind']

// ---------------------------------------------------------------------------
// Job runtime state (main is authoritative; renderer mirrors it)
// ---------------------------------------------------------------------------

export type JobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'canceled'

export interface Job {
  id: string
  label: string
  spec: JobSpec
  status: JobStatus
  /** 0..1, or -1 when total duration is unknown. */
  progress: number
  speed?: string
  fps?: number
  /** Seconds of media processed so far. */
  timemark?: number
  totalDuration?: number
  createdAt: number
  startedAt?: number
  endedAt?: number
  error?: string
  /** Resolved ffmpeg command line, for transparency. */
  command?: string
  logTail: string[]
}

// ---------------------------------------------------------------------------
// Events (main → renderer)
// ---------------------------------------------------------------------------

export interface JobProgressEvent {
  id: string
  progress: number
  timemark: number
  fps?: number
  speed?: string
  frame?: number
  bitrate?: string
}

export interface JobStatusEvent {
  id: string
  status: JobStatus
  error?: string
  endedAt?: number
}

export interface JobLogEvent {
  id: string
  line: string
}

export interface JobCreatedEvent {
  job: Job
}

// ---------------------------------------------------------------------------
// Misc IPC payloads
// ---------------------------------------------------------------------------

export interface SaveDialogRequest {
  defaultPath?: string
  filters?: { name: string; extensions: string[] }[]
}

export interface PickFilesRequest {
  multi?: boolean
  filters?: { name: string; extensions: string[] }[]
}

export interface SuggestOutputRequest {
  input: string
  /** Output extension (a Container, or e.g. "png"/"jpg"/"srt"). */
  container: string
  suffix?: string
}
