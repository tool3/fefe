import { Tooltip as AntTooltip } from 'antd'
import type { ReactNode } from 'react'

export interface TooltipProps {
  title: ReactNode
  children: ReactNode
}

export function Tooltip({ title, children }: TooltipProps): JSX.Element {
  return <AntTooltip title={title}>{children}</AntTooltip>
}
