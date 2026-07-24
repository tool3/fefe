import { Input, InputNumber } from 'antd'
import type { ReactNode } from 'react'
import type { Size } from './types'
import styles from './Field.module.scss'

export interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  children: ReactNode
}

/** A labelled form row, used to wrap any control. */
export function Field({ label, hint, children }: FieldProps): JSX.Element {
  return (
    <label className={styles.field}>
      {label !== undefined && <span className={styles.label}>{label}</span>}
      {children}
      {hint !== undefined && <span className={styles.hint}>{hint}</span>}
    </label>
  )
}

export interface TextFieldProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  size?: Size
  disabled?: boolean
  addonAfter?: ReactNode
}

export function TextField({
  value,
  onChange,
  placeholder,
  size = 'middle',
  disabled,
  addonAfter
}: TextFieldProps): JSX.Element {
  return (
    <Input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      addonAfter={addonAfter}
    />
  )
}

export interface NumberFieldProps {
  value?: number
  onChange?: (value: number | undefined) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  size?: Size
  disabled?: boolean
  addonAfter?: ReactNode
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  size = 'middle',
  disabled,
  addonAfter
}: NumberFieldProps): JSX.Element {
  return (
    <InputNumber
      value={value}
      onChange={(v) => onChange?.(v ?? undefined)}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      addonAfter={addonAfter}
      style={{ width: '100%' }}
    />
  )
}
