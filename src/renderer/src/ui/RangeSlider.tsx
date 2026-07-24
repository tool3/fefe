import { Slider } from 'antd'

export interface RangeSliderProps {
  value: [number, number]
  min: number
  max: number
  step?: number
  onChange?: (value: [number, number]) => void
  tooltipFormatter?: (value: number) => string
  disabled?: boolean
}

export function RangeSlider({
  value,
  min,
  max,
  step = 0.01,
  onChange,
  tooltipFormatter,
  disabled
}: RangeSliderProps): JSX.Element {
  return (
    <Slider
      range
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(v) => onChange?.(v as [number, number])}
      tooltip={tooltipFormatter ? { formatter: (v) => tooltipFormatter(v ?? 0) } : undefined}
    />
  )
}
