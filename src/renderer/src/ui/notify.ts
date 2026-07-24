import { message } from 'antd'

/**
 * Toast notifications, abstracted so features don't import antd's `message`
 * directly. Swap the implementation here to change libraries.
 */
export const notify = {
  success: (content: string): void => void message.success(content),
  error: (content: string): void => void message.error(content),
  info: (content: string): void => void message.info(content),
  warning: (content: string): void => void message.warning(content)
}
