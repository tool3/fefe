import { Slider as AntSlider } from 'antd'

export interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange?: (value: number) => void
  tooltipFormatter?: (value: number) => string
  disabled?: boolean
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  tooltipFormatter,
  disabled
}: SliderProps): JSX.Element {
  return (
    <AntSlider
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(v) => onChange?.(v as number)}
      tooltip={tooltipFormatter ? { formatter: (v) => tooltipFormatter(v ?? 0) } : undefined}
    />
  )
}
