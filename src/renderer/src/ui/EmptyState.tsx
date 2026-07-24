import { Empty } from 'antd'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  description?: ReactNode
  children?: ReactNode
}

export function EmptyState({ description, children }: EmptyStateProps): JSX.Element {
  return (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description}>
      {children}
    </Empty>
  )
}
