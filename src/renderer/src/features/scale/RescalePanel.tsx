import { useEffect, useState } from 'react'
import { ExpandOutlined } from '@ant-design/icons'
import { OutputPathField } from '@renderer/components/OutputPathField'
import { api } from '@renderer/lib/api'
import { useJobStore } from '@renderer/store/jobStore'
import type { MediaInfo, ScaleMode } from '@shared/types'
import { Button, Field, NumberField, Panel, Select, notify } from '@ui'
import type { Option } from '@ui'
import form from '@renderer/features/shared/form.module.scss'

const RESOLUTION_PRESETS: Option<string>[] = [
  { label: '2160p — 3840×2160', value: '3840x2160' },
  { label: '1440p — 2560×1440', value: '2560x1440' },
  { label: '1080p — 1920×1080', value: '1920x1080' },
  { label: '720p — 1280×720', value: '1280x720' },
  { label: '480p — 854×480', value: '854x480' },
  { label: '360p — 640×360', value: '640x360' },
  { label: 'Custom', value: 'custom' }
]

const MODE_OPTIONS: Option<ScaleMode>[] = [
  { label: 'Fit (keep aspect)', value: 'fit' },
  { label: 'Stretch (exact, distort)', value: 'stretch' },
  { label: 'Pad (letterbox)', value: 'pad' },
  { label: 'Crop (fill)', value: 'crop' }
]

function extOf(path: string): string {
  return path.split('.').pop()?.toLowerCase() || 'mp4'
}

export function RescalePanel({ media }: { media: MediaInfo }): JSX.Element {
  const startJob = useJobStore((s) => s.start)
  const ext = extOf(media.path)

  const [preset, setPreset] = useState('1280x720')
  const [width, setWidth] = useState(1280)
  const [height, setHeight] = useState(720)
  const [mode, setMode] = useState<ScaleMode>('fit')
  const [padColor, setPadColor] = useState('black')
  const [output, setOutput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    void api.suggestOutput({ input: media.path, container: ext, suffix: 'scaled' }).then((p) => {
      if (!cancelled) setOutput(p)
    })
    return () => {
      cancelled = true
    }
  }, [media.path, ext])

  const onPreset = (value: string): void => {
    setPreset(value)
    if (value !== 'custom') {
      const [w, h] = value.split('x').map(Number)
      setWidth(w)
      setHeight(h)
    }
  }

  const onSubmit = async (): Promise<void> => {
    if (!output) return notify.warning('Choose an output path first')
    if (!width || !height) return notify.warning('Set width and height')
    setSubmitting(true)
    try {
      await startJob({
        kind: 'scale',
        input: media.path,
        output,
        options: { width, height, mode, padColor: mode === 'pad' ? padColor : undefined }
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Panel title="Rescale / aspect ratio">
      <div className={form.grid}>
        <Field label="Resolution preset">
          <Select<string> value={preset} options={RESOLUTION_PRESETS} onChange={onPreset} />
        </Field>
        <Field label="Width">
          <NumberField
            value={width}
            min={1}
            onChange={(v) => {
              setWidth(v ?? 0)
              setPreset('custom')
            }}
          />
        </Field>
        <Field label="Height">
          <NumberField
            value={height}
            min={1}
            onChange={(v) => {
              setHeight(v ?? 0)
              setPreset('custom')
            }}
          />
        </Field>
        <Field label="Fit mode" hint="How the source maps into the target box">
          <Select<ScaleMode> value={mode} options={MODE_OPTIONS} onChange={setMode} />
        </Field>
        {mode === 'pad' && (
          <Field label="Pad colour" hint="Name or #rrggbb">
            <Select<string>
              value={padColor}
              onChange={setPadColor}
              options={[
                { label: 'Black', value: 'black' },
                { label: 'White', value: 'white' },
                { label: 'Gray', value: 'gray' }
              ]}
            />
          </Field>
        )}
      </div>

      <div className={form.footer}>
        <OutputPathField value={output} onChange={setOutput} ext={ext} />
        <Button
          variant="primary"
          icon={<ExpandOutlined />}
          loading={submitting}
          onClick={() => void onSubmit()}
        >
          Rescale
        </Button>
      </div>
    </Panel>
  )
}
