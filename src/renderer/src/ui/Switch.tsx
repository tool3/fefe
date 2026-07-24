import { Switch as AntSwitch } from 'antd'

export interface SwitchProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ checked, onChange, disabled }: SwitchProps): JSX.Element {
  return <AntSwitch checked={checked} onChange={onChange} disabled={disabled} />
}
