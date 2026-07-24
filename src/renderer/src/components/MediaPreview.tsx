import { useCallback, useEffect, useRef, useState } from 'react'
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  SoundOutlined
} from '@ant-design/icons'
import { formatDuration } from '@renderer/lib/format'
import { toMediaUrl } from '@shared/media'
import type { MediaInfo } from '@shared/types'
import { Button } from '@ui'
import styles from './MediaPreview.module.scss'

export interface MediaPreviewProps {
  media: MediaInfo
  /** Start of the region to preview, in seconds. */
  start: number
  /** End of the region to preview, in seconds. */
  end: number
  /**
   * The time the paused frame should show — typically the handle currently
   * being dragged. Changing it seeks the video (while paused) so scrubbing
   * either the start or end handle updates the visible frame.
   */
  previewTime: number
}

/**
 * Previews only the selected [start, end] region: scrubbing a handle seeks the
 * frame live, and "Play selection" loops playback within the range. The clock
 * is driven by requestAnimationFrame for smooth updates (the native
 * `timeupdate` event only fires ~4×/sec).
 */
export function MediaPreview({
  media,
  start,
  end,
  previewTime
}: MediaPreviewProps): JSX.Element {
  const hasVideo = media.streams.some((s) => s.kind === 'video')
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(previewTime)

  // Live values read inside imperative callbacks, to avoid stale closures.
  const startRef = useRef(start)
  const endRef = useRef(end)
  const playingRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  startRef.current = start
  endRef.current = end

  const seekTo = useCallback((t: number) => {
    const el = ref.current
    if (!el) return
    const target = Math.max(0, t)
    try {
      el.currentTime = target
      setCurrent(target)
    } catch {
      /* metadata not ready — the loadedmetadata handler re-seeks */
    }
  }, [])

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const loop = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (el.currentTime >= endRef.current) {
      el.pause()
      seekTo(startRef.current)
      return
    }
    setCurrent(el.currentTime)
    rafRef.current = requestAnimationFrame(loop)
  }, [seekTo])

  // Follow whichever handle is being dragged, but only while paused.
  useEffect(() => {
    if (!playingRef.current) seekTo(previewTime)
  }, [previewTime, seekTo])

  // Reset when the active file changes.
  useEffect(() => {
    stopLoop()
    setPlaying(false)
    playingRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.path])

  useEffect(() => stopLoop, [stopLoop])

  const togglePlay = (): void => {
    const el = ref.current
    if (!el) return
    if (playingRef.current) {
      el.pause()
      return
    }
    seekTo(startRef.current) // always (re)start from the current selection start
    void el.play()
  }

  const onPlay = (): void => {
    setPlaying(true)
    playingRef.current = true
    stopLoop()
    rafRef.current = requestAnimationFrame(loop)
  }

  const onPause = (): void => {
    setPlaying(false)
    playingRef.current = false
    stopLoop()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.stage}>
        <video
          ref={ref}
          className={styles.video}
          src={toMediaUrl(media.path)}
          preload="auto"
          onLoadedMetadata={() => seekTo(previewTime)}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onPause}
        />
        {!hasVideo && (
          <div className={styles.audioOverlay}>
            <SoundOutlined className={styles.audioIcon} />
            <span>{media.fileName}</span>
          </div>
        )}
      </div>
      <div className={styles.controls}>
        <Button
          variant="primary"
          size="small"
          icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={togglePlay}
        >
          {playing ? 'Pause' : 'Play selection'}
        </Button>
        <span className={styles.time}>
          {formatDuration(current, true)}{' '}
          <span className={styles.dim}>/ {formatDuration(end, true)}</span>
        </span>
      </div>
    </div>
  )
}
