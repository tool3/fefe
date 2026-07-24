import { useEffect, useState } from 'react'
import {
  AudioOutlined,
  ExpandOutlined,
  FontColorsOutlined,
  InfoCircleOutlined,
  MergeCellsOutlined,
  PictureOutlined,
  ScissorOutlined,
  SwapOutlined
} from '@ant-design/icons'
import { AudioPanel } from '@renderer/features/audio/AudioPanel'
import { ConvertPanel } from '@renderer/features/convert/ConvertPanel'
import { FramesPanel } from '@renderer/features/frames/FramesPanel'
import { Inspector } from '@renderer/features/inspector/Inspector'
import { JobsDock } from '@renderer/features/jobs/JobsDock'
import { MediaSidebar } from '@renderer/features/library/MediaSidebar'
import { MergePanel } from '@renderer/features/merge/MergePanel'
import { RescalePanel } from '@renderer/features/scale/RescalePanel'
import { SubtitlesPanel } from '@renderer/features/subtitles/SubtitlesPanel'
import { TrimPanel } from '@renderer/features/trim/TrimPanel'
import { api } from '@renderer/lib/api'
import { useActiveMedia } from '@renderer/store/mediaStore'
import { useJobStore } from '@renderer/store/jobStore'
import { EmptyState, Tabs } from '@ui'
import styles from './App.module.scss'

export function App(): JSX.Element {
  const media = useActiveMedia()
  const initJobs = useJobStore((s) => s.init)
  const [version, setVersion] = useState('')
  const [tab, setTab] = useState('inspect')

  useEffect(() => initJobs(), [initJobs])

  useEffect(() => {
    void api.ffmpegVersion().then(setVersion)
  }, [])

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.logo}>Fefe</span>
          <span className={styles.tagline}>ffmpeg, with a face</span>
        </div>
        <span className={styles.version} title={version}>
          {version || 'locating ffmpeg…'}
        </span>
      </header>

      <div className={styles.body}>
        <MediaSidebar />

        <main className={styles.main}>
          {media ? (
            <Tabs
              activeKey={tab}
              onChange={setTab}
              items={[
                {
                  key: 'inspect',
                  label: 'Inspect',
                  icon: <InfoCircleOutlined />,
                  children: <Inspector media={media} />
                },
                {
                  key: 'convert',
                  label: 'Convert',
                  icon: <SwapOutlined />,
                  children: <ConvertPanel media={media} />
                },
                {
                  key: 'trim',
                  label: 'Trim',
                  icon: <ScissorOutlined />,
                  children: <TrimPanel media={media} />
                },
                {
                  key: 'merge',
                  label: 'Merge',
                  icon: <MergeCellsOutlined />,
                  children: <MergePanel />
                },
                {
                  key: 'rescale',
                  label: 'Rescale',
                  icon: <ExpandOutlined />,
                  children: <RescalePanel media={media} />
                },
                {
                  key: 'frames',
                  label: 'Frames',
                  icon: <PictureOutlined />,
                  children: <FramesPanel media={media} />
                },
                {
                  key: 'subtitles',
                  label: 'Subtitles',
                  icon: <FontColorsOutlined />,
                  children: <SubtitlesPanel media={media} />
                },
                {
                  key: 'audio',
                  label: 'Audio',
                  icon: <AudioOutlined />,
                  children: <AudioPanel media={media} />
                }
              ]}
            />
          ) : (
            <div className={styles.placeholder}>
              <EmptyState description="Add a media file to get started" />
            </div>
          )}
        </main>

        <JobsDock />
      </div>
    </div>
  )
}
