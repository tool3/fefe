import { EventEmitter } from 'node:events'
import { basename } from 'node:path'
import type {
  Job,
  JobLogEvent,
  JobProgressEvent,
  JobSpec,
  JobStatus,
  JobStatusEvent
} from '@shared/types'
import { ffmpegPath } from './binaries'
import type { BuildContext } from './buildArgs'
import { buildArgs, renderCommand } from './buildArgs'
import { writeConcatList } from './concat'
import { probeDuration } from './probe'
import { FfmpegRunner } from './runner'

const LOG_TAIL_LIMIT = 200

interface JobEntry {
  job: Job
  runner: FfmpegRunner | null
}

function makeLabel(spec: JobSpec): string {
  const out = basename(spec.output)
  switch (spec.kind) {
    case 'convert':
      return `Convert → ${out}`
    case 'trim':
      return `Trim → ${out}`
    case 'concat':
      return `Merge (${spec.inputs.length}) → ${out}`
    case 'scale':
      return `Rescale → ${out}`
    case 'frames':
      return `Frames → ${out}`
    case 'subtitles':
      return `Subtitles → ${out}`
    case 'audio':
      return `Audio → ${out}`
    case 'custom':
      return `Custom → ${out}`
  }
}

/** Expected duration (seconds) of the output, for progress percentages. */
async function estimateDuration(spec: JobSpec): Promise<number | undefined> {
  switch (spec.kind) {
    case 'trim':
      return Math.max(0, spec.options.end - spec.options.start)
    case 'concat': {
      const durations = await Promise.all(spec.inputs.map((p) => probeDuration(p)))
      const total = durations.reduce<number>((sum, d) => sum + (d ?? 0), 0)
      return total > 0 ? total : undefined
    }
    case 'frames':
      // A single-frame grab finishes ~instantly; a segment spans its own
      // range; interval spans the whole input.
      if (spec.options.mode === 'single') return undefined
      if (spec.options.mode === 'segment') {
        const { start = 0, end = 0 } = spec.options
        return Math.max(0, end - start)
      }
      return probeDuration(spec.input)
    default:
      return probeDuration(spec.input)
  }
}

/** Per-kind preparation that must happen before ffmpeg is spawned. */
async function prepareContext(spec: JobSpec): Promise<BuildContext> {
  if (spec.kind === 'concat') {
    return { concatListPath: await writeConcatList(spec.inputs) }
  }
  return {}
}

export interface JobManagerEvents {
  created: (job: Job) => void
  progress: (e: JobProgressEvent) => void
  status: (e: JobStatusEvent) => void
  log: (e: JobLogEvent) => void
}

export class JobManager {
  private readonly emitter = new EventEmitter()
  private readonly jobs = new Map<string, JobEntry>()
  private counter = 0

  on<E extends keyof JobManagerEvents>(event: E, listener: JobManagerEvents[E]): void {
    this.emitter.on(event, listener as (...args: unknown[]) => void)
  }

  private nextId(): string {
    this.counter += 1
    return `job_${Date.now().toString(36)}_${this.counter}`
  }

  list(): Job[] {
    return [...this.jobs.values()].map((e) => e.job)
  }

  async start(spec: JobSpec): Promise<Job> {
    const id = this.nextId()
    const ctx = await prepareContext(spec)
    const args = buildArgs(spec, ctx)
    const totalDuration = await estimateDuration(spec)

    const job: Job = {
      id,
      label: makeLabel(spec),
      spec,
      status: 'running',
      progress: totalDuration ? 0 : -1,
      totalDuration,
      createdAt: Date.now(),
      startedAt: Date.now(),
      command: renderCommand('ffmpeg', args),
      logTail: []
    }

    const entry: JobEntry = { job, runner: null }
    this.jobs.set(id, entry)
    this.emitter.emit('created', job)

    const runner = new FfmpegRunner(ffmpegPath, args, {
      onProgress: (u) => {
        job.timemark = u.timemark
        job.fps = u.fps
        job.speed = u.speed
        if (totalDuration && totalDuration > 0) {
          job.progress = Math.min(1, u.timemark / totalDuration)
        }
        const evt: JobProgressEvent = {
          id,
          progress: job.progress,
          timemark: u.timemark,
          fps: u.fps,
          speed: u.speed,
          frame: u.frame,
          bitrate: u.bitrate
        }
        this.emitter.emit('progress', evt)
      },
      onLog: (line) => {
        job.logTail.push(line)
        if (job.logTail.length > LOG_TAIL_LIMIT) job.logTail.shift()
        this.emitter.emit('log', { id, line } satisfies JobLogEvent)
      },
      onDone: ({ code, canceled, error }) => {
        let status: JobStatus
        if (canceled) status = 'canceled'
        else if (code === 0) status = 'completed'
        else status = 'failed'

        job.status = status
        job.endedAt = Date.now()
        job.error = error
        if (status === 'completed') job.progress = 1
        this.emitter.emit('status', {
          id,
          status,
          error,
          endedAt: job.endedAt
        } satisfies JobStatusEvent)
      }
    })

    entry.runner = runner
    runner.start()
    return job
  }

  cancel(id: string): boolean {
    const entry = this.jobs.get(id)
    if (!entry || !entry.runner) return false
    if (entry.job.status !== 'running') return false
    entry.runner.cancel()
    return true
  }
}
