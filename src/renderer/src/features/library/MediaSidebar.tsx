import { CloseOutlined, VideoCameraOutlined, SoundOutlined } from '@ant-design/icons'
import { FileDrop } from '@renderer/components/FileDrop'
import { formatDuration } from '@renderer/lib/format'
import { useMediaStore } from '@renderer/store/mediaStore'
import type { MediaInfo } from '@shared/types'
import styles from './MediaSidebar.module.scss'

function isAudioOnly(info: MediaInfo): boolean {
  return info.streams.some((s) => s.kind === 'audio') && !info.streams.some((s) => s.kind === 'video')
}

export function MediaSidebar(): JSX.Element {
  const files = useMediaStore((s) => s.files)
  const activePath = useMediaStore((s) => s.activePath)
  const setActive = useMediaStore((s) => s.setActive)
  const remove = useMediaStore((s) => s.remove)

  return (
    <aside className={styles.sidebar}>
      <div className={styles.dropWrap}>
        <FileDrop />
      </div>
      <div className={styles.list}>
        {files.map((f) => (
          <button
            key={f.path}
            className={`${styles.item} ${f.path === activePath ? styles.itemActive : ''}`}
            onClick={() => setActive(f.path)}
            type="button"
          >
            <span className={styles.itemIcon}>
              {isAudioOnly(f) ? <SoundOutlined /> : <VideoCameraOutlined />}
            </span>
            <span className={styles.itemBody}>
              <span className={styles.itemName} title={f.path}>
                {f.fileName}
              </span>
              <span className={styles.itemMeta}>{formatDuration(f.format.duration)}</span>
            </span>
            <span
              className={styles.remove}
              onClick={(e) => {
                e.stopPropagation()
                remove(f.path)
              }}
              role="button"
              aria-label="Remove"
            >
              <CloseOutlined />
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
