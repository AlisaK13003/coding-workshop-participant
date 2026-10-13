import { cx } from '../../utils/cx.js'
import './DataTable.css'

/**
 * Horizontally scrollable table driven by a column config.
 *
 * columns: [{ key, header, render: (row, index) => node }]
 * getRowKey: (row, index) => unique key
 * onRowClick: optional; makes rows clickable
 * getRowClassName: optional (row) => extra class for the <tr>
 */
export function DataTable({
  columns,
  rows,
  getRowKey,
  onRowClick,
  getRowClassName,
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              className={
                cx(onRowClick && 'clickable-row', getRowClassName?.(row)) ||
                undefined
              }
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <td key={column.key}>{column.render(row, index)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
