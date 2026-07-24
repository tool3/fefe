import { useEffect, useState } from 'react'
import { ScissorOutlined } from '@ant-design/icons'
import { MediaPreview } from '@renderer/components/MediaPreview'
import { OutputPathField } from '@renderer/components/OutputPathField'
import { api } from '@renderer/lib/api'
import { formatDuration } from '@renderer/lib/format'
import { useJobStore } from '@renderer/store/jobStore'
import type { Container, MediaInfo } from '@shared/types'
import { Button, Field, Panel, RangeSlider, Switch, notify } from '@ui'
import styles from './TrimPanel.module.scss'

/** Guess an output container that matches the source extension. */
function containerFromPath(path: string): Container {
  const ext = path.split('.').pop()?.toLowerCase()
  const known: Container[] = ['mp4', 'mkv', 'webm', 'mov', 'mp3', 'm4a', 'wav', 'flac']
  return (known.find((c) => c === ext) ?? 'mp4') as Container
}

export function TrimPanel({ media }: { media: MediaInfo }): JSX.Element {
  const startJob = useJobStore((s) => s.start)
  const duration = media.format.duration ?? 0

  const [range, setRange] = useState<[number, number]>([0, duration])
  // The time the preview frame should show — the handle currently being dragged.
  const [previewTime, setPreviewTime] = useState(0)
  const [reencode, setReencode] = useState(false)
  const [output, setOutput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const container = containerFromPath(media.path)

  // Move the previewed frame to whichever handle the user is dragging.
  const onRangeChange = (next: [number, number]): void => {
    const [ns, ne] = next
    const [ps, pe] = range
    if (ns !== ps) setPreviewTime(ns)
    else if (ne !== pe) setPreviewTime(ne)
    setRange(next)
  }

  // Reset range + suggested output when the active file changes.
  useEffect(() => {
    setRange([0, media.format.duration ?? 0])
    setPreviewTime(0)
    let cancelled = false
    void api
      .suggestOutput({ input: media.path, container: containerFromPath(media.path), suffix: 'trim' })
      .then((p) => {
        if (!cancelled) setOutput(p)
      })
    return () => {
      cancelled = true
    }
  }, [media.path, media.format.duration])

  const [start, end] = range
  const selected = Math.max(0, end - start)

  const onSubmit = async (): Promise<void> => {
    if (!output) {
      notify.warning('Choose an output path first')
      return
    }
    if (selected <= 0) {
      notify.warning('Select a non-empty range')
      return
    }
    setSubmitting(true)
    try {
      await startJob({
        kind: 'trim',
        input: media.path,
        output,
        options: { start, end, reencode }
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Panel title="Trim / cut">
      <div className={styles.preview}>
        <MediaPreview media={media} start={start} end={end} previewTime={previewTime} />
      </div>

      <Field label="Selection">
        <div className={styles.sliderWrap}>
          <RangeSlider
            value={range}
            min={0}
            max={duration || 1}
            step={0.05}
            onChange={onRangeChange}
            tooltipFormatter={(v) => formatDuration(v, true)}
          />
        </div>
      </Field>

      <div className={styles.times}>
        <div className={styles.time}>
          <span className={styles.timeLabel}>Start</span>
          <span className={styles.timeValue}>{formatDuration(start, true)}</span>
        </div>
        <div className={styles.time}>
          <span className={styles.timeLabel}>End</span>
          <span className={styles.timeValue}>{formatDuration(end, true)}</span>
        </div>
        <div className={styles.time}>
          <span className={styles.timeLabel}>Duration</span>
          <span className={styles.timeValue}>{formatDuration(selected, true)}</span>
        </div>
      </div>

      <Field
        label="Re-encode"
        hint={
          reencode
            ? 'Frame-accurate cut (slower, re-encodes video/audio)'
            : 'Fast lossless cut via stream copy (snaps to keyframes)'
        }
      >
        <div className={styles.inlineControl}>
          <Switch checked={reencode} onChange={setReencode} />
        </div>
      </Field>

      <div className={styles.footer}>
        <OutputPathField value={output} onChange={setOutput} ext={container} />
        <Button
          variant="primary"
          icon={<ScissorOutlined />}
          loading={submitting}
          onClick={() => void onSubmit()}
        >
          Trim
        </Button>
      </div>
    </Panel>
  )
}
