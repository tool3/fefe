import { useEffect, useMemo, useState } from 'react'
import { ThunderboltOutlined } from '@ant-design/icons'
import { OutputPathField } from '@renderer/components/OutputPathField'
import { api } from '@renderer/lib/api'
import { useJobStore } from '@renderer/store/jobStore'
import type { AudioCodec, Container, ConvertOptions, MediaInfo, VideoCodec } from '@shared/types'
import { Button, Field, NumberField, Panel, Select, notify } from '@ui'
import {
  AUDIO_BITRATE_OPTIONS,
  AUDIO_CODEC_OPTIONS,
  AUDIO_ONLY_CONTAINERS,
  CONTAINER_OPTIONS,
  PRESET_OPTIONS,
  VIDEO_CODEC_OPTIONS,
  codecUsesCrf,
  codecUsesPreset,
  defaultsForContainer
} from './presets'
import styles from './ConvertPanel.module.scss'

export function ConvertPanel({ media }: { media: MediaInfo }): JSX.Element {
  const startJob = useJobStore((s) => s.start)

  const [container, setContainer] = useState<Container>('mp4')
  const [videoCodec, setVideoCodec] = useState<VideoCodec>('libx264')
  const [audioCodec, setAudioCodec] = useState<AudioCodec>('aac')
  const [crf, setCrf] = useState<number>(23)
  const [videoBitrate, setVideoBitrate] = useState<string>('')
  const [audioBitrate, setAudioBitrate] = useState<string>('192k')
  const [preset, setPreset] = useState<string>('medium')
  const [width, setWidth] = useState<number | undefined>(undefined)
  const [height, setHeight] = useState<number | undefined>(undefined)
  const [fps, setFps] = useState<number | undefined>(undefined)
  const [output, setOutput] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const audioOnly = AUDIO_ONLY_CONTAINERS.includes(container)
  // GIF is encoded through a fixed palette pipeline (see buildArgs), so the
  // codec/quality controls don't apply — only size and frame rate do.
  const isGif = container === 'gif'

  // Apply codec defaults whenever the container changes.
  useEffect(() => {
    const d = defaultsForContainer(container)
    setVideoCodec(d.videoCodec)
    setAudioCodec(d.audioCodec)
  }, [container])

  // Suggest an output path when the input file or container changes.
  useEffect(() => {
    let cancelled = false
    void api.suggestOutput({ input: media.path, container }).then((p) => {
      if (!cancelled) setOutput(p)
    })
    return () => {
      cancelled = true
    }
  }, [media.path, container])

  const options: ConvertOptions = useMemo(
    () => ({
      container,
      videoCodec: audioOnly ? 'none' : videoCodec,
      audioCodec,
      crf: !audioOnly && codecUsesCrf(videoCodec) && !videoBitrate ? crf : undefined,
      videoBitrate: !audioOnly && videoBitrate ? videoBitrate : undefined,
      audioBitrate: audioCodec === 'copy' || audioCodec === 'none' ? undefined : audioBitrate,
      preset: !audioOnly && codecUsesPreset(videoCodec) ? preset : undefined,
      width,
      height,
      fps
    }),
    [
      container,
      audioOnly,
      videoCodec,
      audioCodec,
      crf,
      videoBitrate,
      audioBitrate,
      preset,
      width,
      height,
      fps
    ]
  )

  const onSubmit = async (): Promise<void> => {
    if (!output) {
      notify.warning('Choose an output path first')
      return
    }
    if (output === media.path) {
      notify.warning('Output path must differ from the input')
      return
    }
    setSubmitting(true)
    try {
      await startJob({ kind: 'convert', input: media.path, output, options })
    } finally {
      setSubmitting(false)
    }
  }

  const showVideoCodec = !audioOnly && !isGif
  const showCrf = showVideoCodec && codecUsesCrf(videoCodec) && !videoBitrate
  const showPreset = showVideoCodec && codecUsesPreset(videoCodec)
  const showAudioBitrate = !isGif && audioCodec !== 'copy' && audioCodec !== 'none'

  return (
    <Panel title="Convert / transcode">
      <div className={styles.grid}>
        <Field label="Container / format">
          <Select<Container>
            value={container}
            options={CONTAINER_OPTIONS}
            onChange={setContainer}
          />
        </Field>

        {showVideoCodec && (
          <Field label="Video codec">
            <Select<VideoCodec>
              value={videoCodec}
              options={VIDEO_CODEC_OPTIONS}
              onChange={setVideoCodec}
            />
          </Field>
        )}

        {!isGif && (
          <Field label="Audio codec">
            <Select<AudioCodec>
              value={audioCodec}
              options={AUDIO_CODEC_OPTIONS}
              onChange={setAudioCodec}
            />
          </Field>
        )}

        {showCrf && (
          <Field label={`Quality (CRF ${crf})`} hint="Lower = better quality, larger file">
            <NumberField value={crf} min={0} max={51} step={1} onChange={(v) => setCrf(v ?? 23)} />
          </Field>
        )}

        {showVideoCodec && (
          <Field label="Video bitrate" hint="Overrides CRF. e.g. 2M, 5000k">
            <Select<string>
              value={videoBitrate}
              onChange={setVideoBitrate}
              allowClear
              placeholder="Auto (use CRF)"
              options={[
                { label: '1 Mbps', value: '1M' },
                { label: '2 Mbps', value: '2M' },
                { label: '5 Mbps', value: '5M' },
                { label: '8 Mbps', value: '8M' }
              ]}
            />
          </Field>
        )}

        {showPreset && (
          <Field label="Encoding preset" hint="Slower = better compression">
            <Select<string> value={preset} options={PRESET_OPTIONS} onChange={setPreset} />
          </Field>
        )}

        {showAudioBitrate && (
          <Field label="Audio bitrate">
            <Select<string>
              value={audioBitrate}
              options={AUDIO_BITRATE_OPTIONS}
              onChange={setAudioBitrate}
            />
          </Field>
        )}

        {!audioOnly && (
          <>
            <Field label="Width" hint="Blank = keep source">
              <NumberField value={width} min={1} onChange={setWidth} placeholder="auto" />
            </Field>
            <Field label="Height" hint="Blank = keep source">
              <NumberField value={height} min={1} onChange={setHeight} placeholder="auto" />
            </Field>
            <Field label="Frame rate" hint="Blank = keep source">
              <NumberField value={fps} min={1} max={240} onChange={setFps} placeholder="auto" />
            </Field>
          </>
        )}
      </div>

      <div className={styles.footer}>
        <OutputPathField value={output} onChange={setOutput} ext={container} />
        <Button
          variant="primary"
          icon={<ThunderboltOutlined />}
          loading={submitting}
          onClick={() => void onSubmit()}
        >
          Start conversion
        </Button>
      </div>
    </Panel>
  )
}
