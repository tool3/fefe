import { Tag } from 'antd'
import type { ReactNode } from 'react'
import type { StatusTone } from './types'

export interface BadgeProps {
  tone?: StatusTone
  children: ReactNode
}

function mapColor(tone: StatusTone): string | undefined {
  switch (tone) {
    case 'info':
      return 'blue'
    case 'success':
      return 'green'
    case 'warning':
      return 'gold'
    case 'error':
      return 'red'
    case 'processing':
      return 'processing'
    default:
      return 'default'
  }
}

export function Badge({ tone = 'neutral', children }: BadgeProps): JSX.Element {
  return <Tag color={mapColor(tone)}>{children}</Tag>
}



