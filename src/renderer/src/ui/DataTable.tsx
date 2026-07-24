import { Table } from 'antd'
import type { Column } from './types'

export interface DataTableProps<Row> {
  columns: Column<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  size?: 'small' | 'middle' | 'large'
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  size = 'small'
}: DataTableProps<Row>): JSX.Element {
  return (
    <Table<Row>
      dataSource={rows}
      rowKey={rowKey}
      size={size}
      pagination={false}
      columns={columns.map((c) => ({
        key: c.key,
        title: c.title,
        width: c.width,
        align: c.align,
        render: (_v: unknown, row: Row) => c.render(row)
      }))}
    />
  )
}
