import { FolderOpenOutlined } from '@ant-design/icons'
import { api } from '@renderer/lib/api'
import { Button, Field, TextField } from '@ui'
import styles from './OutputPathField.module.scss'

export interface OutputPathFieldProps {
  value: string
  onChange: (value: string) => void
  /** Output file extension without the dot, e.g. "mp4", "png", "srt". */
  ext: string
  label?: string
}

export function OutputPathField({
  value,
  onChange,
  ext,
  label = 'Output file'
}: OutputPathFieldProps): JSX.Element {
  const browse = async (): Promise<void> => {
    const chosen = await api.saveFile({
      defaultPath: value || undefined,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }]
    })
    if (chosen) onChange(chosen)
  }

  return (
    <Field label={label}>
      <div className={styles.row}>
        <TextField value={value} onChange={onChange} placeholder="Choose an output path…" />
        <Button icon={<FolderOpenOutlined />} onClick={() => void browse()}>
          Browse…
        </Button>
      </div>
    </Field>
  )
}
