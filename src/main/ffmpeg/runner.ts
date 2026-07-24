import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process'

export interface ProgressUpdate {
  timemark: number
  fps?: number
  speed?: string
  frame?: number
  bitrate?: string
}

export interface RunnerCallbacks {
  onProgress: (u: ProgressUpdate) => void
  onLog: (line: string) => void
  onDone: (result: { code: number | null; canceled: boolean; error?: string }) => void
}

/**
 * Owns a single spawned ffmpeg process. Progress arrives as `key=value` lines
 * on stdout (via `-progress pipe:1`); human-readable logs and errors arrive on
 * stderr.
 */
export class FfmpegRunner {
  private child: ChildProcessWithoutNullStreams | null = null
  private canceled = false
  private stdoutBuf = ''
  private stderrBuf = ''
  private pending: Partial<ProgressUpdate> = {}

  constructor(
    private readonly ffmpegPath: string,
    private readonly args: string[],
    private readonly cb: RunnerCallbacks
  ) {}

  start(): void {
    const child = spawn(this.ffmpegPath, this.args, {
      windowsHide: true
    })
    this.child = child

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')

    child.stdout.on('data', (chunk: string) => this.consumeStdout(chunk))
    child.stderr.on('data', (chunk: string) => this.consumeStderr(chunk))

    child.on('error', (err) => {
      this.cb.onDone({ code: null, canceled: this.canceled, error: err.message })
    })

    child.on('close', (code) => {
      const errorTail = this.stderrBuf.trim().split('\n').slice(-4).join('\n')
      this.cb.onDone({
        code,
        canceled: this.canceled,
        error:
          code === 0 || this.canceled
            ? undefined
            : errorTail || `ffmpeg exited with code ${code}`
      })
    })
  }

  cancel(): void {
    if (!this.child) return
    this.canceled = true
    // SIGTERM lets ffmpeg finalize; force-kill shortly after if it lingers.
    this.child.kill('SIGTERM')
    const child = this.child
    setTimeout(() => {
      if (!child.killed) child.kill('SIGKILL')
    }, 2000)
  }

  private consumeStdout(chunk: string): void {
    this.stdoutBuf += chunk
    let idx: number
    while ((idx = this.stdoutBuf.indexOf('\n')) !== -1) {
      const line = this.stdoutBuf.slice(0, idx).trim()
      this.stdoutBuf = this.stdoutBuf.slice(idx + 1)
      this.parseProgressLine(line)
    }
  }

  private consumeStderr(chunk: string): void {
    this.stderrBuf += chunk
    let idx: number
    while ((idx = this.stderrBuf.indexOf('\n')) !== -1) {
      const line = this.stderrBuf.slice(0, idx).replace(/\r/g, '').trim()
      this.stderrBuf = this.stderrBuf.slice(idx + 1)
      // keep only a bounded tail in the buffer used for error reporting
      if (line) this.cb.onLog(line)
    }
    if (this.stderrBuf.length > 16_000) {
      this.stderrBuf = this.stderrBuf.slice(-8_000)
    }
  }

  private parseProgressLine(line: string): void {
    const eq = line.indexOf('=')
    if (eq === -1) return
    const key = line.slice(0, eq)
    const value = line.slice(eq + 1)

    switch (key) {
      case 'out_time_us':
      case 'out_time_ms': {
        // ffmpeg confusingly reports microseconds under out_time_ms too.
        const micros = Number(value)
        if (Number.isFinite(micros)) this.pending.timemark = micros / 1_000_000
        break
      }
      case 'frame': {
        const f = Number(value)
        if (Number.isFinite(f)) this.pending.frame = f
        break
      }
      case 'fps': {
        const f = Number(value)
        if (Number.isFinite(f) && f > 0) this.pending.fps = f
        break
      }
      case 'bitrate':
        if (value && value !== 'N/A') this.pending.bitrate = value.trim()
        break
      case 'speed':
        if (value && value !== 'N/A') this.pending.speed = value.trim()
        break
      case 'progress':
        // "continue" or "end" — marks the end of a progress block; flush it.
        if (this.pending.timemark !== undefined) {
          this.cb.onProgress({
            timemark: this.pending.timemark,
            fps: this.pending.fps,
            speed: this.pending.speed,
            frame: this.pending.frame,
            bitrate: this.pending.bitrate
          })
        }
        this.pending = {}
        break
      default:
        break
    }
  }
}
