import { useEffect, useState } from 'react'
import { FontColorsOutlined } from '@ant-design/icons'
import { FilePickerField } from '@renderer/components/FilePickerField'
import { OutputPathField } from '@renderer/components/OutputPathField'
import { api } from '@renderer/lib/api'
import { useJobStore } from '@renderer/store/jobStore'
import type { MediaInfo, SubtitleMode } from '@shared/types'
import { Button, Field, Panel, Select, notify } from '@ui'
import type { Option } from '@ui'
import form from '@renderer/features/shared/form.module.scss'

const MODE_OPTIONS: Option<SubtitleMode>[] = [
  { label: 'Burn in (hardcode into video)', value: 'burn' },
  { label: 'Soft track (toggleable, muxed)', value: 'mux' }
]

function extOf(path: string): string {
  return path.split('.').pop()?.toLowerCase() || 'mp4'
}

export function SubtitlesPanel({ media }: { media: MediaInfo }): JSX.Element {
  const startJob = useJobStore((s) => s.start)
  const ext = extOf(media.path)

  const [subtitlePath, setSubtitlePath] = useState('')
  const [mode, setMode] = useState<SubtitleMode>('burn')
  const [output, setOutput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    void api.suggestOutput({ input: media.path, container: ext, suffix: 'subbed' }).then((p) => {
      if (!cancelled) setOutput(p)
    })
    return () => {
      cancelled = true
    }
  }, [media.path, ext])

  const onSubmit = async (): Promise<void> => {
    if (!subtitlePath) return notify.warning('Choose a subtitle file')
    if (!output) return notify.warning('Choose an output path first')
    setSubmitting(true)
    try {
      await startJob({
        kind: 'subtitles',
        input: media.path,
        output,
        options: { subtitlePath, mode }
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Panel title="Subtitles / captions">
      <div className={form.grid}>
        <FilePickerField
          label="Subtitle file"
          value={subtitlePath}
          onChange={setSubtitlePath}
          placeholder="Choose .srt / .ass / .vtt…"
          filters={[
            { name: 'Subtitles', extensions: ['srt', 'ass', 'ssa', 'vtt'] },
            { name: 'All Files', extensions: ['*'] }
          ]}
        />
        <Field label="Method" hint={mode === 'burn' ? 'Rendered permanently into the picture' : 'Kept as a separate switchable track'}>
          <Select<SubtitleMode> value={mode} options={MODE_OPTIONS} onChange={setMode} />
        </Field>
      </div>

      <div className={form.footer}>
        <OutputPathField value={output} onChange={setOutput} ext={ext} />
        <Button
          variant="primary"
          icon={<FontColorsOutlined />}
          loading={submitting}
          onClick={() => void onSubmit()}
        >
          {mode === 'burn' ? 'Burn subtitles' : 'Add subtitle track'}
        </Button>
      </div>
    </Panel>
  )
}
