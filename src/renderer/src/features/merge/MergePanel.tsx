import { useEffect, useState } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  MergeCellsOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { OutputPathField } from '@renderer/components/OutputPathField'
import { api } from '@renderer/lib/api'
import { useMediaStore } from '@renderer/store/mediaStore'
import { useJobStore } from '@renderer/store/jobStore'
import type { ConcatMode } from '@shared/types'
import { Button, EmptyState, Field, Panel, Select, notify } from '@ui'
import type { Option } from '@ui'
import form from '@renderer/features/shared/form.module.scss'
import styles from './MergePanel.module.scss'

const MODE_OPTIONS: Option<ConcatMode>[] = [
  { label: 'Stream copy (fast — inputs must match)', value: 'copy' },
  { label: 'Re-encode (safe — normalizes inputs)', value: 'reencode' }
]

function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}

function extOf(path: string): string {
  return path.split('.').pop()?.toLowerCase() || 'mp4'
}

export function MergePanel(): JSX.Element {
  const startJob = useJobStore((s) => s.start)
  // Seed the merge list from files already loaded in the library.
  const [files, setFiles] = useState<string[]>(() =>
    useMediaStore.getState().files.map((f) => f.path)
  )
  const [mode, setMode] = useState<ConcatMode>('copy')
  const [output, setOutput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const ext = files.length ? extOf(files[0]) : 'mp4'

  useEffect(() => {
    if (!files.length) return
    let cancelled = false
    void api.suggestOutput({ input: files[0], container: ext, suffix: 'merged' }).then((p) => {
      if (!cancelled) setOutput(p)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files[0], ext])

  const addFiles = async (): Promise<void> => {
    const picked = await api.pickFiles({ multi: true })
    if (picked.length) setFiles((prev) => [...prev, ...picked.filter((p) => !prev.includes(p))])
  }

  const move = (index: number, delta: number): void => {
    setFiles((prev) => {
      const next = [...prev]
      const target = index + delta
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const remove = (index: number): void => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (): Promise<void> => {
    if (files.length < 2) return notify.warning('Add at least two files to merge')
    if (!output) return notify.warning('Choose an output path first')
    setSubmitting(true)
    try {
      await startJob({ kind: 'concat', inputs: files, output, options: { mode } })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Panel
      title="Merge / concatenate"
      extra={
        <Button size="small" icon={<PlusOutlined />} onClick={() => void addFiles()}>
          Add files
        </Button>
      }
    >
      {files.length === 0 ? (
        <EmptyState description="Add two or more files to merge, in order">
          <Button variant="primary" icon={<PlusOutlined />} onClick={() => void addFiles()}>
            Add files
          </Button>
        </EmptyState>
      ) : (
        <ol className={styles.list}>
          {files.map((path, i) => (
            <li key={path} className={styles.item}>
              <span className={styles.index}>{i + 1}</span>
              <span className={styles.name} title={path}>
                {baseName(path)}
              </span>
              <div className={styles.itemActions}>
                <Button
                  variant="text"
                  size="small"
                  icon={<ArrowUpOutlined />}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  title="Move up"
                />
                <Button
                  variant="text"
                  size="small"
                  icon={<ArrowDownOutlined />}
                  disabled={i === files.length - 1}
                  onClick={() => move(i, 1)}
                  title="Move down"
                />
                <Button
                  variant="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => remove(i)}
                  title="Remove"
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className={styles.modeRow}>
        <Field label="Join method" hint="Stream copy needs identical codecs, resolution and frame rate">
          <Select<ConcatMode> value={mode} options={MODE_OPTIONS} onChange={setMode} />
        </Field>
      </div>

      <div className={form.footer}>
        <OutputPathField value={output} onChange={setOutput} ext={ext} />
        <Button
          variant="primary"
          icon={<MergeCellsOutlined />}
          loading={submitting}
          onClick={() => void onSubmit()}
        >
          Merge {files.length > 0 ? `${files.length} files` : ''}
        </Button>
      </div>
    </Panel>
  )
}
