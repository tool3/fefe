/**
 * The UI abstraction barrel. Import UI primitives from `@ui` only.
 *
 *   import { Button, Select, Panel } from '@ui'
 *
 * No feature file should import from 'antd' directly — that keeps the
 * component library a single, swappable dependency confined to this folder.
 */
export { Button } from './Button'
export type { ButtonProps } from './Button'

export { Select } from './Select'
export type { SelectProps } from './Select'

export { Field, TextField, NumberField } from './Field'
export type { FieldProps, TextFieldProps, NumberFieldProps } from './Field'

export { Switch } from './Switch'
export type { SwitchProps } from './Switch'

export { RangeSlider } from './RangeSlider'
export type { RangeSliderProps } from './RangeSlider'

export { Slider } from './Slider'
export type { SliderProps } from './Slider'

export { Tabs } from './Tabs'
export type { TabItem, TabsProps } from './Tabs'

export { DataTable } from './DataTable'
export type { DataTableProps } from './DataTable'

export { ProgressBar } from './ProgressBar'
export type { ProgressBarProps } from './ProgressBar'

export { Badge } from './Badge'
export type { BadgeProps } from './Badge'

export { Panel } from './Panel'
export type { PanelProps } from './Panel'

export { Tooltip } from './Tooltip'
export type { TooltipProps } from './Tooltip'

export { EmptyState } from './EmptyState'
export type { EmptyStateProps } from './EmptyState'

export { ThemeProvider } from './ThemeProvider'
export { notify } from './notify'

export type { Option, Column, Variant, Size, StatusTone } from './types'
