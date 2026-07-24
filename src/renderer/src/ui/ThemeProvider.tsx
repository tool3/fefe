import { App, ConfigProvider, theme } from 'antd'
import type { ReactNode } from 'react'

export interface ThemeProviderProps {
  children: ReactNode
}

/**
 * Central theme configuration. Everything visual that antd controls is tuned
 * here so it stays in sync with the SCSS custom properties in styles/global.scss.
 */
export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimaryBg: '#12233a',
          colorPrimary: '#3b82f6',
          colorBgBase: '#141414',
          colorBgContainer: '#1c1c1e',
          borderRadius: 8,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        }
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}
