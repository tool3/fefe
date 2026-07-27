import { useEffect, useState } from 'react'
import { PictureOutlined } from '@ant-design/icons'
import { MediaPreview } from '@renderer/components/MediaPreview'
import { OutputPathField } from '@renderer/components/OutputPathField'
import { api } from '@renderer/lib/api'
import { formatDuration } from '@renderer/lib/format'
import { useJobStore } from '@renderer/store/jobStore'
import type { FrameFormat, FramesMode, MediaInfo } from '@shared/types'
import { Button, Field, NumberField, Panel, RangeSlider, Select, Slider, notify } from '@ui'
import type { Option } from '@ui'
import form from '@renderer/features/shared/form.module.scss'

const MODE_OPTIONS: Option<FramesMode>[] = [
  { label: 'Single frame at timestamp', value: 'single' },
  { label: 'Every N seconds (sequence)', value: 'interval' },
  { label: 'All frames in a segment', value: 'segment' }
]

const FORMAT_OPTIONS: Option<FrameFormat>[] = [
  { label: 'PNG (lossless)', value: 'png' },
  { label: 'JPG', value: 'jpg' }
]

/** Insert a printf frame counter before the extension: name.png → name_%04d.png */
function toPattern(path: string): string {
  const dot = path.lastIndexOf('.')
  if (dot === -1) return `${path}_%04d`
  return `${path.slice(0, dot)}_%04d${path.slice(dot)}`
}

export function FramesPanel({ media }: { media: MediaInfo }): JSX.Element {
  const startJob = useJobStore((s) => s.start)
  const duration = media.format.duration ?? 0

  const [mode, setMode] = useState<FramesMode>('single')
  const [timestamp, setTimestamp] = useState(0)
  const [intervalSeconds, setIntervalSeconds] = useState(5)
  const [range, setRange] = useState<[number, number]>([0, duration])
  // The time the segment preview frame should show — whichever handle moved.
  const [previewTime, setPreviewTime] = useState(0)
  const [segmentFps, setSegmentFps] = useState<number | undefined>(undefined)
  const [format, setFormat] = useState<FrameFormat>('png')
  const [quality, setQuality] = useState(3)
  const [output, setOutput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    void api
      .suggestOutput({ input: media.path, container: format, suffix: 'frame' })
      .then((p) => {
        if (!cancelled) setOutput(p)
      })
    return () => {
      cancelled = true
    }
  }, [media.path, format])

  useEffect(() => {
    setTimestamp(0)
    setRange([0, media.format.duration ?? 0])
    setPreviewTime(0)
  }, [media.path, media.format.duration])

  const [segStart, segEnd] = range
  const segLength = Math.max(0, segEnd - segStart)

  const onRangeChange = (next: [number, number]): void => {
    const [ns, ne] = next
    const [ps, pe] = range
    if (ns !== ps) setPreviewTime(ns)
    else if (ne !== pe) setPreviewTime(ne)
    setRange(next)
  }

  // A numbered sequence is written for interval + segment modes.
  const isSequence = mode === 'interval' || mode === 'segment'

  const onSubmit = async (): Promise<void> => {
    if (!output) return notify.warning('Choose an output path first')
    if (mode === 'segment' && segLength <= 0) {
      return notify.warning('Select a non-empty segment')
    }
    const finalOutput = isSequence ? toPattern(output) : output
    setSubmitting(true)
    try {
      await startJob({
        kind: 'frames',
        input: media.path,
        output: finalOutput,
        options: {
          mode,
          timestamp: mode === 'single' ? timestamp : undefined,
          intervalSeconds: mode === 'interval' ? intervalSeconds : undefined,
          start: mode === 'segment' ? segStart : undefined,
          end: mode === 'segment' ? segEnd : undefined,
          fps: mode === 'segment' ? segmentFps : undefined,
          format,
          quality: format === 'jpg' ? quality : undefined
        }
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Panel title="Extract frames / thumbnails">
      {mode === 'single' && (
        <div style={{ marginBottom: 20 }}>
          <MediaPreview media={media} start={timestamp} end={duration} previewTime={timestamp} />
        </div>
      )}

      {mode === 'segment' && (
        <div style={{ marginBottom: 20 }}>
          <MediaPreview media={media} start={segStart} end={segEnd} previewTime={previewTime} />
        </div>
      )}

      <div className={form.grid}>
        <Field label="Mode">
          <Select value={mode} options={MODE_OPTIONS} onChange={setMode} />
        </Field>

        {mode === 'single' && (
          <Field label={`Timestamp — ${formatDuration(timestamp, true)}`}>
            <Slider
              value={timestamp}
              min={0}
              max={duration || 1}
              step={0.05}
              onChange={setTimestamp}
              tooltipFormatter={(v) => formatDuration(v, true)}
            />
          </Field>
        )}

        {mode === 'interval' && (
          <Field label="Interval" hint="Seconds between captured frames">
            <NumberField
              value={intervalSeconds}
              min={0.1}
              step={0.5}
              onChange={(v) => setIntervalSeconds(v ?? 1)}
              addonAfter="s"
            />
          </Field>
        )}

        {mode === 'segment' && (
          <Field
            label={`Segment — ${formatDuration(segStart, true)} → ${formatDuration(segEnd, true)} (${formatDuration(segLength, true)})`}
          >
            <RangeSlider
              value={range}
              min={0}
              max={duration || 1}
              step={0.05}
              onChange={onRangeChange}
              tooltipFormatter={(v) => formatDuration(v, true)}
            />
          </Field>
        )}

        {mode === 'segment' && (
          <Field label="Sample rate" hint="Frames per second — blank captures every frame">
            <NumberField
              value={segmentFps}
              min={0.1}
              step={1}
              onChange={setSegmentFps}
              placeholder="every frame"
              addonAfter="fps"
            />
          </Field>
        )}

        <Field label="Image format">
          <Select<FrameFormat> value={format} options={FORMAT_OPTIONS} onChange={setFormat} />
        </Field>

        {format === 'jpg' && (
          <Field label="JPG quality" hint="2 (best) – 31 (worst)">
            <NumberField value={quality} min={2} max={31} onChange={(v) => setQuality(v ?? 3)} />
          </Field>
        )}
      </div>

      {isSequence && (
        <p className={form.hintRow}>
          A numbered sequence will be written (e.g. <code>name_0001.{format}</code>).
        </p>
      )}

      <div className={form.footer}>
        <OutputPathField value={output} onChange={setOutput} ext={format} />
        <Button
          variant="primary"
          icon={<PictureOutlined />}
          loading={submitting}
          onClick={() => void onSubmit()}
        >
          {mode === 'single' ? 'Extract frame' : 'Extract frames'}
        </Button>
      </div>
    </Panel>
  )
}
