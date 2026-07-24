/**
 * Library-agnostic prop contracts for the UI layer.
 *
 * Feature code depends ONLY on these types and the components in this folder —
 * never on antd directly. To swap the component library, reimplement the
 * components here against these same contracts; nothing else changes.
 */
import type { ReactNode } from 'react'

export type Variant = 'primary' | 'default' | 'ghost' | 'danger' | 'text'
export type Size = 'small' | 'middle' | 'large'
export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'processing'

export interface Option<T extends string | number = string> {
  label: ReactNode
  value: T
  disabled?: boolean
}

export interface Column<Row> {
  key: string
  title: ReactNode
  /** Cell renderer; receives the row. */
  render: (row: Row) => ReactNode
  width?: number | string
  align?: 'left' | 'right' | 'center'
}
