import { Tabs as AntTabs } from 'antd'
import type { ReactNode } from 'react'

export interface TabItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  children: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  items: TabItem[]
  activeKey?: string
  onChange?: (key: string) => void
}

export function Tabs({ items, activeKey, onChange }: TabsProps): JSX.Element {
  return (
    <AntTabs
      activeKey={activeKey}
      onChange={onChange}
      items={items.map((it) => ({
        key: it.key,
        label: it.label,
        icon: it.icon,
        children: it.children,
        disabled: it.disabled
      }))}
    />
  )
}
