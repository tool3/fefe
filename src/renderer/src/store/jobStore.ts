import { create } from 'zustand'
import type { Job, JobSpec } from '@shared/types'
import { api } from '@renderer/lib/api'
import { notify } from '@ui'

const LOG_TAIL_LIMIT = 200

interface JobState {
  jobs: Job[]
  initialized: boolean
  /** Wire up event listeners once; returns an unsubscribe. */
  init: () => () => void
  start: (spec: JobSpec) => Promise<Job | null>
  cancel: (id: string) => Promise<void>
}

function patch(jobs: Job[], id: string, update: Partial<Job>): Job[] {
  return jobs.map((j) => (j.id === id ? { ...j, ...update } : j))
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  initialized: false,

  init: () => {
    if (get().initialized) return () => undefined
    set({ initialized: true })

    void api.listJobs().then((jobs) => set({ jobs: jobs.slice().reverse() }))

    const unsubs = [
      api.onJobCreated(({ job }) => {
        set((s) => ({
          jobs: [job, ...s.jobs.filter((j) => j.id !== job.id)]
        }))
      }),
      api.onJobProgress((e) => {
        set((s) => ({
          jobs: patch(s.jobs, e.id, {
            progress: e.progress,
            timemark: e.timemark,
            fps: e.fps,
            speed: e.speed
          })
        }))
      }),
      api.onJobStatus((e) => {
        const update: Partial<Job> = {
          status: e.status,
          error: e.error,
          endedAt: e.endedAt
        }
        if (e.status === 'completed') update.progress = 1
        set((s) => ({ jobs: patch(s.jobs, e.id, update) }))
        if (e.status === 'completed') notify.success('Job completed')
        else if (e.status === 'failed') notify.error(`Job failed: ${e.error ?? 'unknown error'}`)
      }),
      api.onJobLog((e) => {
        set((s) => ({
          jobs: s.jobs.map((j) => {
            if (j.id !== e.id) return j
            const logTail = [...j.logTail, e.line]
            if (logTail.length > LOG_TAIL_LIMIT) logTail.shift()
            return { ...j, logTail }
          })
        }))
      })
    ]

    return () => {
      unsubs.forEach((u) => u())
      set({ initialized: false })
    }
  },

  start: async (spec) => {
    try {
      const job = await api.startJob(spec)
      // The 'created' event will also arrive; de-dup handled in the reducer.
      set((s) => ({ jobs: [job, ...s.jobs.filter((j) => j.id !== job.id)] }))
      notify.info('Job queued')
      return job
    } catch (err) {
      notify.error(`Failed to start job: ${(err as Error).message}`)
      return null
    }
  },

  cancel: async (id) => {
    const ok = await api.cancelJob(id)
    if (ok) notify.info('Cancelling…')
  }
}))
