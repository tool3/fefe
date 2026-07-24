import { Select as AntSelect } from 'antd'
import type { Option, Size } from './types'

export interface SelectProps<T extends string | number = string> {
  value?: T
  options: Option<T>[]
  onChange?: (value: T) => void
  placeholder?: string
  size?: Size
  disabled?: boolean
  allowClear?: boolean
  style?: React.CSSProperties
}

export function Select<T extends string | number = string>({
  value,
  options,
  onChange,
  placeholder,
  size = 'middle',
  disabled,
  allowClear,
  style
}: SelectProps<T>): JSX.Element {
  return (
    <AntSelect<T>
      value={value}
      options={options}
      onChange={(v) => onChange?.(v)}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      allowClear={allowClear}
      style={{ width: '100%', ...style }}
    />
  )
}
