import { Progress } from 'antd'
import type { StatusTone } from './types'

export interface ProgressBarProps {
  /** 0..1, or -1 for indeterminate. */
  value: number
  tone?: StatusTone
  showInfo?: boolean
}

function mapStatus(tone: StatusTone): 'success' | 'exception' | 'active' | 'normal' {
  switch (tone) {
    case 'success':
      return 'success'
    case 'error':
      return 'exception'
    case 'processing':
      return 'active'
    default:
      return 'normal'
  }
}

export function ProgressBar({ value, tone = 'processing', showInfo = true }: ProgressBarProps): JSX.Element {
  const indeterminate = value < 0
  const percent = indeterminate ? 100 : Math.round(value * 100)
  return (
    <Progress
      percent={percent}
      status={indeterminate ? 'active' : mapStatus(tone)}
      showInfo={showInfo && !indeterminate}
      size="small"
    />
  )
}
