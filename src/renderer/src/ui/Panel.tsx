import type { ReactNode } from 'react'
import styles from './Panel.module.scss'

export interface PanelProps {
  title?: ReactNode
  extra?: ReactNode
  children: ReactNode
  /** Removes inner padding, for edge-to-edge content like tables. */
  flush?: boolean
}

export function Panel({ title, extra, children, flush }: PanelProps): JSX.Element {
  return (
    <section className={styles.panel}>
      {(title || extra) && (
        <header className={styles.header}>
          <span className={styles.title}>{title}</span>
          {extra && <span className={styles.extra}>{extra}</span>}
        </header>
      )}
      <div className={flush ? styles.bodyFlush : styles.body}>{children}</div>
    </section>
  )
}
