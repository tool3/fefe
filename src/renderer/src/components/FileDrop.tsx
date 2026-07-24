import { InboxOutlined } from '@ant-design/icons'
import { useCallback, useState } from 'react'
import { api } from '@renderer/lib/api'
import { useMediaStore } from '@renderer/store/mediaStore'
import { Button } from '@ui'
import styles from './FileDrop.module.scss'

export function FileDrop(): JSX.Element {
  const addPaths = useMediaStore((s) => s.addPaths)
  const openDialog = useMediaStore((s) => s.openDialog)
  const loading = useMediaStore((s) => s.loading)
  const [dragging, setDragging] = useState(false)

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const paths = Array.from(e.dataTransfer.files)
        .map((f) => api.getPathForFile(f))
        .filter(Boolean)
      if (paths.length) void addPaths(paths)
    },
    [addPaths]
  )

  return (
    <div
      className={`${styles.drop} ${dragging ? styles.active : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <InboxOutlined className={styles.icon} />
      <p className={styles.hint}>Drag media here</p>
      <Button variant="primary" size="small" loading={loading} onClick={() => void openDialog()}>
        Choose files…
      </Button>
    </div>
  )
}
