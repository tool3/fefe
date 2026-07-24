import type { MediaInfo, MediaStream } from '@shared/types'
import {
  formatBitrate,
  formatBytes,
  formatDuration,
  formatResolution
} from '@renderer/lib/format'
import { Badge, DataTable, Panel } from '@ui'
import type { Column, StatusTone } from '@ui'
import styles from './Inspector.module.scss'

function toneForKind(kind: MediaStream['kind']): StatusTone {
  switch (kind) {
    case 'video':
      return 'info'
    case 'audio':
      return 'success'
    case 'subtitle':
      return 'warning'
    default:
      return 'neutral'
  }
}

function streamDetails(s: MediaStream): string {
  if (s.kind === 'video') {
    const parts = [formatResolution(s.width, s.height)]
    if (s.frameRate) parts.push(`${s.frameRate} fps`)
    if (s.pixelFormat) parts.push(s.pixelFormat)
    return parts.join(' · ')
  }
  if (s.kind === 'audio') {
    const parts: string[] = []
    if (s.channelLayout) parts.push(s.channelLayout)
    else if (s.channels) parts.push(`${s.channels} ch`)
    if (s.sampleRate) parts.push(`${Math.round(s.sampleRate / 1000)} kHz`)
    return parts.join(' · ') || '—'
  }
  return s.title ?? '—'
}

const columns: Column<MediaStream>[] = [
  { key: 'index', title: '#', width: 44, render: (s) => s.index },
  {
    key: 'kind',
    title: 'Type',
    width: 96,
    render: (s) => <Badge tone={toneForKind(s.kind)}>{s.kind}</Badge>
  },
  {
    key: 'codec',
    title: 'Codec',
    render: (s) => s.codecName ?? '—'
  },
  { key: 'details', title: 'Details', render: streamDetails },
  {
    key: 'bitrate',
    title: 'Bitrate',
    width: 110,
    align: 'right',
    render: (s) => formatBitrate(s.bitRate)
  },
  {
    key: 'lang',
    title: 'Lang',
    width: 70,
    render: (s) => s.language ?? '—'
  }
]

function SummaryItem({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className={styles.summaryItem}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </div>
  )
}

export function Inspector({ media }: { media: MediaInfo }): JSX.Element {
  const { format } = media
  return (
    <div className={styles.wrap}>
      <Panel title="Overview">
        <div className={styles.summary}>
          <SummaryItem label="Container" value={format.formatName ?? '—'} />
          <SummaryItem label="Duration" value={formatDuration(format.duration, true)} />
          <SummaryItem label="Size" value={formatBytes(format.size)} />
          <SummaryItem label="Overall bitrate" value={formatBitrate(format.bitRate)} />
          <SummaryItem label="Streams" value={String(format.nbStreams ?? media.streams.length)} />
        </div>
        <p className={styles.path} title={media.path}>
          {media.path}
        </p>
      </Panel>

      <Panel title="Streams" flush>
        <DataTable<MediaStream>
          columns={columns}
          rows={media.streams}
          rowKey={(s) => String(s.index)}
        />
      </Panel>
    </div>
  )
}
