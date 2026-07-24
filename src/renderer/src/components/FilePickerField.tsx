import { FileAddOutlined } from '@ant-design/icons'
import { api } from '@renderer/lib/api'
import { Button, Field, TextField } from '@ui'
import styles from './OutputPathField.module.scss'

export interface FilePickerFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  filters?: { name: string; extensions: string[] }[]
}

/** A labelled input for choosing a single existing file via the OS dialog. */
export function FilePickerField({
  value,
  onChange,
  label = 'File',
  placeholder = 'Choose a file…',
  filters
}: FilePickerFieldProps): JSX.Element {
  const browse = async (): Promise<void> => {
    const [chosen] = await api.pickFiles({ multi: false, filters })
    if (chosen) onChange(chosen)
  }

  return (
    <Field label={label}>
      <div className={styles.row}>
        <TextField value={value} onChange={onChange} placeholder={placeholder} />
        <Button icon={<FileAddOutlined />} onClick={() => void browse()}>
          Browse…
        </Button>
      </div>
    </Field>
  )
}
