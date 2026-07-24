import { useState } from 'react'
import {
  CloseCircleOutlined,
  FolderOpenOutlined,
  DownOutlined,
  RightOutlined
} from '@ant-design/icons'
import { api } from '@renderer/lib/api'
import { formatDuration } from '@renderer/lib/format'
import { useJobStore } from '@renderer/store/jobStore'
import type { Job, JobStatus } from '@shared/types'
import { Badge, Button, EmptyState, ProgressBar } from '@ui'
import type { StatusTone } from '@ui'
import styles from './JobsDock.module.scss'

const STATUS_TONE: Record<JobStatus, StatusTone> = {
  queued: 'neutral',
  running: 'processing',
  completed: 'success',
  failed: 'error',
  canceled: 'warning'
}

function JobItem({ job }: { job: Job }): JSX.Element {
  const cancel = useJobStore((s) => s.cancel)
  const [expanded, setExpanded] = useState(false)

  const meta: string[] = []
  if (job.speed) meta.push(`${job.speed}`)
  if (job.fps) meta.push(`${Math.round(job.fps)} fps`)
  if (job.timemark !== undefined && job.totalDuration) {
    meta.push(`${formatDuration(job.timemark)} / ${formatDuration(job.totalDuration)}`)
  }

  return (
    <div className={styles.item}>
      <div className={styles.itemHead}>
        <button
          className={styles.expand}
          onClick={() => setExpanded((v) => !v)}
          type="button"
          aria-label="Toggle details"
        >
          {expanded ? <DownOutlined /> : <RightOutlined />}
        </button>
        <span className={styles.label} title={job.spec.output}>
          {job.label}
        </span>
        <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge>
        <div className={styles.actions}>
          {job.status === 'running' && (
            <Button
              variant="text"
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => void cancel(job.id)}
              title="Cancel"
            />
          )}
          {job.status === 'completed' && (
            <Button
              variant="text"
              size="small"
              icon={<FolderOpenOutlined />}
              onClick={() => void api.revealInFolder(job.spec.output)}
              title="Reveal in folder"
            />
          )}
        </div>
      </div>

      {(job.status === 'running' || job.status === 'completed') && (
        <div className={styles.progress}>
          <ProgressBar
            value={job.progress}
            tone={job.status === 'completed' ? 'success' : 'processing'}
          />
        </div>
      )}

      {meta.length > 0 && job.status === 'running' && (
        <div className={styles.meta}>{meta.join('  ·  ')}</div>
      )}

      {job.status === 'failed' && job.error && <div className={styles.error}>{job.error}</div>}

      {expanded && (
        <div className={styles.details}>
          <code className={styles.command}>{job.command}</code>
          {job.logTail.length > 0 && (
            <pre className={styles.log}>{job.logTail.slice(-40).join('\n')}</pre>
          )}
        </div>
      )}
    </div>
  )
}

export function JobsDock(): JSX.Element {
  const jobs = useJobStore((s) => s.jobs)
  const running = jobs.filter((j) => j.status === 'running').length

  return (
    <div className={styles.dock}>
      <header className={styles.header}>
        <span className={styles.title}>Jobs</span>
        {running > 0 && <Badge tone="processing">{running} running</Badge>}
      </header>
      <div className={styles.list}>
        {jobs.length === 0 ? (
          <div className={styles.empty}>
            <EmptyState description="No jobs yet" />
          </div>
        ) : (
          jobs.map((job) => <JobItem key={job.id} job={job} />)
        )}
      </div>
    </div>
  )
}
