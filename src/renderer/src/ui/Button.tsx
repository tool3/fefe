import { Button as AntButton } from 'antd'
import type { ReactNode } from 'react'
import type { Size, Variant } from './types'

export interface ButtonProps {
  children?: ReactNode
  variant?: Variant
  size?: Size
  icon?: ReactNode
  block?: boolean
  loading?: boolean
  disabled?: boolean
  htmlType?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  title?: string
}

function mapVariant(variant: Variant): {
  type: 'primary' | 'default' | 'text'
  danger?: boolean
  ghost?: boolean
} {
  switch (variant) {
    case 'primary':
      return { type: 'primary' }
    case 'danger':
      return { type: 'primary', danger: true }
    case 'ghost':
      return { type: 'default', ghost: true }
    case 'text':
      return { type: 'text' }
    default:
      return { type: 'default' }
  }
}

export function Button({
  children,
  variant = 'default',
  size = 'middle',
  icon,
  block,
  loading,
  disabled,
  htmlType = 'button',
  onClick,
  title
}: ButtonProps): JSX.Element {
  const mapped = mapVariant(variant)
  return (
    <AntButton
      type={mapped.type}
      danger={mapped.danger}
      ghost={mapped.ghost}
      size={size}
      icon={icon}
      block={block}
      loading={loading}
      disabled={disabled}
      htmlType={htmlType}
      onClick={onClick}
      title={title}
    >
      {children}
    </AntButton>
  )
}
