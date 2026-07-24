import { useEffect, useState } from 'react'
import { AudioOutlined } from '@ant-design/icons'
import { FilePickerField } from '@renderer/components/FilePickerField'
import { OutputPathField } from '@renderer/components/OutputPathField'
import { api } from '@renderer/lib/api'
import { useJobStore } from '@renderer/store/jobStore'
import type { AudioMode, MediaInfo } from '@shared/types'
import { Button, Field, NumberField, Panel, Select, notify } from '@ui'
import type { Option } from '@ui'
import form from '@renderer/features/shared/form.module.scss'

const MODE_OPTIONS: Option<AudioMode>[] = [
  { label: 'Adjust (volume / sync)', value: 'adjust' },
  { label: 'Replace audio track', value: 'replace' }
]

function extOf(path: string): string {
  return path.split('.').pop()?.toLowerCase() || 'mp4'
}

export function AudioPanel({ media }: { media: MediaInfo }): JSX.Element {
  const startJob = useJobStore((s) => s.start)
  const ext = extOf(media.path)
  const hasVideo = media.streams.some((s) => s.kind === 'video')

  const [mode, setMode] = useState<AudioMode>('adjust')
  const [volume, setVolume] = useState(1)
  const [delaySeconds, setDelaySeconds] = useState(0)
  const [replacementAudioPath, setReplacementAudioPath] = useState('')
  const [output, setOutput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    void api.suggestOutput({ input: media.path, container: ext, suffix: 'audio' }).then((p) => {
      if (!cancelled) setOutput(p)
    })
    return () => {
      cancelled = true
    }
  }, [media.path, ext])

  const onSubmit = async (): Promise<void> => {
    if (!output) return notify.warning('Choose an output path first')
    if (mode === 'replace' && !replacementAudioPath) {
      return notify.warning('Choose a replacement audio file')
    }
    setSubmitting(true)
    try {
      await startJob({
        kind: 'audio',
        input: media.path,
        output,
        options: {
          mode,
          volume: volume !== 1 ? String(volume) : undefined,
          delaySeconds: delaySeconds !== 0 ? delaySeconds : undefined,
          replacementAudioPath: mode === 'replace' ? replacementAudioPath : undefined,
          hasVideo
        }
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Panel title="Audio — mixing, sync & volume">
      <div className={form.grid}>
        <Field label="Operation">
          <Select<AudioMode> value={mode} options={MODE_OPTIONS} onChange={setMode} />
        </Field>

        {mode === 'replace' && (
          <FilePickerField
            label="Replacement audio"
            value={replacementAudioPath}
            onChange={setReplacementAudioPath}
            placeholder="Choose an audio file…"
            filters={[
              { name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'opus'] },
              { name: 'All Files', extensions: ['*'] }
            ]}
          />
        )}

        <Field label={`Volume × ${volume}`} hint="1.0 = unchanged, 2.0 = +6 dB">
          <NumberField value={volume} min={0} max={16} step={0.1} onChange={(v) => setVolume(v ?? 1)} />
        </Field>

        <Field
          label="Audio delay"
          hint={hasVideo ? 'Shift audio to sync with video (± seconds)' : 'Positive delay pads the start'}
        >
          <NumberField
            value={delaySeconds}
            step={0.05}
            onChange={(v) => setDelaySeconds(v ?? 0)}
            addonAfter="s"
          />
        </Field>
      </div>

      <div className={form.footer}>
        <OutputPathField value={output} onChange={setOutput} ext={ext} />
        <Button
          variant="primary"
          icon={<AudioOutlined />}
          loading={submitting}
          onClick={() => void onSubmit()}
        >
          Apply audio changes
        </Button>
      </div>
    </Panel>
  )
}
